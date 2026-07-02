import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["dental-chair", "xray-machine", "scanner", "autoclave", "other"], default: "other" },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    purchaseDate: { type: Date },
    lastServiceDate: { type: Date },
    nextServiceDate: { type: Date },
    repairCost: { type: Number, default: 0 },
    warrantyUntil: { type: Date },
    amcUntil: { type: Date },
    status: { type: String, enum: ["active", "under-repair", "retired"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("Equipment", equipmentSchema);
