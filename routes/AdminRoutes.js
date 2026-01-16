import express from "express";
import {
  getUsers,
  getDashboardStats,
  createUser,
} from "../controllers/AdminController.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/users", adminAuth, getUsers);
router.get("/dashboard-stats", adminAuth, getDashboardStats);
router.post("/users", adminAuth, createUser);

export default router;
