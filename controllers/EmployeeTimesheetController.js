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