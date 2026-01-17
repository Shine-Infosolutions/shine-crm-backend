import express from "express";
import { login, register, createAdmin, createUser } from "../controllers/AuthController.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/create-admin", createAdmin);
router.post("/create-user", createUser);

export default router;
