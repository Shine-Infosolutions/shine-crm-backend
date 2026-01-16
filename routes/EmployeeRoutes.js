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
  acceptContract,
  updateContract,
  downloadContract,
  // acceptPolicy, getPolicyStatus,
  // acceptTerms,
  // getTermsStatus,
} from "../controllers/EmployeeController.js";
import { authenticate, adminAuth } from "../middleware/adminAuth.js";

import upload from "../config/multer.js";

const router = express.Router();

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
router.get("/", adminAuth, getEmployees);
router.get("/:id", authenticate, getEmployeeById);
router.delete("/:id", adminAuth, deleteEmployee);
router.delete("/:employeeId/documents/:docType/:public_id", adminAuth, deleteDocument);
router.patch("/employees/:id/toggle-current", adminAuth, toggleCurrentEmployee);

// Contract-related routes
router.get("/:id/contract/preview", authenticate, previewContract);
router.patch("/:id/contract/accept", authenticate, acceptContract);
router.put("/:id/contract/update", adminAuth, updateContract);
router.get("/:id/contract/download", authenticate, downloadContract);
// router.post('/:id/accept-policy', acceptPolicy);
// router.get('/:id/policy-status', getPolicyStatus);
// router.post("/:id/accept-terms", acceptTerms);
// router.get("/:id/terms-status", getTermsStatus);

export default router;
