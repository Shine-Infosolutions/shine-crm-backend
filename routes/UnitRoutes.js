import express from "express";
import { getAllUnits } from "../controllers/UnitController.js";
import { authenticate } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/", authenticate, getAllUnits);

export default router;
