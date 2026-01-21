import express from "express";
import {
  getDashboardAnalytics,
  getDashboardCounts,
  getRecentLeads,
  getActiveProjects,
  getCompletedProjects,
  getRecentEmployees,
  getRecentTasks,
  getUpcomingAutoRenewals,
  getProjectPaidAmountDetails
} from "../controllers/DashboardController.js";
import { authenticate } from "../middleware/adminAuth.js";

const router = express.Router();

// New comprehensive analytics endpoint
router.get("/analytics", authenticate, getDashboardAnalytics);

// Legacy endpoints for backward compatibility
router.get("/counts", authenticate, getDashboardCounts);
router.get("/recent-leads", authenticate, getRecentLeads);
router.get("/active-projects", authenticate, getActiveProjects);
router.get("/completed-projects", authenticate, getCompletedProjects);
router.get("/recent-employees", authenticate, getRecentEmployees);
router.get("/recent-tasks", authenticate, getRecentTasks);
router.get("/upcoming-auto-renewals", authenticate, getUpcomingAutoRenewals);
router.get("/project-paid-details", authenticate, getProjectPaidAmountDetails);

export default router;