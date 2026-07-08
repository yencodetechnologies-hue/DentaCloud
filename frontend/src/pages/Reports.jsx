import CrudPage from "../components/CrudPage.jsx";
import PageDashboard from "../components/PageDashboard.jsx";
import Badge from "../components/Badge.jsx";
import useOptions from "../hooks/useOptions.js";
import FileDrop from "../components/FileDrop.jsx";
import ClinicBranchField from "../components/ClinicBranchField.jsx";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

const REPORT_TYPES = [
  { value: "treatment-report", label: "Treatment Report" },
  { value: "dos-donts", label: "Do's & Don'ts" },
  { value: "xray", label: "X-Ray" },
  { value: "prescription", label: "Prescription" },
  { value: "lab-report", label: "Lab Report" },
  { value: "photo", label: "Photo" },
];

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-IN") : "—";
}
function toDateInput(d) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export default function Reports() {
  const patients = useOptions("patients", (p) => ({ value: p._id, label: `${p.name} (${p.patientId})` }));
  const doctors = useOptions("doctors", (d) => ({ value: d._id, label: d.name }));

  return (
    <CrudPage
      title="Reports"
      subtitle="Clinical reports, X-rays, prescriptions, lab reports and photos."
      endpoint="reports"
      singular="Report"
      wideForm
      defaultValues={{ type: "treatment-report", date: toDateInput(new Date()), files: [] }}
      topContent={
        <PageDashboard
          resource="reports"
          cards={[
            { key: "total", label: "Total Reports", icon: "📋" },
            { key: "treatment", label: "Treatment Reports", icon: "🦷" },
            { key: "xray", label: "X-Rays", icon: "🩻" },
          ]}
        />
      }
      columns={[
        { key: "title", header: "Title", render: (r) => r.title || REPORT_TYPES.find((t) => t.value === r.type)?.label },
        { key: "type", header: "Type", render: (r) => <Badge value={r.type} /> },
        { key: "patient", header: "Patient", render: (r) => r.patient?.name || "—" },
        { key: "doctor", header: "Doctor", render: (r) => r.doctor?.name || "—" },
        { key: "date", header: "Date", render: (r) => fmtDate(r.date) },
      ]}
      fields={[]}
      renderForm={({ values, setValues }) => (
        <div className="form-grid">
          <div className="field">
            <label>Type <span className="req">*</span></label>
            <select value={values.type} onChange={(e) => setValues({ ...values, type: e.target.value })} required>
              {REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Patient <span className="req">*</span></label>
            <select value={values.patient || ""} onChange={(e) => setValues({ ...values, patient: e.target.value })} required>
              <option value="">Select…</option>
              {patients.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Doctor</label>
            <select value={values.doctor || ""} onChange={(e) => setValues({ ...values, doctor: e.target.value })}>
              <option value="">Select…</option>
              {doctors.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <ClinicBranchField
            value={values.branch || ""}
            onChange={(branchId) => setValues({ ...values, branch: branchId })}
          />
          <div className="field">
            <label>Title</label>
            <input value={values.title || ""} onChange={(e) => setValues({ ...values, title: e.target.value })} />
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={values.date || ""} onChange={(e) => setValues({ ...values, date: e.target.value })} />
          </div>
          <div className="field full">
            <label>Notes</label>
            <textarea value={values.notes || ""} onChange={(e) => setValues({ ...values, notes: e.target.value })} rows={3} />
          </div>
          <div className="field full">
            <label>Files</label>
            <FileDrop
              files={values.files || []}
              onChange={(files) => setValues({ ...values, files })}
            />
          </div>
        </div>
      )}
      toForm={(r) => ({
        type: r.type,
        patient: r.patient?._id || "",
        doctor: r.doctor?._id || "",
        branch: r.branch?._id || "",
        title: r.title || "",
        notes: r.notes || "",
        date: toDateInput(r.date),
        files: r.files || [],
      })}
      toPayload={(v) => ({
        ...v,
        doctor: v.doctor || null,
        branch: v.branch || null,
        date: v.date || new Date(),
      })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Type" value={<Badge value={r.type} />} />
          <DetailItem label="Patient" value={r.patient?.name} />
          <DetailItem label="Doctor" value={r.doctor?.name} />
          <DetailItem label="Branch" value={r.branch?.name} />
          <DetailItem label="Title" value={r.title} />
          <DetailItem label="Date" value={fmtDate(r.date)} />
          <DetailItem label="Notes" value={r.notes} full />
          <DetailItem
            label="Files"
            value={
              (r.files || []).length
                ? (r.files || []).map((f, i) => <a key={i} href={f} target="_blank" rel="noreferrer" style={{ display: "block" }}>File {i + 1}</a>)
                : "—"
            }
            full
          />
        </DetailGrid>
      )}
    />
  );
}
