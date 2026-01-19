import Invoice from '../models/Invoice.js';

export async function generateInvoiceNumber() {
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Get the latest invoice by createdAt descending
  const latestInvoice = await Invoice.findOne({}, {}, { sort: { createdAt: -1 } });
  
  if (!latestInvoice) {
    return `SI/${currentMonth}/01`;
  }
  
  // Validate invoice number format before parsing
  if (!latestInvoice.invoiceNumber || typeof latestInvoice.invoiceNumber !== 'string') {
    return `SI/${currentMonth}/01`;
  }
  
  // Extract month and sequence from last invoice number (format: SI/MM/NN)
  const parts = latestInvoice.invoiceNumber.split('/');
  
  // Validate format: should have exactly 3 parts
  if (parts.length !== 3 || parts[0] !== 'SI') {
    return `SI/${currentMonth}/01`;
  }
  
  const lastMonth = parts[1];
  const lastSequenceStr = parts[2];
  
  // Validate month and sequence parts
  if (!/^\d{2}$/.test(lastMonth) || !/^\d{2}$/.test(lastSequenceStr)) {
    return `SI/${currentMonth}/01`;
  }
  
  const lastSequence = parseInt(lastSequenceStr, 10);
  
  // Validate parsed sequence number
  if (isNaN(lastSequence) || lastSequence < 1) {
    return `SI/${currentMonth}/01`;
  }
  
  let nextSequence;
  if (lastMonth === currentMonth) {
    // Same month, increment sequence
    nextSequence = String(lastSequence + 1).padStart(2, '0');
  } else {
    // New month, reset sequence
    nextSequence = '01';
  }
  
  return `SI/${currentMonth}/${nextSequence}`;
}