import express from "express";
import { createBill, listBills } from "../controllers/billController.js";
import auth from "../middleware/auth.js";
const router = express.Router();
router.post("/", auth, createBill);
router.get("/", auth, listBills);
export default router;
