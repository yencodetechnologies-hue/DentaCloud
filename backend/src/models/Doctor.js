import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    qualification: { type: String, trim: true },
    experience: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    status: { type: String, enum: ["active", "on-leave", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);
