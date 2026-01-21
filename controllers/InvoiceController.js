import Invoice from "../models/Invoice.js";
import { generateInvoiceNumber } from "../utils/generateInvoiceNumber.js";

// Utility function for GST handling
const handleCustomerGST = (data) => {
  if (data.isGSTInvoice === false) {
    if (!data.customerGST || data.customerGST.trim() === '') {
      data.customerGST = 'N/A';
    }
  }
};

// Allowed fields for invoice creation/update
const allowedFields = [
  'isGSTInvoice', 'customerGST', 'invoiceDate', 'dueDate', 'customerName',
  'customerAddress', 'customerPhone', 'customerEmail', 'dispatchThrough',
  'customerAadhar', 'productDetails', 'amountDetails', 'notes', 'lastInvoiceId'
];

// Sanitize input data
const sanitizeInvoiceData = (body) => {
  const sanitized = {};
  allowedFields.forEach(field => {
    if (body[field] !== undefined) {
      sanitized[field] = body[field];
    }
  });
  return sanitized;
};

// Create a new invoice
export const createInvoice = async (req, res) => {
  try {
    const invoiceData = sanitizeInvoiceData(req.body);
    
    // Generate invoice number if not provided
    if (!invoiceData.invoiceNumber) {
      invoiceData.invoiceNumber = await generateInvoiceNumber();
    }
    
    // Handle backward compatibility - if isGSTInvoice is not provided, default to true
    if (invoiceData.isGSTInvoice === undefined) {
      invoiceData.isGSTInvoice = true;
    }
    
    // Ensure required fields have default values if missing
    if (!invoiceData.customerName || invoiceData.customerName.trim() === '') {
      invoiceData.customerName = 'Customer Name Required';
    }
    
    if (!invoiceData.customerAddress || invoiceData.customerAddress.trim() === '') {
      invoiceData.customerAddress = 'Complete address required for invoice';
    }
    
    if (!invoiceData.customerPhone || invoiceData.customerPhone.trim() === '') {
      invoiceData.customerPhone = 'Phone number required';
    }
    
    if (!invoiceData.customerEmail || invoiceData.customerEmail.trim() === '') {
      invoiceData.customerEmail = 'email@required.com';
    }
    
    if (!invoiceData.invoiceDate) {
      invoiceData.invoiceDate = new Date();
    }
    
    if (!invoiceData.dueDate) {
      invoiceData.dueDate = new Date();
    }
    
    // Ensure productDetails has at least one item
    if (!invoiceData.productDetails || invoiceData.productDetails.length === 0) {
      invoiceData.productDetails = [{
        description: 'Service/Product Description Required',
        unit: 'Unit',
        quantity: 1,
        price: 0,
        discountPercentage: 0,
        amount: 0
      }];
    }
    
    // Ensure amountDetails exists
    if (!invoiceData.amountDetails) {
      invoiceData.amountDetails = {
        gstPercentage: 18,
        discountOnTotal: 0,
        totalAmount: 0
      };
    }
    
    handleCustomerGST(invoiceData);
    
    const invoice = new Invoice(invoiceData);
    await invoice.save();
    res.status(201).json({ success: true, data: invoice, invoice });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all invoices
export const getAllInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const invoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Invoice.countDocuments();
    
    res.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get a single invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update invoice
export const updateInvoice = async (req, res) => {
  try {
    const updateData = sanitizeInvoiceData(req.body);
    
    handleCustomerGST(updateData);
    
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    
    if (!invoice) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }
    
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }
    
    res.json({ success: true, message: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update invoice notes
export const updateInvoiceNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { notes: notes || '' },
      { new: true }
    );
    if (!invoice) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get next invoice number
export const getNextInvoiceNumber = async (req, res) => {
  try {
    const nextInvoiceNumber = await generateInvoiceNumber();
    res.json({ success: true, nextInvoiceNumber });
  } catch (err) {
    res.status(500).json({ success: false, error: "Could not generate next invoice number" });
  }
};
  
