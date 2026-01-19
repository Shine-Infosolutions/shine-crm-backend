import express from "express";
import {
  getDashboardCounts,
  getRecentLeads,
  getActiveProjects,
  getCompletedProjects,
  getRecentEmployees,
  getRecentTasks
} from "../controllers/DashboardController.js";
import { authenticate } from "../middleware/adminAuth.js";

const router = express.Router();

// Lightweight counts API
router.get("/counts", authenticate, getDashboardCounts);

// Dashboard sections
router.get("/recent-leads", authenticate, getRecentLeads);
router.get("/active-projects", authenticate, getActiveProjects);
router.get("/completed-projects", authenticate, getCompletedProjects);
router.get("/recent-employees", authenticate, getRecentEmployees);
router.get("/recent-tasks", authenticate, getRecentTasks);

export default router;