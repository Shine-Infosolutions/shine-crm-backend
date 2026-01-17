import EmployeeTimesheet from '../models/EmployeeTimesheet.js';

// Submit timesheet
export const submitTimesheet = async (req, res) => {
  try {
    const { employee_id, employee_name, date, time_entries, total_hours, status } = req.body;
    
    const existingTimesheet = await EmployeeTimesheet.findOne({
      employee_id,
      date: new Date(date)
    });

    if (existingTimesheet) {
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
    
    const timesheet = new EmployeeTimesheet({
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

    const timesheets = await EmployeeTimesheet.find(filter).sort({ date: -1 });

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

// Admin: Get all timesheets
export const getAllTimesheets = async (req, res) => {
  try {
    const timesheets = await EmployeeTimesheet.find({}).sort({ date: -1, employee_name: 1 });

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

// Admin: Approve timesheet
export const approveTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const timesheet = await EmployeeTimesheet.findById(id);
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