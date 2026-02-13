/**
 * itemController.js
 * API endpoints for managing item master (fixed principle amounts)
 * 
 * Features:
 * - Create items with fixed principle amounts
 * - Fetch items with filtering
 * - Update item details
 * - Delete/archive items
 * - Bulk import items
 * - Search items
 */

import Item from "../models/ItemMaster.js";

/**
 * Create a new item with fixed principle amount
 * POST /api/items
 */
export const createItem = async (req, res) => {
  try {
    const { name, category, principleAmount, sellingPrice, marginPercentage, unit, supplier, reorderLevel } = req.body;
    
    // Validation
    if (!name || !principleAmount || !sellingPrice) {
      return res.status(400).json({ error: "Name, principle amount, and selling price are required" });
    }

    if (sellingPrice < principleAmount) {
      return res.status(400).json({ error: "Selling price must be greater than or equal to principle amount" });
    }

    // Check for duplicate item
    const existing = await Item.findOne({ 
      user: req.user.id, 
      name: new RegExp(`^${name}$`, "i"),
      status: { $ne: "archived" }
    });

    if (existing) {
      return res.status(400).json({ error: "Item with this name already exists" });
    }

    const calculatedMargin = sellingPrice > 0 
      ? marginPercentage || ((sellingPrice - principleAmount) / sellingPrice * 100)
      : (marginPercentage || 0);

    const item = new Item({
      user: req.user.id,
      name: name.trim(),
      category: category || "General",
      principleAmount: parseFloat(principleAmount),
      sellingPrice: parseFloat(sellingPrice),
      marginPercentage: calculatedMargin,
      unit: unit || "pcs",
      supplier: supplier || "",
      reorderLevel: reorderLevel || 10,
      status: "active"
    });

    await item.save();

    res.status(201).json({
      message: "Item created successfully",
      item: item.toObject()
    });
  } catch (error) {
    console.error("Create item error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all items for the user
 * GET /api/items
 * Query params: category, status, search, sortBy, limit, skip
 */
export const getItems = async (req, res) => {
  try {
    const { category, status = "active", search, sortBy = "-createdAt", limit = 100, skip = 0 } = req.query;

    let query = { user: req.user.id, status };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = new RegExp(search, "i");
    }

    const items = await Item.find(query)
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Item.countDocuments(query);

    res.json({
      items: items.map(item => item.toObject()),
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error("Get items error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get single item by ID
 * GET /api/items/:id
 */
export const getItemById = async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(item.toObject());
  } catch (error) {
    console.error("Get item error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update item details
 * PUT /api/items/:id
 */
export const updateItem = async (req, res) => {
  try {
    const { name, category, principleAmount, sellingPrice, marginPercentage, unit, supplier, reorderLevel, status } = req.body;

    const item = await Item.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Validation
    if (sellingPrice && principleAmount && sellingPrice < principleAmount) {
      return res.status(400).json({ error: "Selling price must be >= principle amount" });
    }

    // Update fields
    if (name) item.name = name.trim();
    if (category) item.category = category;
    if (principleAmount) item.principleAmount = parseFloat(principleAmount);
    if (sellingPrice) item.sellingPrice = parseFloat(sellingPrice);
    if (unit) item.unit = unit;
    if (supplier !== undefined) item.supplier = supplier;
    if (reorderLevel) item.reorderLevel = reorderLevel;
    if (status) item.status = status;

    // Recalculate margin if amounts changed
    if (principleAmount || sellingPrice) {
      item.marginPercentage = marginPercentage || 
        ((item.sellingPrice - item.principleAmount) / item.sellingPrice * 100);
    }

    await item.save();

    res.json({
      message: "Item updated successfully",
      item: item.toObject()
    });
  } catch (error) {
    console.error("Update item error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete/Archive item
 * DELETE /api/items/:id
 */
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Soft delete - archive instead
    item.status = "archived";
    await item.save();

    res.json({ message: "Item archived successfully" });
  } catch (error) {
    console.error("Delete item error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get item categories
 * GET /api/items/categories/list
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await Item.distinct("category", { 
      user: req.user.id, 
      status: "active" 
    });

    res.json({ categories: categories.sort() });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get item statistics
 * GET /api/items/stats
 */
export const getItemStats = async (req, res) => {
  try {
    const items = await Item.find({ user: req.user.id, status: "active" });

    const stats = {
      totalItems: items.length,
      totalValue: items.reduce((sum, item) => sum + (item.sellingPrice * 1), 0),
      avgMargin: items.length > 0 
        ? items.reduce((sum, item) => sum + item.marginPercentage, 0) / items.length
        : 0,
      categories: [...new Set(items.map(item => item.category))],
      byCategory: {}
    };

    // Group by category
    items.forEach(item => {
      if (!stats.byCategory[item.category]) {
        stats.byCategory[item.category] = { count: 0, value: 0 };
      }
      stats.byCategory[item.category].count += 1;
      stats.byCategory[item.category].value += item.sellingPrice;
    });

    res.json(stats);
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Bulk import items
 * POST /api/items/bulk/import
 * Body: array of items
 */
export const bulkImportItems = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required and cannot be empty" });
    }

    const imported = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const itemData = items[i];

      // Validation
      if (!itemData.name || !itemData.principleAmount || !itemData.sellingPrice) {
        errors.push(`Row ${i + 1}: Missing required fields`);
        continue;
      }

      if (itemData.sellingPrice < itemData.principleAmount) {
        errors.push(`Row ${i + 1}: Selling price less than principle amount`);
        continue;
      }

      try {
        const item = new Item({
          user: req.user.id,
          name: itemData.name.trim(),
          category: itemData.category || "General",
          principleAmount: parseFloat(itemData.principleAmount),
          sellingPrice: parseFloat(itemData.sellingPrice),
          marginPercentage: itemData.marginPercentage || 
            ((itemData.sellingPrice - itemData.principleAmount) / itemData.sellingPrice * 100),
          unit: itemData.unit || "pcs",
          supplier: itemData.supplier || "",
          reorderLevel: itemData.reorderLevel || 10,
          status: "active"
        });

        await item.save();
        imported.push(item.toObject());
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    res.json({
      message: `Imported ${imported.length} items${errors.length > 0 ? ` with ${errors.length} errors` : ""}`,
      imported,
      errors,
      summary: {
        total: items.length,
        imported: imported.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get principle amount for an item
 * GET /api/items/principle/:name
 * Used for automatic principle calculation when creating bills
 */
export const getPrincipleAmount = async (req, res) => {
  try {
    const { name } = req.params;
    
    const item = await Item.findOne({
      user: req.user.id,
      name: new RegExp(`^${name}$`, "i"),
      status: "active"
    });

    if (!item) {
      return res.status(404).json({ 
        error: "Item not found",
        principleAmount: null 
      });
    }

    res.json({
      principleAmount: item.principleAmount,
      sellingPrice: item.sellingPrice,
      marginPercentage: item.marginPercentage,
      item: item.toObject()
    });
  } catch (error) {
    console.error("Get principle error:", error);
    res.status(500).json({ error: error.message });
  }
};
