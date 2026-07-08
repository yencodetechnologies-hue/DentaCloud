import CrudPage from "../components/CrudPage.jsx";
import PageDashboard from "../components/PageDashboard.jsx";
import Badge from "../components/Badge.jsx";
import useOptions from "../hooks/useOptions.js";
import api, { apiError } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

const STATUS = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "missed", label: "Missed" },
];

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function toDateInput(d) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default function FollowUps() {
  const patients = useOptions("patients", (p) => ({ value: p._id, label: p.name }));
  const doctors = useOptions("doctors", (d) => ({ value: d._id, label: d.name }));
  const toast = useToast();

  async function logReminder(r) {
    try {
      await api.post("/notifications", {
        type: "followup-reminder",
        channel: "sms",
        recipientName: r.patient?.name,
        recipientContact: r.patient?.phone,
        message: `Reminder: follow-up due ${fmtDate(r.dueDate)}${r.reason ? ` (${r.reason})` : ""}`,
        relatedEntityType: "FollowUp",
        relatedEntityId: r._id,
        branch: r.branch?._id,
      });
      toast.success("Reminder logged");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <CrudPage
      title="Follow-ups"
      subtitle="Track upcoming and missed patient follow-ups."
      endpoint="follow-ups"
      singular="Follow-up"
      statusOptions={STATUS}
      defaultValues={{ status: "pending", dueDate: toDateInput(new Date()) }}
      topContent={
        <PageDashboard
          resource="follow-ups"
          cards={[
            { key: "pending", label: "Pending", icon: "🔁" },
            { key: "overdue", label: "Overdue", icon: "⚠️" },
            { key: "total", label: "Total", icon: "📊" },
          ]}
        />
      }
      columns={[
        { key: "patient", header: "Patient", render: (r) => r.patient?.name || "—" },
        { key: "doctor", header: "Doctor", render: (r) => r.doctor?.name || "—" },
        { key: "reason", header: "Reason", render: (r) => r.reason || "—" },
        { key: "dueDate", header: "Due Date", render: (r) => fmtDate(r.dueDate) },
        {
          key: "status",
          header: "Status",
          render: (r) => {
            const isMissed = r.status === "pending" && r.dueDate && new Date(r.dueDate) < new Date().setHours(0, 0, 0, 0);
            return <Badge value={isMissed ? "missed" : r.status} />;
          },
        },
        {
          key: "remind",
          header: "",
          render: (r) =>
            r.status === "pending" ? (
              <button type="button" className="btn btn-sm" onClick={(e) => { e.stopPropagation(); logReminder(r); }}>
                🔔 Remind
              </button>
            ) : null,
        },
      ]}
      fields={() => [
        { name: "patient", label: "Patient", type: "select", options: patients, required: true },
        { name: "doctor", label: "Doctor", type: "select", options: doctors },
        { name: "branch", label: "Branch", type: "clinicBranch" },
        { name: "dueDate", label: "Due Date", type: "date", required: true },
        { name: "reason", label: "Reason", placeholder: "e.g. Post-treatment review" },
        { name: "status", label: "Status", type: "select", options: STATUS },
        { name: "notes", label: "Notes", type: "textarea", full: true },
      ]}
      toForm={(r) => ({
        patient: r.patient?._id || "",
        doctor: r.doctor?._id || "",
        branch: r.branch?._id || "",
        dueDate: toDateInput(r.dueDate),
        reason: r.reason,
        status: r.status,
        notes: r.notes,
      })}
      toPayload={(v) => ({ ...v, doctor: v.doctor || null, branch: v.branch || null })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Patient" value={r.patient?.name} />
          <DetailItem label="Doctor" value={r.doctor?.name} />
          <DetailItem label="Branch" value={r.branch?.name} />
          <DetailItem label="Due Date" value={fmtDate(r.dueDate)} />
          <DetailItem label="Reason" value={r.reason} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
          <DetailItem label="Notes" value={r.notes} full />
        </DetailGrid>
      )}
    />
  );
}
