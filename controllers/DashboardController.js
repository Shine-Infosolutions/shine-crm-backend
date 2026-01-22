import Lead from "../models/Lead.js";
import Project from "../models/Project.js";
import Employee from "../models/Employee.js";
import Task from "../models/Task.js";
import Invoice from "../models/Invoice.js";

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  const cached = cache.get(key);
  return cached && Date.now() - cached.timestamp < CACHE_TTL ? cached.data : null;
};

const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// API 1: Business Metrics & Analytics
export const getBusinessMetrics = async (req, res) => {
  try {
    const cacheKey = 'business-metrics';
    const cached = getCachedData(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [leadMetrics, projectMetrics, invoiceMetrics] = await Promise.all([
      Lead.aggregate([
        { $match: { createdAt: { $exists: true } } },
        {
          $group: {
            _id: null,
            totalLeads: { $sum: 1 },
            interestedLeads: { $sum: { $cond: ["$isInterested", 1, 0] } },
            meetingsScheduled: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ["$meetingDates", []] } }, 0] }, 1, 0] } },
            leadsConvertedToProjects: { $sum: { $cond: [{ $eq: ["$status", "Won"] }, 1, 0] } },
            lostLeads: { $sum: { $cond: [{ $eq: ["$status", "Lost"] }, 1, 0] } }
          }
        }
      ]).allowDiskUse(true),
      
      Project.aggregate([
        { $match: { createdAt: { $exists: true } } },
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            activeProjects: { $sum: { $cond: [{ $in: ["$status", ["Active", "Start", "Progress", "Pending", "In Progress"]] }, 1, 0] } },
            completedProjects: { $sum: { $cond: [{ $in: ["$status", ["Completed", "Complete", "Done", "Finished", "Closed", "Close"]] }, 1, 0] } },
            onHoldProjects: { $sum: { $cond: [{ $in: ["$status", ["On Hold", "Hold", "Paused"]] }, 1, 0] } },
            totalRevenue: {
              $sum: {
                $cond: [
                  { $eq: ["$projectType", "ONE_TIME"] },
                  { $ifNull: ["$oneTimeProject.totalAmount", 0] },
                  { $ifNull: ["$recurringProject.recurringAmount", 0] }
                ]
              }
            },
            paidAmount: { $sum: { $ifNull: ["$oneTimeProject.paidAmount", 0] } },
            advanceAmount: { $sum: { $ifNull: ["$oneTimeProject.advanceAmount", 0] } },
            recurringPaidAmount: { $sum: { $cond: [{ $eq: ["$projectType", "RECURRING"] }, { $ifNull: ["$recurringProject.recurringAmount", 0] }, 0] } },
            oneTimeRevenue: { $sum: { $cond: [{ $eq: ["$projectType", "ONE_TIME"] }, { $ifNull: ["$oneTimeProject.totalAmount", 0] }, 0] } },
            oneTimeDueAmount: { $sum: { $cond: [{ $eq: ["$projectType", "ONE_TIME"] }, { $subtract: [{ $ifNull: ["$oneTimeProject.totalAmount", 0] }, { $add: [{ $ifNull: ["$oneTimeProject.paidAmount", 0] }, { $ifNull: ["$oneTimeProject.advanceAmount", 0] }] }] }, 0] } },
            recurringRevenue: { $sum: { $cond: [{ $eq: ["$projectType", "RECURRING"] }, { $ifNull: ["$recurringProject.recurringAmount", 0] }, 0] } },
            thisMonthRevenue: {
              $sum: {
                $cond: [
                  { $gte: ["$createdAt", thisMonthStart] },
                  { $cond: [{ $eq: ["$projectType", "ONE_TIME"] }, { $ifNull: ["$oneTimeProject.totalAmount", 0] }, { $ifNull: ["$recurringProject.recurringAmount", 0] }] },
                  0
                ]
              }
            },
            lastMonthRevenue: {
              $sum: {
                $cond: [
                  { $and: [{ $gte: ["$createdAt", lastMonthStart] }, { $lt: ["$createdAt", thisMonthStart] }] },
                  { $cond: [{ $eq: ["$projectType", "ONE_TIME"] }, { $ifNull: ["$oneTimeProject.totalAmount", 0] }, { $ifNull: ["$recurringProject.recurringAmount", 0] }] },
                  0
                ]
              }
            }
          }
        }
      ]).allowDiskUse(true),
      
      Invoice.aggregate([
        { $match: { createdAt: { $exists: true } } },
        {
          $group: {
            _id: null,
            totalInvoices: { $sum: 1 },
            totalInvoiceAmount: { $sum: "$amountDetails.totalAmount" },
            overdueInvoiceCount: { $sum: { $cond: [{ $lt: ["$dueDate", now] }, 1, 0] } }
          }
        }
      ]).allowDiskUse(true)
    ]);

    const leads = leadMetrics[0] || {};
    const projects = projectMetrics[0] || {};
    const invoices = invoiceMetrics[0] || {};
    
    const totalPaidAmount = (projects.paidAmount || 0) + (projects.advanceAmount || 0) + (projects.recurringPaidAmount || 0);
    const dueAmount = (projects.oneTimeDueAmount || 0) + (projects.recurringRevenue || 0);

    const data = {
      revenue: {
        expected: projects.totalRevenue || 0,
        paid: totalPaidAmount,
        due: dueAmount,
        thisMonth: projects.thisMonthRevenue || 0,
        lastMonth: projects.lastMonthRevenue || 0
      },
      projects: {
        total: projects.totalProjects || 0,
        active: projects.activeProjects || 0,
        completed: projects.completedProjects || 0,
        onHold: projects.onHoldProjects || 0
      },
      leads: {
        total: leads.totalLeads || 0,
        interested: leads.interestedLeads || 0,
        meetings: leads.meetingsScheduled || 0,
        converted: leads.leadsConvertedToProjects || 0,
        lost: leads.lostLeads || 0
      },
      invoices: {
        total: invoices.totalInvoices || 0,
        amount: invoices.totalInvoiceAmount || 0,
        overdue: invoices.overdueInvoiceCount || 0
      },
      // Additional data for frontend compatibility
      monthlyEarnings: {
        currentMonth: {
          total: projects.thisMonthRevenue || 0,
          recurring: projects.recurringRevenue || 0,
          oneTime: projects.oneTimeRevenue || 0
        },
        previousMonth: {
          total: projects.lastMonthRevenue || 0
        },
        actualPayments: {
          totalPaid: totalPaidAmount,
          dueAmount: dueAmount,
          oneTimeDue: projects.oneTimeDueAmount || 0,
          recurringDue: projects.recurringRevenue || 0,
          autoRenewalRevenue: projects.recurringRevenue || 0
        }
      },
      revenueBreakdown: {
        projectTypeWise: {
          ONE_TIME: {
            total: projects.oneTimeRevenue || 0,
            paid: (projects.paidAmount || 0) + (projects.advanceAmount || 0)
          },
          RECURRING: {
            monthly: projects.recurringRevenue || 0,
            due: projects.recurringRevenue || 0,
            paid: projects.recurringPaidAmount || 0
          }
        }
      }
    };

    setCachedData(cacheKey, data);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API 2: Dashboard Alerts & Notifications
export const getDashboardAlerts = async (req, res) => {
  try {
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [upcomingMeetings, upcomingBilling, domainExpiries, overduePayments, handoverPending] = await Promise.all([
      Lead.find({
        "meetingDates.dateTime": { $gte: now, $lte: next7Days }
      }).select('name projectType meetingDates').limit(5).lean(),
      
      Project.find({
        projectType: "RECURRING"
      }).select('projectName clientName recurringProject projectType').limit(5).lean(),
      
      Project.find({
        "oneTimeProject.domainExpiryDate": { $gte: now, $lte: next30Days }
      }).select('projectName oneTimeProject.domainName oneTimeProject.domainExpiryDate').limit(5).lean(),
      
      Invoice.find({
        dueDate: { $lt: now }
      }).select('invoiceNumber customerName dueDate amountDetails.totalAmount').limit(5).lean(),
      
      Project.find({ status: "Pending" }).select('projectName clientName').limit(5).lean()
    ]);

    res.json({
      success: true,
      data: {
        upcomingMeetings: upcomingMeetings.map(lead => ({
          leadName: lead.name,
          projectType: lead.projectType,
          meetingDate: lead.meetingDates?.find(m => new Date(m.dateTime) >= now)?.dateTime
        })),
        upcomingBilling: upcomingBilling.map(project => ({
          projectName: project.projectName,
          clientName: project.clientName,
          billingDate: project.recurringProject?.nextBillingDate || new Date(),
          amount: project.recurringProject?.recurringAmount || 0
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
        handoverPending: handoverPending.map(project => ({
          projectName: project.projectName,
          clientName: project.clientName
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API 3: Recent Activity & Lists
export const getRecentActivity = async (req, res) => {
  try {
    const [recentTasks, recentLeads, recentEmployees, employeeCount] = await Promise.all([
      Task.find().select('title description status updatedAt').sort({ updatedAt: -1 }).limit(3).lean(),
      Lead.find().select('name projectType createdAt status').sort({ createdAt: -1 }).limit(3).lean(),
      Employee.find().select('name email employee_status employee_id contact1').sort({ createdAt: -1 }).limit(4).lean(),
      Employee.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        recentTasks,
        recentLeads,
        recentEmployees,
        totalEmployees: employeeCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

