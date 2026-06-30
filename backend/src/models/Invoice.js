import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    description: { type: String, trim: true },
    qty: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, unique: true, trim: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    date: { type: Date, default: Date.now },
    items: { type: [itemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    status: { type: String, enum: ["paid", "partial", "unpaid"], default: "unpaid" },
    paymentMethod: { type: String, enum: ["cash", "card", "upi", "insurance", "other"], default: "cash" },
  },
  { timestamps: true }
);

invoiceSchema.pre("validate", function (next) {
  const sub = (this.items || []).reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0);
  this.subtotal = sub;
  this.total = Math.max(0, sub + (this.tax || 0) - (this.discount || 0));
  if (this.paid >= this.total && this.total > 0) this.status = "paid";
  else if (this.paid > 0) this.status = "partial";
  else this.status = "unpaid";
  next();
});

export default mongoose.model("Invoice", invoiceSchema);
