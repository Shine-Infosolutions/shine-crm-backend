import Task from '../models/Task.js';
import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';

// Get present employees
export const getPresentEmployees = async (req, res) => {
  try {
    const today = new Date().setHours(0, 0, 0, 0);
    
    const presentAttendance = await Attendance.find({
      date: today,
      status: 'Present'
    }).populate('employee_id', 'name employee_id');

    res.status(200).json({
      success: true,
      data: presentAttendance.map(att => att.employee_id)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Assign task to employee or make available
export const assignTask = async (req, res) => {
  try {
    const { title, description, assigned_to, assigned_by, priority, due_date, make_available } = req.body;

    // If assigned_to is provided, check if employee exists
    if (assigned_to) {
      const employee = await Employee.findById(assigned_to);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }
    }

    const task = new Task({
      title,
      description,
      assigned_to,
      assigned_by,
      priority,
      due_date,
      status: make_available ? 'Available' : (assigned_to ? 'Pending' : 'Available')
    });

    await task.save();
    await task.populate(['assigned_to', 'assigned_by']);

    res.status(201).json({
      success: true,
      data: task,
      message: make_available ? 'Task made available for employees' : 'Task assigned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get tasks
export const getTasks = async (req, res) => {
  try {
    const { employee_id, status } = req.query;
    let filter = {};

    if (employee_id) {
      filter.$or = [
        { assigned_to: employee_id },
        { taken_by: employee_id }
      ];
    }
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate('assigned_to', 'name employee_id')
      .populate('assigned_by', 'name')
      .populate('taken_by', 'name employee_id')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update task status
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateData = { status };
    if (status === 'Completed') {
      updateData.completed_at = new Date();
    }

    const task = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate(['assigned_to', 'assigned_by', 'taken_by']);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task status updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get available tasks for employees to take
export const getAvailableTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ status: 'Available' })
      .populate('assigned_by', 'name')
      .sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Employee takes a task
export const takeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (task.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Task is not available'
      });
    }

    task.taken_by = employee_id;
    task.status = 'In Progress';
    await task.save();
    await task.populate(['assigned_by', 'taken_by']);

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task taken successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Save work progress
export const saveProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, notes, time_spent } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Add work log entry
    task.work_logs.push({
      progress_update: progress,
      notes,
      time_spent
    });

    // Update overall progress
    task.progress = progress;

    await task.save();

    res.status(200).json({
      success: true,
      data: task,
      message: 'Progress saved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Save end-of-day summary
export const saveDailySummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { summary_notes, is_completed } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Calculate total time spent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogs = task.work_logs.filter(log => 
      log.timestamp >= today
    );
    
    const total_time_spent = todayLogs.reduce((sum, log) => 
      sum + (log.time_spent || 0), 0
    );

    task.daily_summary = {
      date: new Date(),
      total_time_spent,
      final_progress: task.progress,
      summary_notes,
      is_completed
    };

    if (is_completed) {
      task.status = 'Completed';
      task.completed_at = new Date();
    }

    await task.save();
    await task.populate(['assigned_by', 'taken_by']);

    res.status(200).json({
      success: true,
      data: task,
      message: 'Daily summary saved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get employee's tasks with progress
export const getEmployeeTasks = async (req, res) => {
  try {
    const { employee_id } = req.params;
    
    const tasks = await Task.find({
      $or: [
        { assigned_to: employee_id },
        { taken_by: employee_id }
      ]
    })
    .populate(['assigned_by', 'taken_by'])
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};