import Employee from '../models/Employee.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/upload.js';
import createHttpError from 'http-errors';
import pdf from 'html-pdf';
import { renderContractHTML } from '../utils/contract.utils.js';

// Helper function to get file source
const getFileSource = (file) => 
  file.path || file.tempFilePath || (file.buffer && Buffer.isBuffer(file.buffer) && file.buffer) || null;

// Helper function to safely delete from Cloudinary
const safeDeleteFromCloudinary = async (publicId) => {
  if (publicId) {
    try {
      await deleteFromCloudinary(publicId);
    } catch (err) {
      // Silent fail
    }
  }
};

// Process files and upload to Cloudinary
export const processFiles = async (req) => {
  const fileData = {};
  if (!req.files) return fileData;

  // Process regular files (non-experience_letter)
  for (const field of Object.keys(req.files)) {
    if (field.startsWith('experience_letter_')) continue;
    
    const files = Array.isArray(req.files[field]) ? req.files[field] : [req.files[field]];
    const uploads = await Promise.all(files.map(file => {
      const src = getFileSource(file);
      return src ? uploadToCloudinary(src, "employees") : null;
    }));

    const results = uploads.filter(r => r !== null);
    fileData[field] = results.length === 1 ? results[0] : results;
  }

  // Process experience_letter_* fields
  const expFields = Object.keys(req.files)
    .filter(f => f.startsWith('experience_letter_'))
    .sort((a, b) => +a.split('_')[2] - +b.split('_')[2]);

  if (expFields.length) {
    fileData.experience_letter = [];
    for (const field of expFields) {
      const files = Array.isArray(req.files[field]) ? req.files[field] : [req.files[field]];
      const uploads = await Promise.all(files.map(file => {
        const src = getFileSource(file);
        return src ? uploadToCloudinary(src, "employees") : null;
      }));
      fileData.experience_letter.push(...uploads.filter(r => r !== null));
    }
  }

  return fileData;
};

export const createEmployee = async (req, res) => {
  try {
    if (!req?.body?.employeeData) {
      return res.status(400).json({
        success: false,
        message: "Missing employeeData in request",
      });
    }

    // Parse employee data
    let employeeData;
    try {
      employeeData = typeof req.body.employeeData === "string" 
        ? JSON.parse(req.body.employeeData) 
        : req.body.employeeData;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format in employeeData",
      });
    }

    // Remove manually injected employee_id
    delete employeeData.employee_id;

    // Upload all files
    const fileData = await processFiles(req);

    // Map file fields to employeeData
    Object.assign(employeeData, {
      profile_image: fileData.profile_image || null,
      aadhar_document: fileData.aadhar_document || null,
      pan_document: fileData.pan_document || null,
      documents: {
        resume: fileData.resume || null,
        offer_letter: fileData.offer_letter || null,
        joining_letter: fileData.joining_letter || null,
        other_docs: fileData.other_docs || [],
      }
    });

    // Attach experience letters to work_experience array
    if (employeeData.work_experience && fileData.experience_letter) {
      employeeData.work_experience = employeeData.work_experience.map((exp, i) => ({
        ...exp,
        experience_letter: fileData.experience_letter[i] || null,
      }));
    }

    // Save employee
    const employee = new Employee(employeeData);
    const savedEmployee = await employee.save();
    
    // Remove password from response
    const responseEmployee = savedEmployee.toObject();
    delete responseEmployee.password;

    return res.status(201).json({
      success: true,
      data: responseEmployee,
      message: "Employee created successfully",
    });

  } catch (error) {
    // Validation error
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages.join(", ")}`,
        errors: error.errors,
      });
    }

    // Duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Get All Employees
export const getEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const isEmployee = req.user.role === 'employee';
    const select = isEmployee 
      ? 'name employee_id email designation department contract_agreement'
      : '-password';
    
    const employees = await Employee.find({})
      .select(select)
      .sort({ employee_id: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Employee.countDocuments();
    
    res.status(200).json({
      success: true,
      data: employees,
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
      message: 'Server error'
    });
  }
};
 
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Allow employees to view only their own data, admins can view any
    if (req.user.role === 'employee' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own data.'
      });
    }
    
    const employee = await Employee.findById(id).select('-password');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 
 
// Update Employee 
export const updateEmployee = async (req, res) => {
  try {
    const fileData = await processFiles(req);

    // Parse safely
    let employeeData;
    try {
      employeeData = typeof req.body.employeeData === 'string'
        ? JSON.parse(req.body.employeeData)
        : req.body.employeeData || req.body;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON format in employeeData'
      });
    }

    delete employeeData.employee_id;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // File Handling
    const fileFields = ['profile_image', 'aadhar_document', 'pan_document'];
    for (const field of fileFields) {
      if (fileData[field]) {
        await safeDeleteFromCloudinary(employee[field]?.public_id);
        employeeData[field] = fileData[field];
      } else {
        employeeData[field] = employee[field];
      }
    }

    // Document Handling
    employeeData.documents = employeeData.documents || {};
    const docFields = ["resume", "offer_letter", "joining_letter"];

    for (const field of docFields) {
      if (fileData[field]) {
        await safeDeleteFromCloudinary(employee.documents?.[field]?.public_id);
        employeeData.documents[field] = fileData[field];
      } else {
        employeeData.documents[field] = employee.documents?.[field] || null;
      }
    }

    employeeData.documents.other_docs = [
      ...(employee.documents?.other_docs || []),
      ...(fileData.other_docs || [])
    ];

    // Experience Letter Fix
    const existingMap = new Map();
    employee.work_experience.forEach((exp) => {
      if (exp._id) existingMap.set(exp._id.toString(), exp);
    });

    if (employeeData.work_experience) {
      employeeData.work_experience = await Promise.all(
        employeeData.work_experience.map(async (exp, i) => {
          const existing = exp._id ? existingMap.get(exp._id.toString()) : null;

          // Attach uploaded file if present
          const uploadedLetter = Array.isArray(fileData.experience_letter)
            ? fileData.experience_letter[i]
            : fileData.experience_letter;

          if (uploadedLetter) {
            await safeDeleteFromCloudinary(existing?.experience_letter?.public_id);
            return { ...exp, experience_letter: uploadedLetter };
          }

          // If no upload, retain previous
          return {
            ...exp,
            experience_letter: existing?.experience_letter || null
          };
        })
      );
    }

    // Remove password from employeeData to avoid validation issues
    delete employeeData.password;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: employeeData },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully'
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Update failed"
    });
  }
};
 
 
// Delete Employee
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Delete all associated files from Cloudinary
    const deletePromises = [];
    
    const deleteIfExists = (file) => {
      if (file?.public_id) {
        deletePromises.push(deleteFromCloudinary(file.public_id));
      }
    };
    
    // Delete profile images and documents
    deleteIfExists(employee.profile_image);
    deleteIfExists(employee.aadhar_document);
    deleteIfExists(employee.pan_document);
    
    // Delete documents
    if (employee.documents) {
      deleteIfExists(employee.documents.resume);
      deleteIfExists(employee.documents.offer_letter);
      deleteIfExists(employee.documents.joining_letter);
      
      if (employee.documents.other_docs) {
        employee.documents.other_docs.forEach(deleteIfExists);
      }
    }
    
    // Delete work experience files
    if (employee.work_experience) {
      employee.work_experience.forEach(exp => {
        deleteIfExists(exp.experience_letter);
      });
    }
    
    // Wait for all deletions to complete
    await Promise.all(deletePromises);
    
    await employee.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete a specific document
export const deleteDocument = async (req, res) => {
  try {
    const { employeeId, docType, public_id } = req.params;
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Delete file from Cloudinary
    await deleteFromCloudinary(public_id);
    
    // Update operations mapping
    const updateOperations = {
      other_docs: {
        $pull: { 'documents.other_docs': { public_id } }
      },
      
      experience_letter: {
        $set: { 
          'work_experience.$[elem].experience_letter': null 
        }
      },
      
      resume: {
        $unset: { 'documents.resume': 1 }
      },
      
      offer_letter: {
        $unset: { 'documents.offer_letter': 1 }
      },
      
      joining_letter: {
        $unset: { 'documents.joining_letter': 1 }
      },
      
      profile_image: {
        $unset: { 'profile_image': 1 }
      },
      
      aadhar_document: {
        $unset: { 'aadhar_document': 1 }
      },
      
      pan_document: {
        $unset: { 'pan_document': 1 }
      }
    };

    if (!updateOperations[docType]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    let updateOptions = {};
    if (docType === 'experience_letter') {
      updateOptions = {
        arrayFilters: [{ 'elem.experience_letter.public_id': public_id }]
      };
    }

    await Employee.updateOne(
      { _id: employeeId },
      updateOperations[docType],
      updateOptions
    );

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Toggle is_current_employee
export const toggleCurrentEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    employee.is_current_employee = !employee.is_current_employee;
    await employee.save();

    res.status(200).json({
      success: true,
      message: "is_current_employee toggled successfully",
      data: employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while toggling is_current_employee",
    });
  }
};

// Contract Template Preview (HTML)
export const previewContract = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Use edited content if available, otherwise generate default
    let html;
    if (employee.contract_agreement?.editedContent) {
      html = employee.contract_agreement.editedContent;
    } else {
      html = renderContractHTML(employee);
    }

    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).json({ message: "Failed to generate contract preview" });
  }
};

// Get Contract Content for Editing
export const getContractContent = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Check if there's custom edited content
    if (employee.contract_agreement?.editedContent) {
      return res.json({
        success: true,
        content: employee.contract_agreement.editedContent
      });
    }

    // Return default generated content
    const html = renderContractHTML(employee);
    res.json({
      success: true,
      content: html
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get contract content" });
  }
};

// Update Contract Content
export const updateContractContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { editedContent } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      id,
      {
        $set: {
          'contract_agreement.editedContent': editedContent,
          'contract_agreement.lastEdited': new Date()
        }
      },
      { new: true, upsert: true }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.json({
      success: true,
      message: "Contract content updated successfully"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update contract content" });
  }
};

// Accept Contract
export const acceptContract = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await Employee.findByIdAndUpdate(
      id,
      {
        $set: {
          'contract_agreement.acceptance.accepted': true,
          'contract_agreement.acceptance.accepted_at': new Date()
        }
      },
      { new: true }
    );

    if (!updated) throw createHttpError(404, 'Employee not found');

    res.status(200).json({
      success: true,
      acceptance: updated.contract_agreement.acceptance
    });
  } catch (err) {
    next(err);
  }
};

// Update Contract Data
export const updateContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Completely replace the contract_agreement with new data
    const contractData = {
      ...req.body,
      lastEdited: new Date()
    };

    const updated = await Employee.findByIdAndUpdate(
      id,
      { 
        $set: { 
          'contract_agreement': contractData,
          'updated_at': new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) throw createHttpError(404, "Employee not found");

    res.status(200).json({
      success: true,
      contract: updated.contract_agreement,
      message: "Contract updated successfully"
    });
  } catch (err) {
    next(err);
  }
};

// Download Contract as PDF
export const downloadContract = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Use edited content if available, otherwise generate default
    const html = employee.contract_agreement?.editedContent || renderContractHTML(employee);

    const options = {
      format: "A4",
      border: { top: "2mm", right: "2mm", bottom: "2mm", left: "2mm" },
      zoomFactor: 0.75, 
      paginationOffset: 1,
      header: { height: "0mm" },
      footer: { height: "0mm" }
    };

    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'PDF generation failed'
        });
      }

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Employment_Contract_${employee.employee_id}.pdf`,
        'Content-Length': buffer.length
      });

      res.send(buffer);
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating contract'
    });
  }
};
