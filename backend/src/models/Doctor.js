import mongoose from "mongoose";
import { nextSeq } from "./Counter.js";

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

const feeStructureSchema = new mongoose.Schema(
  {
    procedure: { type: String, trim: true },
    procedureRef: { type: mongoose.Schema.Types.ObjectId, ref: "Procedure" },
    fee: { type: Number, default: 0 },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    upid: { type: String, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    titlePrefix: { type: String, trim: true },
    firstName: { type: String, trim: true },
    lastNamePrefix: { type: String, trim: true },
    lastName: { type: String, trim: true },
    specialization: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    altPhoneRelation: { type: String, trim: true },
    alternativePhone: { type: String, trim: true },
    landline: { type: String, trim: true },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    dob: { type: Date },
    age: { type: Number, default: 0 },
    location: { type: String, trim: true },
    address1: { type: String, trim: true },
    address2: { type: String, trim: true },
    pincode: { type: String, trim: true },
    sourceOfReference: { type: String, trim: true },
    referenceBy: { type: String, trim: true },
    image: { type: String, trim: true },
    qualification: { type: String, trim: true },
    degrees: {
      bdsYear: { type: Number },
      mdsYear: { type: Number },
      bds: { type: String, trim: true },
      mds: { type: String, trim: true },
    },
    dciRegNo: { type: String, trim: true },
    accountHolderName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    accountType: { type: String, trim: true },
    bankName: { type: String, trim: true },
    bankBranchName: { type: String, trim: true },
    ifscCode: { type: String, trim: true, uppercase: true },
    upiId: { type: String, trim: true },
    experience: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    procedures: { type: [String], default: [] },
    availability: { type: [availabilitySchema], default: [] },
    weeklySchedule: { type: [weeklyScheduleSchema], default: [] },
    feeStructure: { type: [feeStructureSchema], default: [] },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    status: { type: String, enum: ["active", "on-leave", "inactive"], default: "active" },
  },
  { timestamps: true }
);

doctorSchema.pre("validate", async function generateUpid(next) {
  try {
    if (!this.upid) {
      const seq = await nextSeq("doctorUpid");
      this.upid = `DR-${String(seq).padStart(5, "0")}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("Doctor", doctorSchema);
