import Lead from "../models/Lead.js";

// Get leads count only
export const getLeadsCount = async (req, res) => {
  try {
    const count = await Lead.countDocuments();
    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all leads
export const getLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const [leads, total] = await Promise.all([
      Lead.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Lead.countDocuments()
    ]);
    
    res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single lead by ID
export const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json(lead);
  } catch (error) {
    res.status(500).json({ message: "Error fetching lead", error: error.message });
  }
};

// Create a new lead
export const createLead = async (req, res) => {
  try {
    const savedLead = await Lead.create(req.body);
    res.status(201).json({ 
      success: true, 
      savedLead, 
      message: "Lead added successfully" 
    });
  } catch (error) {
    res.status(400).json({ message: "Error creating lead", error: error.message });
  }
};

// Update a lead
export const updateLead = async (req, res) => {
  try {
    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json(updatedLead);
  } catch (error) {
    res.status(400).json({ message: "Error updating lead", error: error.message });
  }
};

// Delete a lead
export const deleteLead = async (req, res) => {
  try {
    const deletedLead = await Lead.findByIdAndDelete(req.params.id);

    if (!deletedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json({ message: "Lead deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting lead", error: error.message });
  }
};

// Export leads to CSV
export const exportLeadsToCSV = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const filter = employeeId ? { assignedEmployee: employeeId } : {};
    const leads = await Lead.find(filter)
      .populate('assignedEmployee', 'name')
      .sort({ createdAt: -1 });
    
    const headers = [
      'Company Name', 'Address', 'Mobile Number', 'Status', 
      'Meeting Time and Date', 'Type of Project', 'Call Date', 
      'Client Requested Call Date', 'Notes', 'Reference'
    ];
    
    const csvRows = [
      headers.join(','),
      ...leads.map(lead => [
        `"${lead.name || ''}"`,
        `"${lead.address || ''}"`,
        `"${lead.number || ''}"`,
        `"${lead.status || ''}"`,
        `"${lead.meetingDate ? new Date(lead.meetingDate).toLocaleString() : ''}"`,
        `"${lead.projectType || ''}"`,
        `"${lead.callDate ? new Date(lead.callDate).toLocaleDateString() : new Date(lead.createdAt).toLocaleDateString()}"`,
        `"${lead.clientRequestedCallDate ? new Date(lead.clientRequestedCallDate).toLocaleDateString() : ''}"`,
        `"${lead.notes || ''}"`,
        `"${lead.reference || ''}"`
      ].join(','))
    ];

    const filename = employeeId ? `leads-employee-${employeeId}.csv` : 'leads-all.csv';
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csvRows.join('\n'));
  } catch (error) {
    res.status(500).json({ message: "Error exporting leads", error: error.message });
  }
};
