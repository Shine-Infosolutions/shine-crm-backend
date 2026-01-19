// server/models/Lead.js
import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    number: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "In Progress", "Qualified", "Lost", "Won"],
      default: "New",
    },
    followUpDate: {
      type: Date,
      required: false,
    },
    followUpStatus: {
      type: String,
      enum: ["Not Started", "Scheduled", "Pending", "Completed"],
      default: "Not Started",
    },
    isInterested: {
      type: Boolean,
      default: false,
    },
    meetingDates: [{
      dateTime: {
        type: Date,
        required: true,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    meetingDate: {
      type: Date,
      required: false,
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: false,
    },
    projectType: {
      type: String,
      enum: ['Website Development', 'Mobile App', 'E-commerce', 'Digital Marketing', 'Other'],
      required: false,
    },
    callDate: {
      type: Date,
      required: false,
    },
    clientCallDates: [{
      dateTime: {
        type: Date,
        required: true,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    clientRequestedCallDate: {
      type: Date,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    reference: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const Lead = mongoose.model("Lead", leadSchema);
export default Lead;
