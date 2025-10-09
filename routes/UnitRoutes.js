import express from "express";
import { getAllUnits } from "../controllers/UnitController.js";

const router = express.Router();

router.get("/", getAllUnits);

export default router;