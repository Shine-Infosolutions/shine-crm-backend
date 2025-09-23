import mongoose from "mongoose";

const timesheetSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  employee_name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time_entries: [{
    start_time: String,
    end_time: String,
    task_description: String,
    project_name: String,
    hours_worked: {
      type: Number,
      default: 1
    },
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task"
    }
  }],
  total_hours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Approved'],
    default: 'Draft'
  }
}, {
  timestamps: true
});

const Timesheet = mongoose.model("Timesheet", timesheetSchema);

export default Timesheet;