import mongoose from "mongoose";

const treatmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    category: {
      type: String,
      enum: ["General", "Orthodontics", "Endodontics", "Periodontics", "Prosthodontics", "Surgery", "Cosmetic"],
      default: "General",
    },
    toothNumber: { type: String, trim: true },
    cost: { type: Number, default: 0 },
    sessions: { type: Number, default: 1 },
    startDate: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["planned", "ongoing", "completed", "cancelled"],
      default: "planned",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Treatment", treatmentSchema);
