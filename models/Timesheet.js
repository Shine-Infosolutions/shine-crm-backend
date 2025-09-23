import mongoose from "mongoose";

const timesheetSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  clock_in: {
    type: Date,
    required: true
  },
  clock_out: {
    type: Date
  },
  total_hours: {
    type: Number,
    default: 0
  },
  break_time: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Completed'],
    default: 'Active'
  }
}, {
  timestamps: true
});

const Timesheet = mongoose.model("Timesheet", timesheetSchema);

export default Timesheet;