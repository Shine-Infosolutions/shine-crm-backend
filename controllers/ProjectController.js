import Project from "../models/Project.js";

// Get all projects
export const getProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const [projects, total] = await Promise.all([
      Project.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Project.countDocuments()
    ]);
    
    res.json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single project
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new project
export const createProject = async (req, res) => {
  try {
    // Additional validation for social media projects
    if (req.body.projectType === 'RECURRING' && req.body.recurringProject) {
      const serviceTypes = req.body.recurringProject.serviceType || [];
      const hasSocialMedia = Array.isArray(serviceTypes) 
        ? serviceTypes.includes('Social Media')
        : serviceTypes === 'Social Media';
      
      if (hasSocialMedia) {
        const socialConfig = req.body.recurringProject.socialMediaConfig;
        
        if (!socialConfig || !socialConfig.platforms || socialConfig.platforms.length === 0) {
          return res.status(400).json({ 
            message: "At least one social media platform is required for social media services" 
          });
        }
        
        const deliverables = socialConfig.deliverables || {};
        const totalDeliverables = (deliverables.posts || 0) + (deliverables.reels || 0) + (deliverables.stories || 0);
        
        if (totalDeliverables === 0) {
          return res.status(400).json({ 
            message: "At least one deliverable must be greater than 0 for social media services" 
          });
        }
      }
    }
    
    const project = await Project.create(req.body);
    
    res.status(201).json({
      success: true,
      project,
      message: "Project created successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a project by ID
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Additional validation for social media projects
    if (req.body.projectType === 'RECURRING' && req.body.recurringProject) {
      const serviceTypes = req.body.recurringProject.serviceType || [];
      const hasSocialMedia = Array.isArray(serviceTypes) 
        ? serviceTypes.includes('Social Media')
        : serviceTypes === 'Social Media';
      
      if (hasSocialMedia) {
        const socialConfig = req.body.recurringProject.socialMediaConfig;
        
        if (!socialConfig || !socialConfig.platforms || socialConfig.platforms.length === 0) {
          return res.status(400).json({ 
            message: "At least one social media platform is required for social media services" 
          });
        }
        
        const deliverables = socialConfig.deliverables || {};
        const totalDeliverables = (deliverables.posts || 0) + (deliverables.reels || 0) + (deliverables.stories || 0);
        
        if (totalDeliverables === 0) {
          return res.status(400).json({ 
            message: "At least one deliverable must be greater than 0 for social media services" 
          });
        }
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, updatedProject });
  } catch (error) {
    res.status(500).json({ message: "Error updating project", error: error.message });
  }
};

// Update progress for all active projects
export const updateAllProgress = async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: "Progress update feature removed" 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a project
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
