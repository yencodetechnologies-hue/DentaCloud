import CrudPage from "../components/CrudPage.jsx";
import PageDashboard from "../components/PageDashboard.jsx";
import Badge from "../components/Badge.jsx";
import useOptions from "../hooks/useOptions.js";
import { useAuth } from "../context/AuthContext.jsx";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

const OUTCOMES = [
  { value: "answered", label: "Answered" },
  { value: "missed", label: "Missed" },
  { value: "callback", label: "Callback" },
  { value: "voicemail", label: "Voicemail" },
  { value: "other", label: "Other" },
];

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-IN") : "—";
}

export default function CallLogs() {
  const { user } = useAuth();
  const patients = useOptions("patients", (p) => ({ value: p._id, label: p.name }));

  return (
    <CrudPage
      title="Call Logs"
      subtitle="Log calls and what was discussed for follow-up management."
      endpoint="call-logs"
      singular="Call Log"
      wideForm
      defaultValues={{ outcome: "answered" }}
      topContent={
        <PageDashboard
          resource="call-logs"
          cards={[
            { key: "total", label: "Total Calls", icon: "📞" },
            { key: "today", label: "Today", icon: "📅" },
            { key: "callback", label: "Callbacks", icon: "🔁" },
          ]}
        />
      }
      columns={[
        { key: "contact", header: "Contact", render: (r) => r.contact || r.patient?.phone || "—" },
        { key: "patient", header: "Patient", render: (r) => r.patient?.name || "—" },
        { key: "outcome", header: "Outcome", render: (r) => <Badge value={r.outcome} /> },
        { key: "notes", header: "Notes", render: (r) => (r.notes || "—").slice(0, 60) },
        { key: "createdAt", header: "When", render: (r) => fmtDate(r.createdAt) },
      ]}
      fields={[
        { name: "contact", label: "Phone / Contact", required: true },
        { name: "patient", label: "Patient", type: "select", options: patients },
        { name: "branch", label: "Branch", type: "clinicBranch" },
        { name: "outcome", label: "Outcome", type: "select", options: OUTCOMES },
        { name: "followUpDate", label: "Follow-up Date", type: "date" },
        { name: "duration", label: "Duration (mins)", type: "number" },
        { name: "notes", label: "What was discussed", type: "textarea", full: true, required: true },
      ]}
      toForm={(r) => ({
        contact: r.contact || "",
        patient: r.patient?._id || "",
        branch: r.branch?._id || "",
        outcome: r.outcome || "answered",
        followUpDate: r.followUpDate ? new Date(r.followUpDate).toISOString().slice(0, 10) : "",
        duration: r.duration ?? 0,
        notes: r.notes || "",
      })}
      toPayload={(v) => ({
        ...v,
        patient: v.patient || null,
        branch: v.branch || null,
        calledBy: user?.id || null,
        followUpDate: v.followUpDate || null,
        duration: Number(v.duration) || 0,
      })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Contact" value={r.contact} />
          <DetailItem label="Patient" value={r.patient?.name} />
          <DetailItem label="Branch" value={r.branch?.name} />
          <DetailItem label="Outcome" value={<Badge value={r.outcome} />} />
          <DetailItem label="Follow-up" value={fmtDate(r.followUpDate)} />
          <DetailItem label="Duration" value={`${r.duration || 0} mins`} />
          <DetailItem label="Called By" value={r.calledBy?.name || "—"} />
          <DetailItem label="Notes" value={r.notes} full />
        </DetailGrid>
      )}
    />
  );
}
