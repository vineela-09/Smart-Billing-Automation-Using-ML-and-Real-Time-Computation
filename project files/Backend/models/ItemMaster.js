import mongoose from "mongoose";

const ItemMasterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    default: "General",
    index: true
  },
  principleAmount: {
    type: Number,
    required: true,
    description: "Fixed cost price per unit"
  },
  sellingPrice: {
    type: Number,
    required: true,
    default: 0,
    description: "Selling price per unit"
  },
  marginPercentage: {
    type: Number,
    default: 30,
    description: "Profit margin as percentage"
  },
  unit: {
    type: String,
    default: "pcs",
    description: "Unit of measurement (pcs, kg, ltr, etc)"
  },
  reorderLevel: {
    type: Number,
    default: 10,
    description: "Minimum quantity to trigger reorder alert"
  },
  supplier: {
    type: String,
    default: "",
    description: "Supplier name or ID"
  },
  status: {
    type: String,
    enum: ["active", "archived", "discontinued"],
    default: "active",
    index: true
  },
  description: {
    type: String,
    default: ""
  },
  hsn: {
    type: String,
    default: "",
    description: "HSN code for tax purposes"
  },
  gst: {
    type: Number,
    default: 0,
    description: "GST percentage"
  },
  usageCount: {
    type: Number,
    default: 0,
    description: "Number of times used in bills"
  },
  lastUsed: {
    type: Date,
    default: null,
    description: "When this item was last used in a bill"
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound index for user and name uniqueness (active items only)
ItemMasterSchema.index({ user: 1, name: 1, status: 1 });

// Methods
ItemMasterSchema.methods.calculateProfit = function() {
  return this.sellingPrice - this.principleAmount;
};

ItemMasterSchema.methods.getProfitPercentage = function() {
  if (this.sellingPrice === 0) return 0;
  return ((this.sellingPrice - this.principleAmount) / this.sellingPrice) * 100;
};

ItemMasterSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.profit = this.calculateProfit();
  obj.profitPercentage = this.getProfitPercentage();
  return obj;
};

export default mongoose.model("ItemMaster", ItemMasterSchema);
