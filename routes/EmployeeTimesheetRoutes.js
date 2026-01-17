import express from "express";
import {
  submitTimesheet,
  getTimesheets,
  getAllTimesheets,
  approveTimesheet
} from "../controllers/EmployeeTimesheetController.js";
import { authenticate, adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/", authenticate, submitTimesheet);
router.get("/", authenticate, getTimesheets);
router.get("/admin/all", adminAuth, getAllTimesheets);
router.patch("/admin/approve/:id", adminAuth, approveTimesheet);

export default router;