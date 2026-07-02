import CrudPage from "../components/CrudPage.jsx";
import Badge from "../components/Badge.jsx";
import useOptions from "../hooks/useOptions.js";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

const PERSON_TYPE = [
  { value: "Staff", label: "Staff" },
  { value: "Doctor", label: "Doctor" },
];
const STATUS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "half-day", label: "Half Day" },
  { value: "leave", label: "Leave" },
];

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function toDateInput(d) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default function Attendance() {
  const staff = useOptions("staff", (s) => ({ value: s._id, label: s.name }));
  const doctors = useOptions("doctors", (d) => ({ value: d._id, label: d.name }));
  const branches = useOptions("branches", (b) => ({ value: b._id, label: b.name }));

  return (
    <CrudPage
      title="Attendance"
      subtitle="Track daily doctor and staff attendance."
      endpoint="attendance"
      singular="Attendance"
      statusOptions={STATUS}
      defaultValues={{ personType: "Staff", date: toDateInput(new Date()), status: "present" }}
      columns={[
        { key: "person", header: "Name", render: (r) => r.person?.name || "—" },
        { key: "personType", header: "Role", render: (r) => r.personType },
        { key: "date", header: "Date", render: (r) => fmtDate(r.date) },
        { key: "checkIn", header: "Check In", render: (r) => r.checkIn || "—" },
        { key: "checkOut", header: "Check Out", render: (r) => r.checkOut || "—" },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
      ]}
      fields={[]}
      renderForm={({ values, setValues }) => {
        const people = values.personType === "Doctor" ? doctors : staff;
        return (
          <div className="form-grid">
            <div className="field">
              <label>Role <span className="req">*</span></label>
              <select value={values.personType || "Staff"} onChange={(e) => setValues({ ...values, personType: e.target.value, person: "" })} required>
                {PERSON_TYPE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Name <span className="req">*</span></label>
              <select value={values.person || ""} onChange={(e) => setValues({ ...values, person: e.target.value })} required>
                <option value="">Select…</option>
                {people.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Branch</label>
              <select value={values.branch || ""} onChange={(e) => setValues({ ...values, branch: e.target.value })}>
                <option value="">Select…</option>
                {branches.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Date <span className="req">*</span></label>
              <input type="date" value={values.date || ""} onChange={(e) => setValues({ ...values, date: e.target.value })} required />
            </div>
            <div className="field">
              <label>Check In</label>
              <input value={values.checkIn || ""} onChange={(e) => setValues({ ...values, checkIn: e.target.value })} placeholder="e.g. 09:00 AM" />
            </div>
            <div className="field">
              <label>Check Out</label>
              <input value={values.checkOut || ""} onChange={(e) => setValues({ ...values, checkOut: e.target.value })} placeholder="e.g. 06:00 PM" />
            </div>
            <div className="field">
              <label>Status</label>
              <select value={values.status || "present"} onChange={(e) => setValues({ ...values, status: e.target.value })}>
                {STATUS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        );
      }}
      toForm={(r) => ({
        personType: r.personType,
        person: r.person?._id || "",
        branch: r.branch?._id || "",
        date: toDateInput(r.date),
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        status: r.status,
      })}
      toPayload={(v) => ({ ...v, branch: v.branch || null })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Name" value={r.person?.name} />
          <DetailItem label="Role" value={r.personType} />
          <DetailItem label="Branch" value={r.branch?.name} />
          <DetailItem label="Date" value={fmtDate(r.date)} />
          <DetailItem label="Check In" value={r.checkIn} />
          <DetailItem label="Check Out" value={r.checkOut} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
        </DetailGrid>
      )}
    />
  );
}
