import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    type: {
      type: String,
      enum: ["treatment-report", "dos-donts", "xray", "prescription", "lab-report", "photo"],
      required: true,
    },
    title: { type: String, trim: true },
    notes: { type: String, trim: true },
    files: { type: [String], default: [] },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
