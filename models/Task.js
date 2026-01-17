import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee"
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  taken_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee"
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Available', 'Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Available'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  due_date: {
    type: Date
  },
  completed_at: {
    type: Date
  },
  work_logs: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    progress_update: Number,
    notes: String,
    time_spent: Number // in minutes
  }],
  daily_summary: {
    date: Date,
    total_time_spent: Number, // in minutes
    final_progress: Number,
    summary_notes: String,
    is_completed: Boolean
  }
}, {
  timestamps: true
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
