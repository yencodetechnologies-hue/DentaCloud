import mongoose from "mongoose";

const enterpriseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    owner: { type: String, trim: true },
    gstin: { type: String, trim: true, uppercase: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    logo: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

enterpriseSchema.index({ name: "text", code: "text" });

export default mongoose.model("Enterprise", enterpriseSchema);
