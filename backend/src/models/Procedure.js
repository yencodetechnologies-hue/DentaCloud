import mongoose from "mongoose";

const procedureSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    category: {
      type: String,
      enum: ["General", "Orthodontics", "Endodontics", "Periodontics", "Prosthodontics", "Surgery", "Cosmetic", "Diagnostic"],
      default: "General",
    },
    charge: { type: Number, default: 0 },
    defaultSessions: { type: Number, default: 1 },
    description: { type: String, trim: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    enterprise: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("Procedure", procedureSchema);
