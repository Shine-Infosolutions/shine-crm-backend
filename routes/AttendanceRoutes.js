import express from "express";
import {
  timeIn,
  timeOut,
  checkout,
  getAttendance,
  getTodayAttendance,
  getRunningTime,
  getWorkHistory,
  getDayWorkHistory
} from "../controllers/AttendanceController.js";

const router = express.Router();

// Attendance routes
router.post("/time-in", timeIn);
router.post("/time-out", timeOut);
router.post("/checkout", checkout);
router.get("/", getAttendance);
router.get("/today/:employee_id", getTodayAttendance);
router.get("/running-time/:employee_id", getRunningTime);
router.get("/work-history/:employee_id", getWorkHistory);
router.get("/day-work/:employee_id", getDayWorkHistory);

export default router;