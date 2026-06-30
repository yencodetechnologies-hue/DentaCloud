import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true, default: "Receptionist" },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    shift: { type: String, enum: ["morning", "evening", "night", "full-day"], default: "morning" },
    salary: { type: Number, default: 0 },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("Staff", staffSchema);
