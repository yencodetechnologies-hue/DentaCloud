import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema(
  {
    contact: { type: String, trim: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    calledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    notes: { type: String, trim: true },
    outcome: { type: String, enum: ["answered", "missed", "callback", "voicemail", "other"], default: "answered" },
    followUpDate: { type: Date },
    duration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("CallLog", callLogSchema);
