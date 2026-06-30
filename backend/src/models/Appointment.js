import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    date: { type: Date, required: true },
    time: { type: String, trim: true },
    treatment: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
