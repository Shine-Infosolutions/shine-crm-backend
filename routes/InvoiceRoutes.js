import express from "express";
const router = express.Router();

import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  updateInvoiceNotes,
  getNextInvoiceNumber,
} from "../controllers/InvoiceController.js";
import { authenticate, adminAuth } from "../middleware/adminAuth.js";

router.post("/create", adminAuth, createInvoice);
router.get("/all", authenticate, getAllInvoices);
router.get("/mono/:id", authenticate, getInvoiceById);
router.put("/update/:id", adminAuth, updateInvoice);
router.put("/:id/notes", authenticate, updateInvoiceNotes);
router.delete("/delete/:id", adminAuth, deleteInvoice);
router.get("/next-invoice-number", authenticate, getNextInvoiceNumber);

export default router;
