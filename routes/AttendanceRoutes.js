import express from "express";
import {
  // timeIn,  // COMMENTED OUT - Using RFID-based attendance
  // timeOut, // COMMENTED OUT - Using RFID-based attendance
  // checkout, // COMMENTED OUT - Using RFID-based attendance
  getAttendance,
  getTodayAttendance,
  getRunningTime,
  getWorkHistory,
  getDayWorkHistory,
  getEmployeeAttendance
} from "../controllers/AttendanceController.js";
import { authenticate, adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// Attendance routes - Manual check-in/out commented out (Using RFID-based attendance)
// router.post("/time-in", authenticate, timeIn);
// router.post("/time-out", authenticate, timeOut);
// router.post("/checkout", authenticate, checkout);
router.get("/", adminAuth, getAttendance); // Admin only
router.get("/my-attendance", authenticate, getEmployeeAttendance); // Employee can access their own
router.get("/today/:employee_id", authenticate, getTodayAttendance);
router.get("/running-time/:employee_id", authenticate, getRunningTime);
router.get("/work-history/:employee_id", authenticate, getWorkHistory);
router.get("/day-work/:employee_id", authenticate, getDayWorkHistory);

export default router;
