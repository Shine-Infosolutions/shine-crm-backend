import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  deleteDocument,
  toggleCurrentEmployee,
  previewContract,
  getContractContent,
  updateContractContent,
  acceptContract,
  updateContract,
  downloadContract,
  // acceptPolicy, getPolicyStatus,
  // acceptTerms,
  // getTermsStatus,
} from "../controllers/EmployeeController.js";
import { authenticate, adminAuth } from "../middleware/adminAuth.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

import upload from "../config/multer.js";

const router = express.Router();

// Middleware for routes that can accept token from query params (for browser preview)
const authenticateFlexible = async (req, res, next) => {
  try {
    // Try header first, then query param
    const authHeader = req.header('Authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader;
    const token = headerToken || req.query.token;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role === 'admin') {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
      }
      req.user = { ...user.toObject(), role: 'admin' };
    } else {
      const employee = await Employee.findById(decoded.userId);
      if (!employee) {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
      }
      req.user = { ...employee.toObject(), role: 'employee' };
    }
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};

const uploadFields = upload.fields([
  { name: "profile_image", maxCount: 1 },
  { name: "aadhar_document", maxCount: 1 },
  { name: "pan_document", maxCount: 1 },
  { name: "resume", maxCount: 1 },
  { name: "offer_letter", maxCount: 1 },
  { name: "joining_letter", maxCount: 1 },
  { name: "other_docs", maxCount: 10 },
  { name: "experience_letter", maxCount: 10 },
]);

// Employee routes
router.post("/", adminAuth, uploadFields, createEmployee);
router.put("/:id", adminAuth, uploadFields, updateEmployee);
router.get("/", authenticate, getEmployees); // Allow employees to see employee list
router.get("/:id", authenticate, getEmployeeById);
router.delete("/:id", adminAuth, deleteEmployee);
router.delete("/:employeeId/documents/:docType/:public_id", adminAuth, deleteDocument);
router.patch("/employees/:id/toggle-current", adminAuth, toggleCurrentEmployee);

// Contract-related routes
router.get("/:id/contract/preview", authenticateFlexible, previewContract);
router.get("/:id/contract/content", authenticate, getContractContent);
router.put("/:id/contract/content", adminAuth, updateContractContent);
router.patch("/:id/contract/accept", authenticate, acceptContract);
router.put("/:id/contract/update", authenticate, updateContract);
router.get("/:id/contract/download", authenticateFlexible, downloadContract);
// router.post('/:id/accept-policy', acceptPolicy);
// router.get('/:id/policy-status', getPolicyStatus);
// router.post("/:id/accept-terms", acceptTerms);
// router.get("/:id/terms-status", getTermsStatus);

export default router;
