import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    enterprise: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise" },
    notes: { type: String, trim: true },
    category: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Investment", investmentSchema);
