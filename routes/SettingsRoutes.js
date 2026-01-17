import express from "express";
import { changePassword, backupData, updateProfile, getProfile } from "../controllers/SettingsController.js";
import { authenticate, adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// Profile routes
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);

// Security routes
router.post("/change-password", authenticate, changePassword);

// Backup routes (admin only)
router.get("/backup/:dataType", adminAuth, backupData);

export default router;
