import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    description: { type: String, trim: true },
    hsn: { type: String, trim: true },
    qty: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    gstRate: { type: Number, default: 0 },
  },
  { _id: false }
);

const estimateSchema = new mongoose.Schema(
  {
    estimateNo: { type: String, unique: true, trim: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    date: { type: Date, default: Date.now },
    validUntil: { type: Date },
    items: { type: [itemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    taxBreakdown: {
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
    },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "sent", "accepted", "rejected", "converted"], default: "draft" },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

estimateSchema.pre("validate", function (next) {
  const sub = (this.items || []).reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0);
  const totalGst = (this.items || []).reduce(
    (s, it) => s + ((it.qty || 0) * (it.price || 0) * (it.gstRate || 0)) / 100,
    0
  );
  this.subtotal = sub;
  this.taxBreakdown = { cgst: totalGst / 2, sgst: totalGst / 2, igst: 0 };
  this.tax = totalGst;
  this.total = Math.max(0, sub + totalGst - (this.discount || 0));
  next();
});

export default mongoose.model("Estimate", estimateSchema);
