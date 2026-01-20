import Lead from "../models/Lead.js";
import Project from "../models/Project.js";
import Employee from "../models/Employee.js";
import Task from "../models/Task.js";

// Lightweight counts API using aggregation
export const getDashboardCounts = async (req, res) => {
  try {
    const [
      totalLeads,
      projectStats,
      totalEmployees
    ] = await Promise.all([
      Lead.countDocuments(),
      Project.aggregate([
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            activeProjects: {
              $sum: { 
                $cond: [{ 
                  $in: ["$status", ["Active", "Start", "Progress", "Pending"]] 
                }, 1, 0] 
              }
            },
            completedProjects: {
              $sum: { 
                $cond: [{ 
                  $in: ["$status", ["Completed", "Close"]] 
                }, 1, 0] 
              }
            },
            totalRevenue: {
              $sum: {
                $add: [
                  { $ifNull: ["$oneTimeProject.totalAmount", 0] },
                  { $ifNull: ["$recurringProject.recurringAmount", 0] }
                ]
              }
            }
          }
        }
      ]),
      Employee.countDocuments()
    ]);

    const stats = projectStats[0] || {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalRevenue: 0
    };

    res.json({
      success: true,
      data: {
        totalLeads,
        activeProjects: stats.activeProjects,
        completedProjects: stats.completedProjects,
        totalEmployees,
        totalRevenue: stats.totalRevenue,
        totalProjects: stats.totalProjects
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Recent leads (limit 3)
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

// Active projects (limit 2)
export const getActiveProjects = async (req, res) => {
  try {
    const projects = await Project.find(
      { status: { $in: ['Active', 'Start', 'Progress', 'Pending'] } },
      'projectName clientName status'
    )
      .sort({ createdAt: -1 })
      .limit(2);
    
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Completed projects (limit 2)
export const getCompletedProjects = async (req, res) => {
  try {
    const projects = await Project.find(
      { status: { $in: ['Completed', 'Close'] } },
      'projectName clientName status'
    )
      .sort({ updatedAt: -1 })
      .limit(2);
    
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Recent employees (limit 4)
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

// Recent tasks (limit 3)
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