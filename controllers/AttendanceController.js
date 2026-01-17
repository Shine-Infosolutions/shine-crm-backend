import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import mongoose from 'mongoose';

// Time In
export const timeIn = async (req, res) => {
  try {
    console.log('Time-in request received:', req.body);
    
    const { employee_id } = req.body;
    
    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: 'employee_id is required'
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('Today date:', today);
    
    // Check if employee exists
    const employee = await Employee.findById(employee_id);
    console.log('Employee found:', employee ? 'Yes' : 'No');
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if already timed in today
    const existingAttendance = await Attendance.findOne({
      employee_id,
      date: today
    });
    console.log('Existing attendance:', existingAttendance ? 'Found' : 'None');

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Already timed in today'
      });
    }

    const attendance = new Attendance({
      employee_id,
      date: today,
      time_in: new Date()
    });

    await attendance.save();
    console.log('Attendance saved successfully');

    res.status(201).json({
      success: true,
      data: attendance,
      message: 'Time in recorded successfully'
    });
  } catch (error) {
    console.error('Time-in error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Time Out
export const timeOut = async (req, res) => {
  try {
    const { employee_id } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee_id,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No time in record found for today'
      });
    }

    if (attendance.time_out) {
      return res.status(400).json({
        success: false,
        message: 'Already timed out today'
      });
    }

    attendance.time_out = new Date();
    await attendance.save();

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Time out recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get attendance records
export const getAttendance = async (req, res) => {
  try {
    const { employee_id, date, month, year } = req.query;
    let filter = {};

    // Only add employee_id to filter if it's a valid ObjectId
    if (employee_id && employee_id !== 'undefined' && employee_id !== 'null' && mongoose.Types.ObjectId.isValid(employee_id)) {
      filter.employee_id = employee_id;
    }
    
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      filter.date = targetDate;
    } else if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    console.log('Attendance filter:', filter);
    
    const attendance = await Attendance.find(filter)
      .populate('employee_id', 'name employee_id')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get today's attendance status
export const getTodayAttendance = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee_id,
      date: today
    }).populate('employee_id', 'name employee_id');

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get running time for employee
export const getRunningTime = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee_id,
      date: today
    }).populate('employee_id', 'name employee_id');

    if (!attendance || !attendance.time_in) {
      return res.status(404).json({
        success: false,
        message: 'No active session found'
      });
    }

    const now = new Date();
    const timeInMs = attendance.time_in.getTime();
    const currentMs = now.getTime();
    const runningMs = currentMs - timeInMs;
    const runningHours = Math.round((runningMs / (1000 * 60 * 60)) * 100) / 100;

    res.status(200).json({
      success: true,
      data: {
        employee: attendance.employee_id,
        time_in: attendance.time_in,
        current_time: now,
        running_hours: runningHours,
        is_active: !attendance.time_out
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get employee work history by date
export const getDayWorkHistory = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'date is required (format: YYYY-MM-DD)'
      });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get attendance for the specific date
    const attendance = await Attendance.findOne({
      employee_id,
      date: startOfDay
    }).populate('employee_id', 'name employee_id');

    // Get tasks for the specific date
    const Task = (await import('../models/Task.js')).default;
    const tasks = await Task.find({
      assigned_to: employee_id,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        date: date,
        attendance: attendance,
        tasks: tasks
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Manual Checkout
export const checkout = async (req, res) => {
  try {
    const { employee_id, checkout_time } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee_id,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No time in record found for today'
      });
    }

    if (attendance.time_out) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
    }

    attendance.time_out = checkout_time ? new Date(checkout_time) : new Date();
    attendance.is_manual_checkout = !!checkout_time;
    await attendance.save();

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Checkout recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get employee's own attendance records
export const getEmployeeAttendance = async (req, res) => {
  try {
    const employeeId = req.user._id; // Get from authenticated user
    const { date, month, year } = req.query;
    let filter = { employee_id: employeeId };
    
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      filter.date = targetDate;
    } else if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.date = { $gte: startDate, $lte: endDate };
    } else {
      // Default to last 3 months if no date filter
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    console.log('Employee attendance filter:', filter);
    
    const attendance = await Attendance.find(filter)
      .populate('employee_id', 'name employee_id')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Employee attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// Get employee work history (date range)
export const getWorkHistory = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date and end_date are required'
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    endDate.setHours(23, 59, 59, 999);

    // Get attendance records
    const attendance = await Attendance.find({
      employee_id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Get tasks for the period
    const Task = (await import('../models/Task.js')).default;
    const tasks = await Task.find({
      assigned_to: employee_id,
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: 1 });

    // Group by date
    const workHistory = {};
    
    attendance.forEach(att => {
      const dateKey = att.date.toISOString().split('T')[0];
      workHistory[dateKey] = {
        date: dateKey,
        attendance: att,
        tasks: []
      };
    });

    tasks.forEach(task => {
      const dateKey = task.createdAt.toISOString().split('T')[0];
      if (workHistory[dateKey]) {
        workHistory[dateKey].tasks.push(task);
      } else {
        workHistory[dateKey] = {
          date: dateKey,
          attendance: null,
          tasks: [task]
        };
      }
    });

    const sortedHistory = Object.values(workHistory).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.status(200).json({
      success: true,
      data: sortedHistory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};