/**
 * itemRoutes.js
 * Routes for Item Master management
 */

import express from "express";
const router = express.Router();
import auth from "../middleware/auth.js";
import * as itemController from "../controllers/itemController.js";

// All item routes require authentication
router.use(auth);

/**
 * Item CRUD Operations
 */
router.post("/", itemController.createItem);
router.get("/", itemController.getItems);
router.get("/stats", itemController.getItemStats);
router.get("/categories/list", itemController.getCategories);
router.get("/principle/:name", itemController.getPrincipleAmount);
router.get("/:id", itemController.getItemById);
router.put("/:id", itemController.updateItem);
router.delete("/:id", itemController.deleteItem);

/**
 * Bulk Operations
 */
router.post("/bulk/import", itemController.bulkImportItems);

export default router;
