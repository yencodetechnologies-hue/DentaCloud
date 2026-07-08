import mongoose from "mongoose";

const financialProfileSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    enterprise: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise" },
    openingCapital: { type: Number, default: 0 },
    monthlyFixedCostTotal: { type: Number, default: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

financialProfileSchema.index({ branch: 1 }, { unique: true });

export default mongoose.model("FinancialProfile", financialProfileSchema);
