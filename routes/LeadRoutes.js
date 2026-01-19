// server/routes/leadRoutes.js
import express from "express";
import {
  getLeads,
  getLeadsCount,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  exportLeadsToCSV,
} from "../controllers/LeadController.js";
import { authenticate, adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/", authenticate, getLeads);
router.get("/count", authenticate, getLeadsCount);
router.get("/export/csv", adminAuth, exportLeadsToCSV);
router.get("/:id", authenticate, getLeadById);
router.post("/", authenticate, createLead);
router.put("/:id", authenticate, updateLead);
router.delete("/:id", adminAuth, deleteLead);

export default router;
