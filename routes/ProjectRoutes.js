// server/routes/ProjectRoutes.js
import express from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateAllProgress,
} from "../controllers/ProjectController.js";
import { authenticate, adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/", authenticate, getProjects);
router.get("/:id", authenticate, getProjectById);
router.post("/", adminAuth, createProject);
router.put("/update-progress", adminAuth, updateAllProgress);
router.put("/:id", adminAuth, updateProject);
router.delete("/:id", adminAuth, deleteProject);

export default router;
