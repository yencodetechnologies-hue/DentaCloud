import nodemailer from "nodemailer";
import Notification from "../models/Notification.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const tx = getTransporter();
  if (!tx) {
    console.warn("[notify] SMTP not configured — email logged only");
    return { sent: false, reason: "smtp_not_configured" };
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await tx.sendMail({ from, to, subject, text, html });
  return { sent: true };
}

export async function sendNotification(doc) {
  if (doc.channel !== "email" || !doc.recipientContact) {
    return doc;
  }
  try {
    const result = await sendEmail({
      to: doc.recipientContact,
      subject: doc.type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      text: doc.message,
      html: `<p>${(doc.message || "").replace(/\n/g, "<br>")}</p>`,
    });
    doc.status = result.sent ? "sent" : "logged";
    if (doc.save) await doc.save();
    return doc;
  } catch (err) {
    console.error("[notify] send failed:", err.message);
    doc.status = "failed";
    if (doc.save) await doc.save();
    return doc;
  }
}

export async function sendThankYouEmail(patient) {
  if (!patient?.email) return null;
  const message = `Dear ${patient.name},\n\nThank you for registering with Evident Dental. Your patient ID is ${patient.patientId}.\n\nWe look forward to serving you.\n\nWarm regards,\nEvident Dental Team`;
  const notification = await Notification.create({
    type: "thank-you",
    channel: "email",
    recipientName: patient.name,
    recipientContact: patient.email,
    message,
    relatedEntityType: "Patient",
    relatedEntityId: patient._id,
    branch: patient.branch,
  });
  await sendNotification(notification);
  return notification;
}

export async function createAndSendNotification(payload) {
  const doc = await Notification.create(payload);
  return sendNotification(doc);
}
