import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
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
    experience: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    status: { type: String, enum: ["active", "on-leave", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);
