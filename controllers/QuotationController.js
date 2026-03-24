import Quotation from "../models/Quotation.js";
import { generateQuotationNumber } from "../utils/generateQuotationNumber.js";

// Allowed fields for quotation creation/update
const allowedFields = [
  'quotationNumber', 'quotationDate', 'validUntil', 'customerName', 'customerEmail',
  'customerPhone', 'customerAddress', 'customerGST', 'status', 'notes', 
  'termsAndConditions', 'isGSTQuotation', 'gstPercentage', 'discountOnTotal', 
  'totalAmount', 'items'
];

// Sanitize input data
const sanitizeQuotationData = (body) => {
  const sanitized = {};
  allowedFields.forEach(field => {
    if (body[field] !== undefined) {
      sanitized[field] = body[field];
    }
  });
  return sanitized;
};

// Create a new quotation
export const createQuotation = async (req, res) => {
  try {
    const quotationData = sanitizeQuotationData(req.body);
    
    // Generate quotation number if not provided
    if (!quotationData.quotationNumber) {
      quotationData.quotationNumber = await generateQuotationNumber();
    }
    
    // Set default values if missing
    if (!quotationData.quotationDate) {
      quotationData.quotationDate = new Date();
    }
    
    if (!quotationData.validUntil) {
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + 30); // 30 days from now
      quotationData.validUntil = validUntilDate;
    }
    
    // Ensure items array has at least one item
    if (!quotationData.items || quotationData.items.length === 0) {
      quotationData.items = [{
        description: 'Service/Product Description Required',
        unit: 'Unit',
        quantity: 1,
        price: 0,
        discountPercentage: 0,
        amount: 0
      }];
    }
    
    // Validate required fields
    if (!quotationData.customerName || quotationData.customerName.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer name is required' 
      });
    }
    
    if (!quotationData.customerPhone || quotationData.customerPhone.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer phone is required' 
      });
    }
    
    if (!quotationData.customerAddress || quotationData.customerAddress.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer address is required' 
      });
    }
    
    const quotation = new Quotation(quotationData);
    await quotation.save();
    
    res.status(201).json({ 
      success: true, 
      data: quotation,
      message: 'Quotation created successfully' 
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quotation number already exists' 
      });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get all quotations
export const getAllQuotations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { isActive: true };
    
    // Add status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Add search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { customerName: searchRegex },
        { quotationNumber: searchRegex },
        { customerEmail: searchRegex }
      ];
    }
    
    const quotations = await Quotation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Quotation.countDocuments(filter);
    
    res.json({
      success: true,
      data: quotations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get a single quotation by ID
export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ 
        success: false, 
        message: "Quotation not found" 
      });
    }
    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update quotation
export const updateQuotation = async (req, res) => {
  try {
    const updateData = sanitizeQuotationData(req.body);
    
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      {
        new: true,
        runValidators: true,
      }
    );
    
    if (!quotation) {
      return res.status(404).json({ 
        success: false, 
        message: "Quotation not found" 
      });
    }
    
    res.json({ 
      success: true, 
      data: quotation,
      message: 'Quotation updated successfully' 
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete quotation (soft delete)
export const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!quotation) {
      return res.status(404).json({ 
        success: false, 
        message: "Quotation not found" 
      });
    }
    
    res.json({ 
      success: true, 
      message: "Quotation deleted successfully" 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update quotation status
export const updateQuotationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status value' 
      });
    }
    
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!quotation) {
      return res.status(404).json({ 
        success: false, 
        message: "Quotation not found" 
      });
    }
    
    res.json({ 
      success: true, 
      data: quotation,
      message: 'Quotation status updated successfully' 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get next quotation number
export const getNextQuotationNumber = async (req, res) => {
  try {
    const nextQuotationNumber = await generateQuotationNumber();
    res.json({ success: true, nextQuotationNumber });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Could not generate next quotation number" 
    });
  }
};

// Get quotation statistics
export const getQuotationStats = async (req, res) => {
  try {
    const stats = await Quotation.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const totalQuotations = await Quotation.countDocuments({ isActive: true });
    
    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        totalQuotations
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};