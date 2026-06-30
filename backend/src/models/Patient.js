import mongoose from "mongoose";
import { nextSeq } from "./Counter.js";

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    pincode: { type: String, trim: true },
  },
  { _id: false }
);

const medicalSchema = new mongoose.Schema(
  {
    diabetes: { type: Boolean, default: false },
    bloodPressure: { type: Boolean, default: false },
    heartDisease: { type: Boolean, default: false },
    asthma: { type: Boolean, default: false },
    epilepsy: { type: Boolean, default: false },
    thyroid: { type: Boolean, default: false },
    pregnancy: { type: Boolean, default: false },
  },
  { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    // 1. Basic details
    name: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true, default: "male" },
    dob: { type: Date },
    age: { type: Number, default: 0 },
    photo: { type: String, trim: true },

    // 2. Contact details
    phone: { type: String, required: true, trim: true },
    altPhone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: addressSchema, default: () => ({}) },

    // 3. Identification
    patientId: { type: String, unique: true, trim: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    referredBy: { type: String, trim: true },

    // legacy / quick reference
    bloodGroup: { type: String, trim: true },

    // 4. Medical history
    medical: { type: medicalSchema, default: () => ({}) },
    allergies: { type: String, trim: true },
    currentMedications: { type: String, trim: true },

    // 5. Dental history
    previousTreatment: { type: Boolean, default: false },
    lastVisitDate: { type: Date },
    toothPainHistory: { type: String, trim: true },
    gumBleeding: { type: Boolean, default: false },
    ongoingProblem: { type: String, trim: true },

    // 6. Visit information
    firstVisitDate: { type: Date, default: Date.now },
    reasonForVisit: {
      type: String,
      enum: ["toothPain", "cleaning", "checkup", "cosmetic", "emergency", ""],
      default: "",
    },

    // 7. Billing info
    insurance: { type: Boolean, default: false },
    paymentPreference: { type: String, enum: ["cash", "upi", "card", ""], default: "" },

    // 8. Attachments
    idProof: { type: String, trim: true },
    xray: { type: String, trim: true },
    prescriptions: { type: [String], default: [] },

    // 9. Notes
    comments: { type: String, trim: true },
    doctorInstructions: { type: String, trim: true },
    specialNotes: { type: String, trim: true },

    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

patientSchema.pre("validate", async function generatePatientId(next) {
  try {
    if (!this.patientId) {
      const seq = await nextSeq("patientId");
      this.patientId = `EVD-${String(seq).padStart(5, "0")}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("Patient", patientSchema);
