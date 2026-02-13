import express from "express";
import { register, login, forgot, reset } from "../controllers/authController.js";
const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/forgot", forgot);
router.post("/reset", reset);
export default router;
