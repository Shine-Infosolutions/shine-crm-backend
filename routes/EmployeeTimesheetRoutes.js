import express from "express";
import {
  submitTimesheet,
  getTimesheets,
  getAllTimesheets
} from "../controllers/EmployeeTimesheetController.js";

const router = express.Router();

router.post("/", submitTimesheet);
router.get("/", getTimesheets);
router.get("/admin/all", getAllTimesheets);

export default router;