import express from "express";
const router = express.Router();

import {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  getNextQuotationNumber,
  getQuotationStats,
} from "../controllers/QuotationController.js";
import { authenticate, adminAuth } from "../middleware/adminAuth.js";

// Create new quotation
router.post("/", adminAuth, createQuotation);

// Get all quotations
router.get("/", authenticate, getAllQuotations);

// Get quotation statistics
router.get("/stats", authenticate, getQuotationStats);

// Get next quotation number
router.get("/next-quotation-number", authenticate, getNextQuotationNumber);

// Get single quotation by ID
router.get("/:id", authenticate, getQuotationById);

// Update quotation
router.put("/:id", adminAuth, updateQuotation);

// Update quotation status
router.patch("/:id/status", adminAuth, updateQuotationStatus);

// Delete quotation (soft delete)
router.delete("/:id", adminAuth, deleteQuotation);

export default router;