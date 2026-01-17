import express from "express";
import {
  clockIn,
  clockOut,
  getTimesheets,
  updateBreakTime,
  saveProject,
  approveTimesheet
} from "../controllers/TimesheetController.js";
import { authenticate, adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/clock-in", authenticate, clockIn);
router.post("/clock-out", authenticate, clockOut);
router.get("/", authenticate, getTimesheets);
router.patch("/:id/break-time", authenticate, updateBreakTime);
router.post("/", authenticate, saveProject);
router.patch("/approve/:id", adminAuth, approveTimesheet);

export default router;