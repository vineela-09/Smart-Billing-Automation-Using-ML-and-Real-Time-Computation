import mongoose from "mongoose";

const MathOperationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  expression: { type: String, required: true }, // e.g., "2 plus 3"
  result: { type: Number, required: true }, // e.g., 5
  operationType: { 
    type: String, 
    enum: ["addition", "subtraction", "multiplication", "division", "modulo", "power", "voice_math"], 
    default: "voice_math" 
  },
  displayExpression: String, // e.g., "2 + 3 = 5"
  timestamp: { type: Date, default: Date.now },
  source: { type: String, default: "voice" }
}, { timestamps: true });

export default mongoose.model("MathOperation", MathOperationSchema);
