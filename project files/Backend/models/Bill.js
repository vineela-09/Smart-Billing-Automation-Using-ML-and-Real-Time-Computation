import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  name: String,
  qty: Number,
  price: Number,
  principleAmount: { type: Number, default: 0 }, // Cost price per unit
  category: { type: String, default: "general" }, // Item category
  profitPerUnit: { type: Number, default: 0 }, // (price - principleAmount) per unit
  totalProfit: { type: Number, default: 0 } // (price - principleAmount) * qty
}, { _id: false });

const BillSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [ItemSchema],
  total: Number, // Total billed amount
  principleTotal: { type: Number, default: 0 }, // Total cost price
  profitLoss: { type: Number, default: 0 }, // total - principleTotal
  billDate: { type: Date, default: Date.now },
  paymentStatus: { type: String, enum: ["paid", "pending"], default: "pending" },
  notes: { type: String, default: "" },
  source: { type: String, enum: ["voice", "manual", "ocr"], default: "manual" } // Bill source
}, { timestamps: true });

export default mongoose.model("Bill", BillSchema);
