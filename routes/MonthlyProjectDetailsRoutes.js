import express from "express";
import {
  getMonthlyProjectDetails,
  getMonthlyProjectDetailById,
  createMonthlyProjectDetail,
  updateMonthlyProjectDetail,
  deleteMonthlyProjectDetail,
} from "../controllers/MonthlyProjectDetailsController.js";
import { authenticate, adminAuth } from "../middleware/adminAuth.js";

const monthlyProjectrouter = express.Router();

monthlyProjectrouter.get("/", authenticate, getMonthlyProjectDetails);
monthlyProjectrouter.get("/:id", authenticate, getMonthlyProjectDetailById);
monthlyProjectrouter.post("/", adminAuth, createMonthlyProjectDetail);
monthlyProjectrouter.put("/:id", adminAuth, updateMonthlyProjectDetail);
monthlyProjectrouter.delete("/:id", adminAuth, deleteMonthlyProjectDetail);

export default monthlyProjectrouter;
