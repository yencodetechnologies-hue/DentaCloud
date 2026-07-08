import CrudPage from "../components/CrudPage.jsx";
import PageDashboard from "../components/PageDashboard.jsx";
import Badge from "../components/Badge.jsx";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

const TYPE = [
  { value: "appointment-reminder", label: "Appointment Reminder" },
  { value: "followup-reminder", label: "Follow-up Reminder" },
  { value: "payment-reminder", label: "Payment Reminder" },
  { value: "stock-expiry", label: "Stock Expiry" },
  { value: "equipment-service", label: "Equipment Service" },
  { value: "thank-you", label: "Thank You" },
];
const CHANNEL = [
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "push", label: "Push" },
];
const STATUS = [
  { value: "logged", label: "Logged" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
];

function fmtDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function Notifications() {
  return (
    <CrudPage
      title="Notifications"
      subtitle="Log of appointment, follow-up, payment and stock reminders."
      endpoint="notifications"
      singular="Notification"
      topContent={
        <PageDashboard
          resource="notifications"
          cards={[
            { key: "total", label: "Total", icon: "🔔" },
            { key: "sent", label: "Sent", icon: "✅" },
            { key: "failed", label: "Failed", icon: "❌" },
          ]}
        />
      }
      statusOptions={STATUS}
      defaultValues={{ type: "appointment-reminder", channel: "sms", status: "logged" }}
      columns={[
        { key: "type", header: "Type", render: (r) => <span style={{ textTransform: "capitalize" }}>{r.type?.replace(/-/g, " ")}</span> },
        { key: "channel", header: "Channel", render: (r) => <span style={{ textTransform: "uppercase", fontSize: 11 }}>{r.channel}</span> },
        { key: "recipientName", header: "Recipient", render: (r) => r.recipientName || "—" },
        { key: "message", header: "Message", render: (r) => <span className="cell-sub">{(r.message || "").slice(0, 60)}</span> },
        { key: "createdAt", header: "Logged At", render: (r) => fmtDateTime(r.createdAt) },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
      ]}
      fields={() => [
        { name: "type", label: "Type", type: "select", options: TYPE, required: true },
        { name: "channel", label: "Channel", type: "select", options: CHANNEL, required: true },
        { name: "recipientName", label: "Recipient Name" },
        { name: "recipientContact", label: "Recipient Contact" },
        { name: "message", label: "Message", type: "textarea", full: true },
      ]}
      toForm={(r) => ({
        type: r.type,
        channel: r.channel,
        recipientName: r.recipientName,
        recipientContact: r.recipientContact,
        message: r.message,
        status: r.status,
      })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Type" value={r.type} />
          <DetailItem label="Channel" value={r.channel} />
          <DetailItem label="Recipient" value={r.recipientName} />
          <DetailItem label="Contact" value={r.recipientContact} />
          <DetailItem label="Message" value={r.message} full />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
          <DetailItem label="Logged At" value={fmtDateTime(r.createdAt)} />
        </DetailGrid>
      )}
    />
  );
}
