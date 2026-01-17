// server/routes/authRoutes.js
import express from "express";
import { login, register, createAdmin, createUser } from "../controllers/AuthController.js";
import { validateLogin, validateRegistration, sanitizeInput } from "../middleware/validation.js";

const router = express.Router();

router.post("/login", sanitizeInput, validateLogin, login);
router.post("/register", sanitizeInput, validateRegistration, register);
router.post("/create-admin", sanitizeInput, validateRegistration, createAdmin);
router.post("/create-user", sanitizeInput, validateRegistration, createUser);

export default router;
