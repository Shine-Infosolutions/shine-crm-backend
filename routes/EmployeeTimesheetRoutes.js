import express from "express";
import {
  submitTimesheet,
  getTimesheets
} from "../controllers/EmployeeTimesheetController.js";

const router = express.Router();

router.post("/", submitTimesheet);
router.get("/", getTimesheets);

export default router;