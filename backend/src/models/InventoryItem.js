import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ["material", "chair", "other"], default: "material" },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    quantity: { type: Number, default: 0 },
    unit: { type: String, trim: true, default: "units" },
    amount: { type: Number, default: 0 },
    ratePerUnit: { type: Number, default: 0 },
    charge: { type: Number, default: 0 },
    instructions: { type: String, trim: true },
    purchaseDate: { type: Date },
    expiryDate: { type: Date },
    warrantyUntil: { type: Date },
    invoiceUrl: { type: String, trim: true },
    reorderLevel: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("InventoryItem", inventoryItemSchema);
