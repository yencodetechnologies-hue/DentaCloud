import mongoose from "mongoose";

const locSchema = new mongoose.Schema(
  {
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    personType: { type: String, enum: ["Staff", "Doctor"], required: true },
    person: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "personType" },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    date: { type: Date, required: true },
    checkIn: { type: String, trim: true },
    checkOut: { type: String, trim: true },
    checkInLoc: { type: locSchema },
    checkOutLoc: { type: locSchema },
    hours: { type: Number, default: 0 },
    status: { type: String, enum: ["present", "absent", "half-day", "leave"], default: "present" },
  },
  { timestamps: true }
);

function parseTime(t) {
  if (!t) return null;
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = (m[3] || "").toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h + min / 60;
}

attendanceSchema.pre("validate", function (next) {
  if (this.date) this.date = new Date(new Date(this.date).setHours(0, 0, 0, 0));
  const inH = parseTime(this.checkIn);
  const outH = parseTime(this.checkOut);
  if (inH != null && outH != null && outH >= inH) {
    this.hours = Math.round((outH - inH) * 100) / 100;
  }
  next();
});

attendanceSchema.index({ person: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
