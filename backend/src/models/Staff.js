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

const staffSchema = new mongoose.Schema(
  {
    employeeId: { type: String, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    titlePrefix: { type: String, trim: true },
    firstName: { type: String, trim: true },
    lastNamePrefix: { type: String, trim: true },
    lastName: { type: String, trim: true },
    role: { type: String, trim: true, default: "Receptionist" },
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
    jobResponsibilities: { type: String, trim: true },
    documents: { type: [documentSchema], default: [] },
    offerLetter: { type: String, trim: true },
    accountHolderName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    accountType: { type: String, trim: true },
    bankName: { type: String, trim: true },
    bankBranchName: { type: String, trim: true },
    ifscCode: { type: String, trim: true, uppercase: true },
    shift: { type: String, enum: ["morning", "evening", "night", "full-day"], default: "morning" },
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
