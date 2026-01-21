import Lead from "../models/Lead.js";
import Project from "../models/Project.js";
import Employee from "../models/Employee.js";
import Task from "../models/Task.js";
import Invoice from "../models/Invoice.js";

// Single comprehensive analytics endpoint
export const getDashboardAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Parallel aggregation queries for optimal performance
    const [
      leadMetrics,
      projectMetrics,
      invoiceMetrics,
      employeeCount,
      recentTasks,
      recentLeads,
      recentEmployees
    ] = await Promise.all([
      // Lead funnel metrics
      Lead.aggregate([
        {
          $group: {
            _id: null,
            totalLeads: { $sum: 1 },
            interestedLeads: { $sum: { $cond: ["$isInterested", 1, 0] } },
            meetingsScheduled: {
              $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ["$meetingDates", []] } }, 0] }, 1, 0] }
            },
            leadsConvertedToProjects: { $sum: { $cond: [{ $eq: ["$status", "Won"] }, 1, 0] } },
            lostLeads: { $sum: { $cond: [{ $eq: ["$status", "Lost"] }, 1, 0] } }
          }
        }
      ]),

      // Project and revenue metrics
      Project.aggregate([
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            activeProjects: { $sum: { $cond: [{ $in: ["$status", ["Active", "Start", "Progress", "Pending"]] }, 1, 0] } },
            completedProjects: { $sum: { $cond: [{ $in: ["$status", ["Completed", "Close"]] }, 1, 0] } },
            handoverPendingProjects: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
            onHoldProjects: { $sum: { $cond: [{ $eq: ["$status", "On Hold"] }, 1, 0] } },

            // Revenue calculations (single source)
            expectedRevenue: {
              $sum: {
                $cond: [
                  { $eq: ["$projectType", "ONE_TIME"] },
                  { $ifNull: ["$oneTimeProject.totalAmount", 0] },
                  { $ifNull: ["$recurringProject.recurringAmount", 0] }
                ]
              }
            },
            paidAmount: {
              $sum: {
                $cond: [
                  { $eq: ["$projectType", "ONE_TIME"] },
                  { $ifNull: ["$oneTimeProject.paidAmount", 0] },
                  0
                ]
              }
            },
            advanceAmount: {
              $sum: {
                $cond: [
                  { $eq: ["$projectType", "ONE_TIME"] },
                  { $ifNull: ["$oneTimeProject.advanceAmount", 0] },
                  0
                ]
              }
            },

            // Project type wise revenue
            oneTimeTotal: {
              $sum: {
                $cond: [
                  { $eq: ["$projectType", "ONE_TIME"] },
                  { $ifNull: ["$oneTimeProject.totalAmount", 0] },
                  0
                ]
              }
            },
            oneTimePaid: {
              $sum: {
                $cond: [
                  { $eq: ["$projectType", "ONE_TIME"] },
                  { $ifNull: ["$oneTimeProject.paidAmount", 0] },
                  0
                ]
              }
            },
            recurringMonthly: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ["$projectType", "RECURRING"] }, { $eq: ["$recurringProject.billingCycle", "Monthly"] }] },
                  { $ifNull: ["$recurringProject.recurringAmount", 0] },
                  0
                ]
              }
            },
            recurringYearly: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ["$projectType", "RECURRING"] }, { $eq: ["$recurringProject.billingCycle", "Yearly"] }] },
                  { $ifNull: ["$recurringProject.recurringAmount", 0] },
                  0
                ]
              }
            },

            // This month revenue
            thisMonthRevenue: {
              $sum: {
                $cond: [
                  { $gte: ["$createdAt", thisMonthStart] },
                  {
                    $cond: [
                      { $eq: ["$projectType", "ONE_TIME"] },
                      { $ifNull: ["$oneTimeProject.totalAmount", 0] },
                      { $ifNull: ["$recurringProject.recurringAmount", 0] }
                    ]
                  },
                  0
                ]
              }
            }
          }
        }
      ]),

      // Invoice metrics
      Invoice.aggregate([
        {
          $group: {
            _id: null,
            totalInvoices: { $sum: 1 },
            totalInvoiceAmount: { $sum: "$amountDetails.totalAmount" },
            overdueInvoiceCount: {
              $sum: { $cond: [{ $lt: ["$dueDate", now] }, 1, 0] }
            }
          }
        }
      ]),

      Employee.countDocuments(),

      // Recent data for lists
      Task.find({}, 'title description status updatedAt').sort({ updatedAt: -1 }).limit(3),
      Lead.find({}, 'name projectType createdAt status meetingDates').sort({ createdAt: -1 }).limit(3),
      Employee.find({}, 'name email employee_status employee_id contact1').sort({ createdAt: -1 }).limit(4)
    ]);

    // Process results with defaults
    const leads = leadMetrics[0] || { totalLeads: 0, interestedLeads: 0, meetingsScheduled: 0, leadsConvertedToProjects: 0, lostLeads: 0 };
    const projects = projectMetrics[0] || {
      totalProjects: 0, activeProjects: 0, completedProjects: 0, handoverPendingProjects: 0, onHoldProjects: 0,
      expectedRevenue: 0, paidAmount: 0, advanceAmount: 0, oneTimeTotal: 0, oneTimePaid: 0,
      recurringMonthly: 0, recurringYearly: 0, thisMonthRevenue: 0
    };
    const invoices = invoiceMetrics[0] || { totalInvoices: 0, totalInvoiceAmount: 0, overdueInvoiceCount: 0 };

    // Calculate derived values (single source of truth)
    const dueAmount = projects.expectedRevenue - projects.paidAmount;
    const oneTimeDue = projects.oneTimeTotal - projects.oneTimePaid;
    const recurringDue = projects.recurringMonthly + projects.recurringYearly; // Assuming all recurring is due

    // Get alerts data
    const upcomingMeetings = recentLeads.filter(lead =>
      lead.meetingDates?.some(meeting =>
        new Date(meeting.dateTime) >= now && new Date(meeting.dateTime) <= next7Days
      )
    );

    const upcomingBilling = await Project.find({
      projectType: "RECURRING",
      "recurringProject.autoRenew": true,
      "recurringProject.nextBillingDate": { $gte: now, $lte: next7Days }
    }, 'projectName clientName recurringProject.nextBillingDate recurringProject.recurringAmount').limit(5);

    const domainExpiries = await Project.find({
      "oneTimeProject.domainExpiryDate": { $gte: now, $lte: next30Days }
    }, 'projectName oneTimeProject.domainName oneTimeProject.domainExpiryDate').limit(5);

    const overduePayments = await Invoice.find({
      dueDate: { $lt: now }
    }, 'invoiceNumber customerName dueDate amountDetails.totalAmount').limit(5);

    const handoverPendingList = await Project.find(
      { status: "Pending" },
      'projectName clientName'
    ).limit(5);

    // Normalized analytics response
    const analytics = {
      // 1. Money (Single Source of Truth)
      money: {
        expectedRevenue: projects.expectedRevenue,
        totalInvoiceAmount: invoices.totalInvoiceAmount,
        paidAmount: projects.paidAmount,
        advanceAmount: projects.advanceAmount,
        dueAmount,
        thisMonthRevenue: projects.thisMonthRevenue
      },

      // 2. Revenue Breakdown (derived from money)
      revenueBreakdown: {
        projectTypeWise: {
          ONE_TIME: {
            total: projects.oneTimeTotal,
            paid: projects.oneTimePaid,
            due: oneTimeDue
          },
          RECURRING: {
            monthly: projects.recurringMonthly,
            yearly: projects.recurringYearly,
            due: recurringDue
          }
        },
        projectStatusWise: {
          active: projects.activeProjects,
          completed: projects.completedProjects,
          onHold: projects.onHoldProjects
        }
      },

      // 3. Leads Funnel Metrics
      leadsFunnel: {
        totalLeads: leads.totalLeads,
        interestedLeads: leads.interestedLeads,
        meetingsScheduled: leads.meetingsScheduled,
        leadsConvertedToProjects: leads.leadsConvertedToProjects,
        lostLeads: leads.lostLeads
      },

      // 4. Projects Metrics (counts only)
      projectsMetrics: {
        totalProjects: projects.totalProjects,
        activeProjects: projects.activeProjects,
        completedProjects: projects.completedProjects,
        handoverPendingProjects: projects.handoverPendingProjects,
        onHoldProjects: projects.onHoldProjects
      },

      // 5. Invoice Metrics
      invoiceMetrics: {
        totalInvoices: invoices.totalInvoices,
        totalInvoiceAmount: invoices.totalInvoiceAmount,
        paidAmount: projects.paidAmount, // Reference to money.paidAmount
        dueAmount, // Reference to money.dueAmount
        overdueInvoiceCount: invoices.overdueInvoiceCount
      },

      // 6. Alerts (lists only)
      alerts: {
        upcomingMeetings: upcomingMeetings.map(lead => ({
          leadName: lead.name,
          projectType: lead.projectType,
          meetingDate: lead.meetingDates?.find(m => new Date(m.dateTime) >= now)?.dateTime
        })),
        upcomingBilling: upcomingBilling.map(project => ({
          projectName: project.projectName,
          clientName: project.clientName,
          billingDate: project.recurringProject.nextBillingDate,
          amount: project.recurringProject.recurringAmount
        })),
        domainExpiries: domainExpiries.map(project => ({
          projectName: project.projectName,
          domainName: project.oneTimeProject.domainName,
          expiryDate: project.oneTimeProject.domainExpiryDate
        })),
        overduePayments: overduePayments.map(invoice => ({
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          dueDate: invoice.dueDate,
          amount: invoice.amountDetails.totalAmount
        })),
        handoverPendingProjects: handoverPendingList.map(project => ({
          projectName: project.projectName,
          clientName: project.clientName
        }))
      },

      // 7. Recent Data (for UI lists)
      recentData: {
        leads: recentLeads.map(lead => ({
          _id: lead._id,
          name: lead.name,
          projectType: lead.projectType,
          createdAt: lead.createdAt,
          status: lead.status
        })),
        tasks: recentTasks.map(task => ({
          _id: task._id,
          title: task.title,
          description: task.description,
          status: task.status,
          updatedAt: task.updatedAt
        })),
        employees: recentEmployees.map(emp => ({
          _id: emp._id,
          name: emp.name,
          email: emp.email,
          employee_status: emp.employee_status,
          employee_id: emp.employee_id,
          contact1: emp.contact1
        }))
      },

      // 8. Summary counts (for backward compatibility)
      summary: {
        totalEmployees: employeeCount,
        totalLeads: leads.totalLeads,
        totalProjects: projects.totalProjects,
        totalRevenue: projects.expectedRevenue
      }
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// Legacy endpoints for backward compatibility
export const getDashboardCounts = async (req, res) => {
  try {
    const analytics = await getDashboardAnalytics(req, res);
    if (analytics && analytics.data) {
      return res.json({
        success: true,
        data: analytics.data.summary
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecentLeads = async (req, res) => {
  try {
    const leads = await Lead.find({}, 'name projectType createdAt')
      .sort({ createdAt: -1 })
      .limit(3);
    res.json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActiveProjects = async (req, res) => {
  try {
    const projects = await Project.find(
      { status: { $in: ['Active', 'Start', 'Progress', 'Pending'] } },
      'projectName clientName status'
    ).sort({ createdAt: -1 }).limit(2);
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCompletedProjects = async (req, res) => {
  try {
    const projects = await Project.find(
      { status: { $in: ['Completed', 'Close'] } },
      'projectName clientName status'
    ).sort({ updatedAt: -1 }).limit(2);
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecentEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({}, 'name email employee_status employee_id contact1')
      .sort({ createdAt: -1 })
      .limit(4);
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecentTasks = async (req, res) => {
  try {
    const tasks = await Task.find({}, 'title description status updatedAt')
      .sort({ updatedAt: -1 })
      .limit(3);
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUpcomingAutoRenewals = async (req, res) => {
  try {
    const now = new Date();

    const upcomingRenewals = await Project.find({
      projectType: "RECURRING",
      "recurringProject.autoRenew": true
    }, 'projectName clientName recurringProject.nextBillingDate recurringProject.recurringAmount recurringProject.billingCycle')
    .sort({ 'recurringProject.nextBillingDate': 1 })
    .limit(10);

    res.json({
      success: true,
      data: upcomingRenewals.map(project => ({
        projectName: project.projectName,
        clientName: project.clientName,
        billingDate: project.recurringProject.nextBillingDate,
        amount: project.recurringProject.recurringAmount,
        billingCycle: project.recurringProject.billingCycle,
        daysUntilRenewal: Math.ceil((new Date(project.recurringProject.nextBillingDate) - now) / (1000 * 60 * 60 * 24))
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};