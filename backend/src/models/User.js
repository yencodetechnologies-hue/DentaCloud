import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: [
        "dental-admin",
        "admin",
        "doctor",
        "staff",
        "csa",
        "housekeeping",
        "security",
        "patient",
        "vendor",
      ],
      default: "dental-admin",
    },
    avatar: { type: String, default: "" },
    enterprise: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise" },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    linkedRef: { type: mongoose.Schema.Types.ObjectId, refPath: "linkedModel" },
    linkedModel: {
      type: String,
      enum: ["Doctor", "Staff", "Patient", "Vendor", ""],
      default: "",
    },
    accountType: {
      type: String,
      enum: ["clinic", "enterprise"],
      default: "clinic",
    },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
