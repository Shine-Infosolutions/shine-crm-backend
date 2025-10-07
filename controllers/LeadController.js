// server/controllers/LeadController.js
import Lead from "../models/Lead.js";

// Get all leads
export const getLeads = async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching leads", error: error.message });
  }
};

// Get a single lead by ID
export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json(lead);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching lead", error: error.message });
  }
};

// Create a new lead
export const createLead = async (req, res) => {
  try {
    const newLead = new Lead(req.body);
    const savedLead = await newLead.save();
    res
      .status(201)
      .json({ success: true, savedLead, message: "Leaded added successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating lead", error: error.message });
  }
};

// Update a lead
export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedLead = await Lead.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json(updatedLead);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating lead", error: error.message });
  }
};

// Delete a lead
export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLead = await Lead.findByIdAndDelete(id);

    if (!deletedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json({ message: "Lead deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting lead", error: error.message });
  }
};

// Export leads to CSV
export const exportLeadsToCSV = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const filter = employeeId ? { assignedEmployee: employeeId } : {};
    const leads = await Lead.find(filter).populate('assignedEmployee', 'name').sort({ createdAt: -1 });
    
    const headers = ['Company Name', 'Address', 'Mobile Number', 'Status', 'Meeting Time and Date', 'Type of Project', 'Call Date', 'Client Requested Call Date', 'Notes', 'Reference'];
    const csvRows = [headers.join(',')];
    
    leads.forEach(lead => {
      const row = [
        `"${lead.name || ''}"`,
        `"${lead.address || ''}"`,
        `"${lead.number || ''}"`,
        `"${lead.status || ''}"`,
        `"${lead.meetingDate ? new Date(lead.meetingDate).toLocaleString() : ''}"`,
        `"${lead.projectType || ''}"`,
        `"${lead.callDate ? new Date(lead.callDate).toLocaleDateString() : new Date(lead.createdAt).toLocaleDateString()}"`,
        `"${lead.clientRequestedCallDate ? new Date(lead.clientRequestedCallDate).toLocaleDateString() : ''}"`,
        `"${lead.notes || ''}"`,
        `"${lead._id || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csv = csvRows.join('\n');
    const filename = employeeId ? `leads-employee-${employeeId}.csv` : 'leads-all.csv';
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: "Error exporting leads", error: error.message });
  }
};
