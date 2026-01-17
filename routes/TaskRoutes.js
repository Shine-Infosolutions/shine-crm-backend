import express from "express";
import {
  getPresentEmployees,
  assignTask,
  getTasks,
  updateTaskStatus,
  getAvailableTasks,
  takeTask,
  saveProgress,
  saveDailySummary,
  getEmployeeTasks
} from "../controllers/TaskController.js";
import { authenticate, adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// Task routes
router.get("/present-employees", adminAuth, getPresentEmployees);
router.post("/assign", adminAuth, assignTask);
router.get("/", authenticate, getTasks);
router.patch("/:id/status", authenticate, updateTaskStatus);

// New task management routes
router.get("/available", authenticate, getAvailableTasks);
router.patch("/:id/take", authenticate, takeTask);
router.patch("/:id/progress", authenticate, saveProgress);
router.patch("/:id/daily-summary", authenticate, saveDailySummary);
router.get("/employee/:employee_id", authenticate, getEmployeeTasks);

export default router;
