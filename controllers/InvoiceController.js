import Invoice from "../models/Invoice.js";

// Create a new invoice
export const createInvoice = async (req, res) => {
  try {
    const invoiceData = { ...req.body };
    
    // Handle backward compatibility - if isGSTInvoice is not provided, default to true
    if (invoiceData.isGSTInvoice === undefined) {
      invoiceData.isGSTInvoice = true;
    }
    
    // For non-GST invoices, allow customerGST to be "N/A" or empty
    if (invoiceData.isGSTInvoice === false) {
      if (!invoiceData.customerGST || invoiceData.customerGST.trim() === '') {
        invoiceData.customerGST = 'N/A';
      }
    }
    
    const invoice = new Invoice(invoiceData);
    await invoice.save();
    res.status(201).json({ success: true, data: invoice });
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
    const updateData = { ...req.body };
    
    // For non-GST invoices, allow customerGST to be "N/A" or empty
    if (updateData.isGSTInvoice === false) {
      if (!updateData.customerGST || updateData.customerGST.trim() === '') {
        updateData.customerGST = 'N/A';
      }
    }
    
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
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
    const Counter = (await import('mongoose')).default.model('Counter', new (await import('mongoose')).default.Schema({
      _id: String,
      seq: { type: Number, default: 0 }
    }));
    
    const counter = await Counter.findById('invoice_number');
    const nextNumber = counter ? counter.seq + 1 : 1;
    const nextInvoiceNumber = `INV-${nextNumber}`;
    
    res.json({ nextInvoiceNumber });
  } catch (err) {
    res.status(500).json({ error: "Could not generate next invoice number" });
  }
};
  
