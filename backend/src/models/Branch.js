import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    enterprise: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise" },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    city: { type: String, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    manager: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

branchSchema.index({ name: "text", city: "text", code: "text" });

export default mongoose.model("Branch", branchSchema);
