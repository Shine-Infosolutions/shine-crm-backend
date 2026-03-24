import Quotation from '../models/Quotation.js';

export const generateQuotationNumber = async () => {
  try {
    const currentDate = new Date();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const currentYear = currentDate.getFullYear();
    
    // Find the latest quotation for the current month
    const latestQuotation = await Quotation.findOne({
      quotationNumber: { $regex: `^QT/${currentMonth}/` }
    }).sort({ createdAt: -1 });

    let nextNumber = 1;
    
    if (latestQuotation) {
      // Extract the number from the latest quotation number
      const parts = latestQuotation.quotationNumber.split('/');
      if (parts.length === 3) {
        const lastNumber = parseInt(parts[2]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }

    // Format the number with leading zeros
    const formattedNumber = String(nextNumber).padStart(2, '0');
    
    return `QT/${currentMonth}/${formattedNumber}`;
  } catch (error) {
    console.error('Error generating quotation number:', error);
    // Fallback to timestamp-based number
    const timestamp = Date.now().toString().slice(-6);
    return `QT/AUTO/${timestamp}`;
  }
};