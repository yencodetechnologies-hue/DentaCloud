import CrudPage from "../components/CrudPage.jsx";
import Badge from "../components/Badge.jsx";
import useOptions from "../hooks/useOptions.js";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

const STATUS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no-show", label: "No Show" },
];

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function toDateInput(d) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default function Appointments() {
  const patients = useOptions("patients", (p) => ({ value: p._id, label: p.name }));
  const doctors = useOptions("doctors", (d) => ({ value: d._id, label: d.name }));
  const branches = useOptions("branches", (b) => ({ value: b._id, label: b.name }));

  return (
    <CrudPage
      title="Appointments"
      subtitle="Book and track appointments across doctors and branches."
      endpoint="appointments"
      singular="Appointment"
      statusOptions={STATUS}
      defaultValues={{ status: "scheduled", date: toDateInput(new Date()) }}
      columns={[
        {
          key: "patient",
          header: "Patient",
          render: (r) => (
            <div className="cell-avatar">
              <div className="av">{(r.patient?.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("")}</div>
              <div>
                <div className="cell-main">{r.patient?.name || "—"}</div>
                <div className="cell-sub">{r.treatment || "Consultation"}</div>
              </div>
            </div>
          ),
        },
        { key: "doctor", header: "Doctor", render: (r) => r.doctor?.name || "—" },
        { key: "branch", header: "Branch", render: (r) => r.branch?.name || "—" },
        { key: "date", header: "Date", render: (r) => fmtDate(r.date) },
        { key: "time", header: "Time", render: (r) => r.time || "—" },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
      ]}
      fields={() => [
        { name: "patient", label: "Patient", type: "select", options: patients, required: true },
        { name: "doctor", label: "Doctor", type: "select", options: doctors, required: true },
        { name: "branch", label: "Branch", type: "select", options: branches },
        { name: "date", label: "Date", type: "date", required: true },
        { name: "time", label: "Time", placeholder: "e.g. 10:30 AM" },
        { name: "treatment", label: "Treatment", placeholder: "e.g. Root Canal" },
        { name: "status", label: "Status", type: "select", options: STATUS },
        { name: "notes", label: "Notes", type: "textarea", full: true },
      ]}
      toForm={(r) => ({ patient: r.patient?._id || "", doctor: r.doctor?._id || "", branch: r.branch?._id || "", date: toDateInput(r.date), time: r.time, treatment: r.treatment, status: r.status, notes: r.notes })}
      toPayload={(v) => ({ ...v, branch: v.branch || null })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Patient" value={r.patient?.name} />
          <DetailItem label="Doctor" value={r.doctor?.name} />
          <DetailItem label="Branch" value={r.branch?.name} />
          <DetailItem label="Date" value={fmtDate(r.date)} />
          <DetailItem label="Time" value={r.time} />
          <DetailItem label="Treatment" value={r.treatment} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
          <DetailItem label="Notes" value={r.notes} full />
        </DetailGrid>
      )}
    />
  );
}
