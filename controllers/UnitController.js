// Get static units
export const getAllUnits = (req, res) => {
 const units = [
  // Website & App Development
  { _id: "1", name: "Website Project", abbreviation: "proj", isActive: true },
  { _id: "2", name: "Mobile App", abbreviation: "app", isActive: true },
  { _id: "3", name: "Web App", abbreviation: "webapp", isActive: true },
  { _id: "4", name: "Module", abbreviation: "mod", isActive: true },
  { _id: "5", name: "Feature", abbreviation: "feat", isActive: true },
  { _id: "6", name: "UI/UX Screen", abbreviation: "scrn", isActive: true },

  // Digital Marketing & SEO
  { _id: "7", name: "SEO Campaign", abbreviation: "camp", isActive: true },
  { _id: "8", name: "Social Media Post", abbreviation: "post", isActive: true },
  { _id: "9", name: "Google Ad", abbreviation: "ad", isActive: true },
  { _id: "10", name: "Social Media Ad", abbreviation: "smad", isActive: true },
  { _id: "11", name: "Short Video/Reel", abbreviation: "vid", isActive: true },
  { _id: "12", name: "YouTube Video", abbreviation: "ytvid", isActive: true },
  { _id: "13", name: "Poster Design", abbreviation: "poster", isActive: true },
  { _id: "14", name: "Logo/Graphic Design", abbreviation: "design", isActive: true },

  // Software & Custom Solutions
  { _id: "15", name: "Custom Software", abbreviation: "soft", isActive: true },
  { _id: "16", name: "Billing Software Module", abbreviation: "billmod", isActive: true },
  { _id: "17", name: "School ERP Module", abbreviation: "schoolmod", isActive: true },
  { _id: "18", name: "Feature Update", abbreviation: "update", isActive: true },
  { _id: "19", name: "Bug Fix", abbreviation: "bugfix", isActive: true },
  { _id: "20", name: "Support Ticket", abbreviation: "ticket", isActive: true },

  // Consulting & Training
  { _id: "21", name: "Consultation Session", abbreviation: "session", isActive: true },
  { _id: "22", name: "Training Hour", abbreviation: "train-hr", isActive: true },
  { _id: "23", name: "Workshop", abbreviation: "workshop", isActive: true },
  { _id: "24", name: "Demo", abbreviation: "demo", isActive: true },

  // Time-Based & Service
  { _id: "25", name: "Hour", abbreviation: "hr", isActive: true },
  { _id: "26", name: "Day", abbreviation: "day", isActive: true },
  { _id: "27", name: "Project Phase", abbreviation: "phase", isActive: true },
  { _id: "28", name: "Sprint", abbreviation: "sprint", isActive: true },

  // Cloud & Usage Units
  { _id: "29", name: "GB Storage", abbreviation: "GB", isActive: true },
  { _id: "30", name: "API Call", abbreviation: "api", isActive: true },
  { _id: "31", name: "Email Sent", abbreviation: "email", isActive: true },
  { _id: "32", name: "Request", abbreviation: "req", isActive: true },

  // Marketing / Analytics
  { _id: "33", name: "Lead", abbreviation: "lead", isActive: true },
  { _id: "34", name: "Conversion", abbreviation: "conv", isActive: true },
  { _id: "35", name: "Follower", abbreviation: "fol", isActive: true },
  { _id: "36", name: "Subscriber", abbreviation: "subr", isActive: true },
  { _id: "37", name: "Campaign Report", abbreviation: "rep", isActive: true }
];

  res.json({ success: true, data: units });
};

// Create new unit
export const createUnit = async (req, res) => {
  try {
    const unit = new Unit(req.body);
    await unit.save();
    res.status(201).json({ success: true, data: unit });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Update unit
export const updateUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!unit) {
      return res.status(404).json({ success: false, error: "Unit not found" });
    }
    res.json({ success: true, data: unit });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete unit
export const deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.id);
    if (!unit) {
      return res.status(404).json({ success: false, error: "Unit not found" });
    }
    res.json({ success: true, message: "Unit deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
