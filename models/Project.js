// server/models/Project.js
import mongoose from "mongoose";

const paymentMilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Overdue'], default: 'Pending' }
});

const billingHistorySchema = new mongoose.Schema({
  invoiceId: { type: String, required: true },
  amount: { type: Number, required: true },
  billedOn: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' }
});

const projectSchema = new mongoose.Schema(
  {
    // Common fields for all projects
    projectName: {
      type: String,
      required: true,
    },
    projectType: {
      type: String,
      enum: ["ONE_TIME", "RECURRING"],
      required: true,
      index: true,
    },
    
    // Client reference (new approach)
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    
    // Backward compatibility (deprecated)
    clientName: String,
    clientContact: String,
    
    // Ownership & accountability
    assignedManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    assignedTeam: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    }],
    
    status: {
      type: String,
      enum: ["Active", "On Hold", "Completed", "Cancelled"],
      default: "Active",
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastProgressUpdate: {
      type: Date,
      default: Date.now,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // One-time project fields
    oneTimeProject: {
      scope: String,
      totalAmount: { type: Number, required: true },
      advanceAmount: { type: Number, default: 0 },
      paidAmount: { type: Number, default: 0 },
      startDate: Date,
      expectedDeliveryDate: Date,
      finalHandoverDate: Date,
      sourceCodeLink: String,
      deploymentDetails: String,
      warrantyPeriod: String,
      paymentMilestones: [paymentMilestoneSchema],
    },

    // Recurring project fields
    recurringProject: {
      serviceType: {
        type: String,
        enum: ["SMM", "SEO", "Maintenance", "Ads", "Content", "Other"],
      },
      billingCycle: {
        type: String,
        enum: ["Monthly", "Quarterly", "Yearly"],
      },
      recurringAmount: { type: Number, required: true },
      contractStartDate: Date,
      contractEndDate: Date,
      autoRenew: { type: Boolean, default: false },
      nextBillingDate: Date,
      billingStatus: {
        type: String,
        enum: ["Active", "Paused", "Stopped"],
        default: "Active",
        index: true,
      },
      lastInvoiceId: String,
      missedBillingCount: { type: Number, default: 0 },
      autoInvoice: { type: Boolean, default: false },
      slaDeliverables: String,
      billingHistory: [billingHistorySchema],
    },
  },
  { timestamps: true }
);

// Virtual for pending amount calculation
projectSchema.virtual('oneTimeProject.pendingAmount').get(function() {
  if (this.projectType === 'ONE_TIME' && this.oneTimeProject) {
    return this.oneTimeProject.totalAmount - this.oneTimeProject.paidAmount;
  }
  return 0;
});

// Progress calculation method
projectSchema.methods.calculateProgress = function() {
  if (this.projectType !== 'ONE_TIME') return this.progress;
  
  // Status overrides
  if (this.status === 'Completed') return 100;
  if (this.status === 'On Hold' || this.status === 'Cancelled') return this.progress;
  
  const start = new Date(this.oneTimeProject?.startDate);
  const expected = new Date(this.oneTimeProject?.expectedDeliveryDate);
  const today = new Date();
  
  if (!start || !expected || isNaN(start.getTime()) || isNaN(expected.getTime())) return 0;
  if (today < start) return 0;
  
  const totalDays = Math.ceil((expected - start) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
  
  if (totalDays <= 0) return 0;
  
  const calculatedProgress = Math.round((daysPassed / totalDays) * 100);
  return Math.min(calculatedProgress, 99); // Cap at 99% for Active status
};

// Update progress before save
projectSchema.pre('save', function(next) {
  // Handle progress updates
  if (this.projectType === 'ONE_TIME' && this.status === 'Active') {
    this.progress = this.calculateProgress();
    this.lastProgressUpdate = new Date();
  } else if (this.status === 'Completed') {
    this.progress = 100;
    this.lastProgressUpdate = new Date();
  }
  
  // Skip validation if this is just a progress update
  if (this.isModified('progress') && !this.isModified('projectName')) {
    return next();
  }
  
  // Validation for new/edited projects
  if (this.projectType === 'ONE_TIME') {
    this.recurringProject = undefined;
    if (!this.oneTimeProject?.totalAmount) {
      return next(new Error('Total amount is required for one-time projects'));
    }
  } else if (this.projectType === 'RECURRING') {
    this.oneTimeProject = undefined;
    if (!this.recurringProject?.recurringAmount) {
      return next(new Error('Recurring amount is required for recurring projects'));
    }
  }
  next();
});

// Indexes for reporting
projectSchema.index({ projectType: 1, status: 1 });
projectSchema.index({ 'recurringProject.billingStatus': 1 });
projectSchema.index({ assignedManager: 1 });
projectSchema.index({ clientId: 1 });

const Project = mongoose.model("Project", projectSchema);
export default Project;
