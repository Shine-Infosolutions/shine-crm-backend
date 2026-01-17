import Timesheet from '../models/Timesheet.js';

// Clock in
export const clockIn = async (req, res) => {
  try {
    const { employee_id } = req.body;
    const today = new Date().setHours(0, 0, 0, 0);
    
    const existing = await Timesheet.findOne({
      employee_id,
      date: today,
      status: 'Active'
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked in today'
      });
    }

    const timesheet = new Timesheet({
      employee_id,
      date: today,
      clock_in: new Date()
    });

    await timesheet.save();
    
    res.status(201).json({
      success: true,
      data: timesheet,
      message: 'Clocked in successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Clock out
export const clockOut = async (req, res) => {
  try {
    const { employee_id } = req.body;
    const today = new Date().setHours(0, 0, 0, 0);
    
    const timesheet = await Timesheet.findOne({
      employee_id,
      date: today,
      status: 'Active'
    });

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'No active timesheet found'
      });
    }

    const clockOut = new Date();
    const totalHours = (clockOut - timesheet.clock_in) / (1000 * 60 * 60);

    timesheet.clock_out = clockOut;
    timesheet.total_hours = Math.round((totalHours - timesheet.break_time) * 100) / 100;
    timesheet.status = 'Completed';

    await timesheet.save();

    res.status(200).json({
      success: true,
      data: timesheet,
      message: 'Clocked out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get timesheets
export const getTimesheets = async (req, res) => {
  try {
    const { employee_id, date_from, date_to } = req.query;
    let filter = {};

    if (employee_id) filter.employee_id = employee_id;
    if (date_from && date_to) {
      filter.date = {
        $gte: new Date(date_from),
        $lte: new Date(date_to)
      };
    }

    const timesheets = await Timesheet.find(filter)
      .populate('employee_id', 'name employee_id')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      timesheets: timesheets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update break time
export const updateBreakTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { break_time } = req.body;

    const timesheet = await Timesheet.findByIdAndUpdate(
      id,
      { break_time },
      { new: true }
    );

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found'
      });
    }

    res.status(200).json({
      success: true,
      data: timesheet,
      message: 'Break time updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Save/Submit timesheet
export const saveProject = async (req, res) => {
  try {
    const { employee_id, employee_name, date, time_entries, total_hours, status } = req.body;
    
    // Check if timesheet already exists for this employee and date
    const existingTimesheet = await Timesheet.findOne({
      employee_id,
      date: new Date(date)
    });

    if (existingTimesheet) {
      // Update existing timesheet
      existingTimesheet.time_entries = time_entries;
      existingTimesheet.total_hours = total_hours;
      existingTimesheet.status = status || 'Submitted';
      await existingTimesheet.save();
      
      return res.status(200).json({
        success: true,
        data: existingTimesheet,
        message: 'Timesheet updated successfully'
      });
    }
    
    // Create new timesheet
    const timesheet = new Timesheet({
      employee_id,
      employee_name,
      date: new Date(date),
      time_entries,
      total_hours,
      status: status || 'Submitted'
    });

    await timesheet.save();

    res.status(201).json({
      success: true,
      data: timesheet,
      message: 'Timesheet saved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Admin: Approve timesheet
export const approveTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const timesheet = await Timesheet.findById(id);
    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found'
      });
    }

    timesheet.status = status;
    await timesheet.save();

    res.status(200).json({
      success: true,
      data: timesheet,
      message: `Timesheet ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};