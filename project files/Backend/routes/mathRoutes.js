import express from "express";
import { createMathOperation, listMathOperations, getMathOperationStats } from "../controllers/mathController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Create math operation
router.post("/", auth, createMathOperation);

// List all math operations for user
router.get("/", auth, listMathOperations);

// Get statistics
router.get("/stats", auth, getMathOperationStats);

export default router;
