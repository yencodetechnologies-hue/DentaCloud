import { useEffect, useState } from "react";
import CrudPage from "../components/CrudPage.jsx";
import Badge from "../components/Badge.jsx";
import api from "../api/client.js";
import useOptions from "../hooks/useOptions.js";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

const CATEGORIES = [
  { value: "General", label: "General" },
  { value: "Orthodontics", label: "Orthodontics" },
  { value: "Endodontics", label: "Endodontics" },
  { value: "Periodontics", label: "Periodontics" },
  { value: "Prosthodontics", label: "Prosthodontics" },
  { value: "Surgery", label: "Surgery" },
  { value: "Cosmetic", label: "Cosmetic" },
];

const STATUS = [
  { value: "planned", label: "Planned" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const UPPER = ["18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"];
const LOWER = ["48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"];

function money(n) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function TreatmentSummary({ version }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/treatments", { params: { limit: 200 } }).then(({ data }) => setItems(data.data)).catch(() => {});
  }, [version]);

  const by = (s) => items.filter((t) => t.status === s).length;
  const totalValue = items.reduce((s, t) => s + (t.cost || 0), 0);
  const ongoingTeeth = new Set(items.filter((t) => t.status === "ongoing").map((t) => t.toothNumber));
  const completedTeeth = new Set(items.filter((t) => t.status === "completed").map((t) => t.toothNumber));

  const cards = [
    { icon: "🗓️", bg: "#EAE8FF", value: by("planned"), label: "Planned" },
    { icon: "⏳", bg: "#FFF3E3", value: by("ongoing"), label: "Ongoing" },
    { icon: "✅", bg: "#E3FBF6", value: by("completed"), label: "Completed" },
    { icon: "💰", bg: "#E3FBF6", value: money(totalValue), label: "Total Value", isText: true },
  ];

  function toothClass(n) {
    if (ongoingTeeth.has(n)) return "tooth attention";
    if (completedTeeth.has(n)) return "tooth treated";
    return "tooth healthy";
  }

  return (
    <div style={{ marginBottom: 18 }}>
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 18 }}>
        {cards.map((c, i) => (
          <div className="stat-card" key={i}>
            <div className="top-row">
              <div className="ic" style={{ background: c.bg }}>{c.icon}</div>
            </div>
            <div className="num" style={{ fontSize: c.isText ? 22 : 30 }}>{c.value}</div>
            <div className="lbl">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginBottom: 0 }}>
        <div className="panel-head">
          <h3>Dental Chart Overview</h3>
          <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "var(--muted)" }}>
            <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "#E3FBF6", border: "1px solid var(--mint-dim)", marginRight: 5, verticalAlign: "middle" }}></span>Completed</span>
            <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "#FFEDEB", border: "1px solid var(--coral)", marginRight: 5, verticalAlign: "middle" }}></span>Ongoing</span>
          </div>
        </div>
        <div className="toothmap" style={{ marginBottom: 8 }}>
          {UPPER.map((n) => <div className={toothClass(n)} key={n}>{n}</div>)}
        </div>
        <div className="toothmap">
          {LOWER.map((n) => <div className={toothClass(n)} key={n}>{n}</div>)}
        </div>
      </div>
    </div>
  );
}

export default function Treatments() {
  const patients = useOptions("patients", (p) => ({ value: p._id, label: p.name }));
  const doctors = useOptions("doctors", (d) => ({ value: d._id, label: d.name }));
  const branches = useOptions("branches", (b) => ({ value: b._id, label: b.name }));

  return (
    <CrudPage
      title="Treatments"
      subtitle="Plan and track dental treatments and procedures."
      endpoint="treatments"
      singular="Treatment"
      statusOptions={STATUS}
      defaultValues={{ status: "planned", category: "General", cost: 0, sessions: 1 }}
      topContent={<TreatmentSummary />}
      columns={[
        {
          key: "name",
          header: "Treatment",
          render: (r) => (
            <div className="cell-avatar">
              <div className="av">🦷</div>
              <div>
                <div className="cell-main">{r.name}</div>
                <div className="cell-sub">{r.category} · Tooth {r.toothNumber || "—"}</div>
              </div>
            </div>
          ),
        },
        { key: "patient", header: "Patient", render: (r) => r.patient?.name || "—" },
        { key: "doctor", header: "Doctor", render: (r) => r.doctor?.name || "—" },
        { key: "cost", header: "Cost", render: (r) => money(r.cost) },
        { key: "sessions", header: "Sessions", render: (r) => r.sessions || 1 },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
      ]}
      fields={() => [
        { name: "name", label: "Treatment Name", required: true, placeholder: "e.g. Root Canal Therapy" },
        { name: "category", label: "Category", type: "select", options: CATEGORIES },
        { name: "patient", label: "Patient", type: "select", options: patients, required: true },
        { name: "doctor", label: "Doctor", type: "select", options: doctors },
        { name: "branch", label: "Branch", type: "select", options: branches },
        { name: "toothNumber", label: "Tooth Number", placeholder: "e.g. 36 or Full" },
        { name: "cost", label: "Cost (₹)", type: "number", min: 0 },
        { name: "sessions", label: "Sessions", type: "number", min: 1 },
        { name: "startDate", label: "Start Date", type: "date" },
        { name: "status", label: "Status", type: "select", options: STATUS },
        { name: "notes", label: "Notes", type: "textarea", full: true },
      ]}
      toForm={(r) => ({
        name: r.name,
        category: r.category,
        patient: r.patient?._id || "",
        doctor: r.doctor?._id || "",
        branch: r.branch?._id || "",
        toothNumber: r.toothNumber,
        cost: r.cost,
        sessions: r.sessions,
        startDate: r.startDate ? new Date(r.startDate).toISOString().slice(0, 10) : "",
        status: r.status,
        notes: r.notes,
      })}
      toPayload={(v) => ({ ...v, doctor: v.doctor || null, branch: v.branch || null })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Treatment" value={r.name} />
          <DetailItem label="Category" value={r.category} />
          <DetailItem label="Patient" value={r.patient?.name} />
          <DetailItem label="Doctor" value={r.doctor?.name} />
          <DetailItem label="Branch" value={r.branch?.name} />
          <DetailItem label="Tooth Number" value={r.toothNumber} />
          <DetailItem label="Cost" value={money(r.cost)} />
          <DetailItem label="Sessions" value={r.sessions} />
          <DetailItem label="Start Date" value={fmtDate(r.startDate)} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
          <DetailItem label="Notes" value={r.notes} full />
        </DetailGrid>
      )}
    />
  );
}
