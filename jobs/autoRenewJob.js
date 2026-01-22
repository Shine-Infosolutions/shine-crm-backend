import cron from 'node-cron';
import Project from '../models/Project.js';
import Invoice from '../models/Invoice.js';
import { generateInvoiceNumber } from '../utils/generateInvoiceNumber.js';

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find projects with auto-renew enabled and billing date is today
    const projectsToRenew = await Project.find({
      projectType: 'RECURRING',
      'recurringProject.autoRenew': true,
      'recurringProject.nextBillingDate': {
        $lte: today
      }
    });

    for (const project of projectsToRenew) {
      try {
        // Get all previous invoice IDs from project
        const previousInvoiceIds = project.recurringProject.lastInvoiceId || [];

        // Create new invoice
        const invoiceData = {
          isGSTInvoice: project.clientGST && project.clientGST !== 'N/A',
          customerGST: project.clientGST || 'N/A',
          invoiceNumber: await generateInvoiceNumber(),
          invoiceDate: new Date(),
          dueDate: project.recurringProject.nextBillingDate,
          customerName: project.clientName,
          customerAddress: project.clientAddress,
          customerPhone: project.clientContact,
          customerEmail: project.clientEmail,
          dispatchThrough: 'Email',
          customerAadhar: '',
          productDetails: [{
            description: `${project.projectName} - ${project.recurringProject.serviceType.join(', ')} (${project.recurringProject.billingCycle})`,
            unit: 'Service',
            quantity: 1,
            price: project.recurringProject.recurringAmount,
            discountPercentage: 0,
            amount: project.recurringProject.recurringAmount
          }],
          amountDetails: {
            gstPercentage: project.clientGST && project.clientGST !== 'N/A' ? 18 : 0,
            discountOnTotal: 0,
            totalAmount: project.recurringProject.recurringAmount
          },
          notes: `Auto-renewal invoice for ${project.projectName}`,
          lastInvoiceId: previousInvoiceIds
        };

        const newInvoice = new Invoice(invoiceData);
        await newInvoice.save();

        // Calculate next billing date
        const currentDate = new Date(project.recurringProject.nextBillingDate);
        let nextDate = new Date(currentDate);

        switch (project.recurringProject.billingCycle) {
          case 'Monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'Quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'Yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }

        // Update project with new invoice ID and next billing date
        await Project.findByIdAndUpdate(project._id, {
          $push: { 'recurringProject.lastInvoiceId': newInvoice._id },
          'recurringProject.nextBillingDate': nextDate
        });} catch (error) {
    // Error handled silently
  }
    }

  } catch (error) {
    // Error handled silently
  }
});

export default cron;