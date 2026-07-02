// Single integration point for outbound notifications.
// Currently a no-op: every notification is created with status "logged".
// To wire up a real provider (Twilio for sms/whatsapp, nodemailer for email),
// implement the send here and update the returned status to "sent"/"failed".
export async function sendNotification(doc) {
  return doc;
}
