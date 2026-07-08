import mongoose from "mongoose";

const fixedCostSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    amount: { type: Number, default: 0 },
    frequency: { type: String, enum: ["monthly", "quarterly", "yearly", "one-time"], default: "monthly" },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    enterprise: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise" },
    notes: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("FixedCost", fixedCostSchema);
