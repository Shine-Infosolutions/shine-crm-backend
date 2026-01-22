import express from "express";
import {
  getBusinessMetrics,
  getDashboardAlerts,
  getRecentActivity
} from "../controllers/DashboardController.js";
import { authenticate } from "../middleware/adminAuth.js";

const router = express.Router();

// New optimized 3-API structure
router.get("/business-metrics", authenticate, getBusinessMetrics);
router.get("/alerts", authenticate, getDashboardAlerts);
router.get("/recent-activity", authenticate, getRecentActivity);

export default router;