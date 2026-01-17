import express from "express";
import {
  createExpense,
  updateExpense,
  getAllExpenses,
  getExpenseById,
  deleteExpense,
} from "../controllers/officeExpenseController.js";
import { authenticate, adminAuth } from "../middleware/adminAuth.js";

import upload from "../config/multer.js";

const router = express.Router();

// Only one file field for receipt
const uploadFields = upload.fields([{ name: "receipt_attachment", maxCount: 1 }]);

router.post("/create", authenticate, uploadFields, createExpense);
router.put("/update/:id", adminAuth, uploadFields, updateExpense);
router.get("/", authenticate, getAllExpenses);
router.get("/:id", authenticate, getExpenseById);
router.delete("/delete/:id", adminAuth, deleteExpense);

export default router;
