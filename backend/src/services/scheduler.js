import cron from "node-cron";
import Appointment from "../models/Appointment.js";
import FollowUp from "../models/FollowUp.js";
import Invoice from "../models/Invoice.js";
import Notification from "../models/Notification.js";
import { createAndSendNotification } from "./notify.js";

function dayRange(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function sendAppointmentReminders() {
  const { start, end } = dayRange(1);
  const appts = await Appointment.find({
    date: { $gte: start, $lte: end },
    status: { $in: ["scheduled", "confirmed"] },
  })
    .populate("patient", "name email phone")
    .populate("doctor", "name");

  for (const a of appts) {
    if (!a.patient?.email) continue;
    const exists = await Notification.findOne({
      type: "appointment-reminder",
      relatedEntityId: a._id,
      createdAt: { $gte: dayRange(0).start },
    });
    if (exists) continue;
    await createAndSendNotification({
      type: "appointment-reminder",
      channel: "email",
      recipientName: a.patient.name,
      recipientContact: a.patient.email,
      message: `Reminder: You have an appointment on ${new Date(a.date).toLocaleDateString("en-IN")} at ${a.time || ""} with ${a.doctor?.name || "our doctor"} for ${a.treatment || "consultation"}.`,
      relatedEntityType: "Appointment",
      relatedEntityId: a._id,
      branch: a.branch,
    });
  }
}

async function sendFollowUpReminders() {
  const { start, end } = dayRange(0);
  const items = await FollowUp.find({
    dueDate: { $gte: start, $lte: end },
    status: "pending",
  }).populate("patient", "name email phone");

  for (const f of items) {
    if (!f.patient?.email) continue;
    await createAndSendNotification({
      type: "followup-reminder",
      channel: "email",
      recipientName: f.patient.name,
      recipientContact: f.patient.email,
      message: `Follow-up reminder: ${f.reason || "Please visit the clinic for your follow-up."}`,
      relatedEntityType: "FollowUp",
      relatedEntityId: f._id,
      branch: f.branch,
    });
  }
}

async function sendPaymentReminders() {
  const invoices = await Invoice.find({ status: { $in: ["unpaid", "partial"] } })
    .populate("patient", "name email phone")
    .limit(50);

  for (const inv of invoices) {
    if (!inv.patient?.email) continue;
    const due = (inv.total || 0) - (inv.paid || 0);
    if (due <= 0) continue;
    await createAndSendNotification({
      type: "payment-reminder",
      channel: "email",
      recipientName: inv.patient.name,
      recipientContact: inv.patient.email,
      message: `Payment reminder: Outstanding balance of ₹${due.toLocaleString("en-IN")} on invoice ${inv.invoiceNo || inv._id}.`,
      relatedEntityType: "Invoice",
      relatedEntityId: inv._id,
      branch: inv.branch,
    });
  }
}

export function startReminderScheduler() {
  if (process.env.DISABLE_REMINDER_CRON === "true") return;
  cron.schedule("0 8 * * *", () => {
    sendAppointmentReminders().catch((e) => console.error("[cron] appointment reminders:", e.message));
    sendFollowUpReminders().catch((e) => console.error("[cron] follow-up reminders:", e.message));
  });
  cron.schedule("0 9 * * 1", () => {
    sendPaymentReminders().catch((e) => console.error("[cron] payment reminders:", e.message));
  });
  console.log("[cron] reminder scheduler started");
}
