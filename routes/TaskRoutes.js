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

const router = express.Router();

// Task routes
router.get("/present-employees", getPresentEmployees);
router.post("/assign", assignTask);
router.get("/", getTasks);
router.patch("/:id/status", updateTaskStatus);

// New task management routes
router.get("/available", getAvailableTasks);
router.patch("/:id/take", takeTask);
router.patch("/:id/progress", saveProgress);
router.patch("/:id/daily-summary", saveDailySummary);
router.get("/employee/:employee_id", getEmployeeTasks);

export default router;