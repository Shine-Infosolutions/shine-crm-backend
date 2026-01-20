// server/models/Project.js
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true, index: true },
    projectType: { type: String, enum: ["ONE_TIME", "RECURRING"], required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', index: true },
    clientName: String,
    clientContact: String,
    assignedManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    assignedTeam: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
    status: { type: String, enum: ["Active", "On Hold", "Completed", "Cancelled", "Pending", "Start", "Progress", "Hold", "Close"], default: "Active", index: true },
    priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    oneTimeProject: {
      scope: String,
      totalAmount: { type: Number, required: function() { return this.projectType === 'ONE_TIME'; } },
      advanceAmount: { type: Number, default: 0 },
      paidAmount: { type: Number, default: 0 },
      startDate: Date,
      expectedDeliveryDate: Date,
      finalHandoverDate: Date,
      sourceCodeLink: String,
      deploymentDetails: String,
      warrantyPeriod: String,
      autoInvoice: { type: Boolean, default: false },
      lastInvoiceId: String,
      domainName: String,
      domainProvider: String,
      domainExpiryDate: Date,
      paymentMilestones: [{
        title: { type: String, required: true },
        amount: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        status: { type: String, enum: ['Pending', 'Paid', 'Overdue'], default: 'Pending' }
      }]
    },

    recurringProject: {
      serviceType: [{ type: String, enum: ["Social Media", "GNB SEO", "Website Maintenance", "Other"] }],
      billingCycle: { type: String, enum: ["Monthly", "Quarterly", "Yearly"] },
      recurringAmount: { type: Number, required: function() { return this.projectType === 'RECURRING'; } },
      contractStartDate: Date,
      contractEndDate: Date,
      nextBillingDate: { type: Date, index: true },
      billingStatus: { type: String, enum: ["Active", "Paused", "Stopped"], default: "Active", index: true },
      lastInvoiceId: String,
      missedBillingCount: { type: Number, default: 0 },
      autoInvoice: { type: Boolean, default: false },
      slaDeliverables: String,
      billingHistory: [{
        invoiceId: { type: String, required: true },
        amount: { type: Number, required: true },
        billedOn: { type: Date, required: true },
        status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' }
      }],
      socialMediaConfig: {
        platforms: [{ type: String, enum: ["Instagram", "Facebook", "LinkedIn", "Twitter/X"] }],
        deliverables: {
          posts: { type: Number, default: 0, min: 0, max: 100 },
          reels: { type: Number, default: 0, min: 0, max: 100 },
          stories: { type: Number, default: 0, min: 0, max: 100 }
        }
      }
    }
  },
  { timestamps: true }
);

// Optimized virtual
projectSchema.virtual('oneTimeProject.pendingAmount').get(function() {
  return this.projectType === 'ONE_TIME' && this.oneTimeProject 
    ? this.oneTimeProject.totalAmount - this.oneTimeProject.paidAmount : 0;
});

// Optimized pre-save middleware
projectSchema.pre('save', function(next) {
  if (this.projectType === 'ONE_TIME') {
    this.recurringProject = undefined;
  } else if (this.projectType === 'RECURRING') {
    this.oneTimeProject = undefined;
    
    // Ensure socialMediaConfig exists if not provided
    if (!this.recurringProject.socialMediaConfig) {
      this.recurringProject.socialMediaConfig = {
        platforms: [],
        deliverables: { posts: 0, reels: 0, stories: 0 }
      };
    }
    
    const serviceTypes = this.recurringProject.serviceType || [];
    const hasSocialMedia = Array.isArray(serviceTypes) 
      ? serviceTypes.includes('Social Media')
      : serviceTypes === 'Social Media';
      
    if (hasSocialMedia) {
      const socialConfig = this.recurringProject.socialMediaConfig;
      if (!socialConfig?.platforms?.length) {
        return next(new Error('At least one social media platform is required'));
      }
      const totalDeliverables = (socialConfig.deliverables?.posts || 0) + 
        (socialConfig.deliverables?.reels || 0) + (socialConfig.deliverables?.stories || 0);
      if (totalDeliverables === 0) {
        return next(new Error('At least one deliverable must be greater than 0'));
      }
    }
  }
  
  next();
});

// Compound indexes for better query performance
projectSchema.index({ projectType: 1, status: 1 });
projectSchema.index({ assignedManager: 1, status: 1 });
projectSchema.index({ 'recurringProject.billingStatus': 1, 'recurringProject.nextBillingDate': 1 });
projectSchema.index({ createdAt: -1 });

const Project = mongoose.model("Project", projectSchema);
export default Project;
