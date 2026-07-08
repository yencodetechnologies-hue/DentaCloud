import { useState } from "react";
import CrudPage from "../components/CrudPage.jsx";
import PageDashboard from "../components/PageDashboard.jsx";
import Badge from "../components/Badge.jsx";
import ClinicBranchField from "../components/ClinicBranchField.jsx";
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
function nowTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function captureLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

export default function Attendance() {
  const staff = useOptions("staff", (s) => ({ value: s._id, label: s.name }));
  const doctors = useOptions("doctors", (d) => ({ value: d._id, label: d.name }));

  return (
    <CrudPage
      title="Attendance"
      subtitle="Track daily doctor and staff attendance with GPS check-in/out."
      endpoint="attendance"
      singular="Attendance"
      statusOptions={STATUS}
      defaultValues={{ personType: "Staff", date: toDateInput(new Date()), status: "present" }}
      topContent={
        <PageDashboard
          resource="attendance"
          cards={[
            { key: "present", label: "Present Today", icon: "✅" },
            { key: "absent", label: "Absent Today", icon: "❌" },
            { key: "total", label: "Records Today", icon: "🕒" },
          ]}
        />
      }
      columns={[
        { key: "person", header: "Name", render: (r) => r.person?.name || "—" },
        { key: "personType", header: "Role", render: (r) => r.personType },
        { key: "date", header: "Date", render: (r) => fmtDate(r.date) },
        { key: "checkIn", header: "Check In", render: (r) => r.checkIn || "—" },
        { key: "checkOut", header: "Check Out", render: (r) => r.checkOut || "—" },
        { key: "hours", header: "Hours", render: (r) => r.hours || "—" },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
      ]}
      fields={[]}
      renderForm={({ values, setValues }) => {
        const people = values.personType === "Doctor" ? doctors : staff;
        async function checkIn() {
          const loc = await captureLocation();
          setValues({ ...values, checkIn: nowTime(), checkInLoc: loc, status: "present" });
        }
        async function checkOut() {
          const loc = await captureLocation();
          setValues({ ...values, checkOut: nowTime(), checkOutLoc: loc });
        }
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
            <ClinicBranchField
              value={values.branch || ""}
              onChange={(branchId) => setValues({ ...values, branch: branchId })}
            />
            <div className="field">
              <label>Date <span className="req">*</span></label>
              <input type="date" value={values.date || ""} onChange={(e) => setValues({ ...values, date: e.target.value })} required />
            </div>
            <div className="field">
              <label>Check In</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={values.checkIn || ""} onChange={(e) => setValues({ ...values, checkIn: e.target.value })} placeholder="e.g. 09:00 AM" style={{ flex: 1 }} />
                <button type="button" className="btn btn-sm" onClick={checkIn}>📍 Now</button>
              </div>
              {values.checkInLoc && <span className="hint">GPS: {values.checkInLoc.lat?.toFixed(5)}, {values.checkInLoc.lng?.toFixed(5)}</span>}
            </div>
            <div className="field">
              <label>Check Out</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={values.checkOut || ""} onChange={(e) => setValues({ ...values, checkOut: e.target.value })} placeholder="e.g. 06:00 PM" style={{ flex: 1 }} />
                <button type="button" className="btn btn-sm" onClick={checkOut}>📍 Now</button>
              </div>
              {values.checkOutLoc && <span className="hint">GPS: {values.checkOutLoc.lat?.toFixed(5)}, {values.checkOutLoc.lng?.toFixed(5)}</span>}
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
        checkInLoc: r.checkInLoc,
        checkOutLoc: r.checkOutLoc,
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
          <DetailItem label="Hours" value={r.hours} />
          <DetailItem label="Check-in GPS" value={r.checkInLoc ? `${r.checkInLoc.lat}, ${r.checkInLoc.lng}` : "—"} />
          <DetailItem label="Check-out GPS" value={r.checkOutLoc ? `${r.checkOutLoc.lat}, ${r.checkOutLoc.lng}` : "—"} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
        </DetailGrid>
      )}
    />
  );
}
