import mongoose from "mongoose";
import { nextSeq } from "./Counter.js";

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    url: { type: String, trim: true },
    type: { type: String, trim: true },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    day: { type: String, enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], required: true },
    from: { type: String, trim: true },
    to: { type: String, trim: true },
  },
  { _id: false }
);

const timeRangeSchema = new mongoose.Schema(
  {
    from: { type: String, trim: true },
    to: { type: String, trim: true },
  },
  { _id: false }
);

const weeklyScheduleSchema = new mongoose.Schema(
  {
    day: { type: String, enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], required: true },
    status: { type: String, enum: ["available", "weeklyOff", "holiday"], default: "weeklyOff" },
    slots: { type: [timeRangeSchema], default: [] },
    breaks: { type: [timeRangeSchema], default: [] },
  },
  { _id: false }
);

const staffSchema = new mongoose.Schema(
  {
    employeeId: { type: String, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    titlePrefix: { type: String, trim: true },
    firstName: { type: String, trim: true },
    lastNamePrefix: { type: String, trim: true },
    lastName: { type: String, trim: true },
    role: { type: String, trim: true, default: "Admin" },
    designation: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    altPhoneRelation: { type: String, trim: true },
    alternativePhone: { type: String, trim: true },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    dob: { type: Date },
    age: { type: Number, default: 0 },
    location: { type: String, trim: true },
    address1: { type: String, trim: true },
    address2: { type: String, trim: true },
    pincode: { type: String, trim: true },
    qualification: { type: String, trim: true },
    image: { type: String, trim: true },
    joiningDate: { type: Date },
    weeklyOff: { type: [String], default: [] },
    documents: { type: [documentSchema], default: [] },
    accountHolderName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    accountType: { type: String, trim: true },
    bankName: { type: String, trim: true },
    bankBranchName: { type: String, trim: true },
    ifscCode: { type: String, trim: true, uppercase: true },
    upiId: { type: String, trim: true },
    availability: { type: [availabilitySchema], default: [] },
    weeklySchedule: { type: [weeklyScheduleSchema], default: [] },
    salary: { type: Number, default: 0 },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

staffSchema.pre("validate", async function generateEmployeeId(next) {
  try {
    if (!this.employeeId) {
      const seq = await nextSeq("staffEmployeeId");
      this.employeeId = `ST-${String(seq).padStart(5, "0")}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("Staff", staffSchema);
