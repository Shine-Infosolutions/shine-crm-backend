import express from "express";
import {
  clockIn,
  clockOut,
  getTimesheets,
  updateBreakTime,
  saveProject
} from "../controllers/TimesheetController.js";

const router = express.Router();

router.post("/clock-in", clockIn);
router.post("/clock-out", clockOut);
router.get("/", getTimesheets);
router.patch("/:id/break-time", updateBreakTime);
router.post("/", saveProject);

export default router;