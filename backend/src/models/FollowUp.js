import mongoose from "mongoose";

const followUpSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    relatedAppointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    dueDate: { type: Date, required: true },
    reason: { type: String, trim: true },
    status: { type: String, enum: ["pending", "completed", "missed"], default: "pending" },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("FollowUp", followUpSchema);
