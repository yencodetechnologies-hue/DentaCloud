import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["appointment-reminder", "followup-reminder", "payment-reminder", "stock-expiry", "equipment-service", "thank-you"],
      required: true,
    },
    channel: { type: String, enum: ["sms", "whatsapp", "email", "push"], required: true },
    recipientName: { type: String, trim: true },
    recipientContact: { type: String, trim: true },
    message: { type: String, trim: true },
    relatedEntityType: { type: String, trim: true },
    relatedEntityId: { type: mongoose.Schema.Types.ObjectId },
    status: { type: String, enum: ["logged", "sent", "failed"], default: "logged" },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
