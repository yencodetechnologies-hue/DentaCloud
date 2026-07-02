import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    personType: { type: String, enum: ["Staff", "Doctor"], required: true },
    person: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "personType" },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    date: { type: Date, required: true },
    checkIn: { type: String, trim: true },
    checkOut: { type: String, trim: true },
    status: { type: String, enum: ["present", "absent", "half-day", "leave"], default: "present" },
  },
  { timestamps: true }
);

attendanceSchema.pre("validate", function (next) {
  if (this.date) this.date = new Date(new Date(this.date).setHours(0, 0, 0, 0));
  next();
});

attendanceSchema.index({ person: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
