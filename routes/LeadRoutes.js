// server/routes/leadRoutes.js
import express from "express";
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  exportLeadsToCSV,
} from "../controllers/LeadController.js";

const router = express.Router();

router.get("/", getLeads);
router.get("/export/csv", exportLeadsToCSV);
router.get("/:id", getLeadById);
router.post("/", createLead);
router.put("/:id", updateLead);
router.delete("/:id", deleteLead);

export default router;
