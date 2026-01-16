import express from "express";
import { changePassword, backupData } from "../controllers/SettingsController.js";
import { authenticate, adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/change-password", authenticate, changePassword);
router.get("/backup/:dataType", adminAuth, backupData);

export default router;
