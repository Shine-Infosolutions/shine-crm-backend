import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0)
  },
  time_in: {
    type: Date,
    required: true
  },
  time_out: {
    type: Date
  },
  is_manual_checkout: {
    type: Boolean,
    default: false
  },
  total_hours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half Day', 'Late'],
    default: 'Present'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true });

// Calculate total hours only when both time_in and time_out exist
attendanceSchema.pre('save', function(next) {
  if (this.time_in && this.time_out) {
    const diffMs = this.time_out - this.time_in;
    this.total_hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  } else {
    this.total_hours = 0;
  }
  next();
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;