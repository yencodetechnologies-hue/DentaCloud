import { useEffect, useMemo, useState } from "react";
import api, { apiError } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import ClinicBranchField from "./ClinicBranchField.jsx";

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const CONDITIONS = [
  { name: "diabetes", label: "Diabetes" },
  { name: "bloodPressure", label: "Blood Pressure" },
  { name: "heartDisease", label: "Heart Disease" },
  { name: "asthma", label: "Asthma" },
  { name: "epilepsy", label: "Epilepsy" },
  { name: "thyroid", label: "Thyroid" },
  { name: "pregnancy", label: "Pregnancy" },
];

const REASONS = [
  { value: "toothPain", label: "Tooth pain" },
  { value: "cleaning", label: "Cleaning" },
  { value: "checkup", label: "Check-up" },
  { value: "cosmetic", label: "Cosmetic treatment" },
  { value: "emergency", label: "Emergency" },
];

function getPath(obj, path) {
  return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

function ageFromDob(dob) {
  if (!dob) return "";
  const [y, m, day] = String(dob).slice(0, 10).split("-").map((n) => Number(n));
  if (!y || !m || !day) return "";
  const birth = new Date(y, m - 1, day);
  if (Number.isNaN(birth.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const md = today.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : "";
}

export default function PatientForm({ values, setValues, editing }) {
  const toast = useToast();
  const [showMore, setShowMore] = useState(!!editing);
  const [uploading, setUploading] = useState("");
  const dobAge = useMemo(() => ageFromDob(values?.dob), [values?.dob]);

  useEffect(() => {
    if (!values?.dob) return;
    if (dobAge === "") return;
    if (values.age !== dobAge) setValues({ ...values, age: dobAge });
  }, [values, dobAge, setValues]);

  function set(path, value) {
    if (!path.includes(".")) {
      setValues({ ...values, [path]: value });
      return;
    }
    const [head, child] = path.split(".");
    setValues({ ...values, [head]: { ...(values[head] || {}), [child]: value } });
  }

  function val(path) {
    const v = getPath(values, path);
    return v == null ? "" : v;
  }

  async function uploadFile(path, file, { multiple = false } = {}) {
    if (!file) return;
    setUploading(path);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/uploads", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (multiple) {
        const arr = Array.isArray(values[path]) ? values[path] : [];
        setValues({ ...values, [path]: [...arr, data.url] });
      } else {
        set(path, data.url);
      }
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading("");
    }
  }

  return (
    <div className="patient-form">
      <h4 className="form-section-title">Patient details</h4>
      <div className="form-grid">
        <Field label="Full Name" req>
          <input value={val("name")} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Priya Sharma" required />
        </Field>
        <Field label="Gender" req>
          <select value={val("gender")} onChange={(e) => set("gender", e.target.value)} required>
            {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </Field>
        <Field label="Date of Birth" req>
          <input
            type="date"
            value={val("dob") ? String(val("dob")).slice(0, 10) : ""}
            onChange={(e) => {
              const dob = e.target.value;
              setValues({
                ...values,
                dob,
                age: dob ? ageFromDob(dob) : values.age,
              });
            }}
            required={!val("age")}
          />
        </Field>
        <Field label="Age">
          <input
            type="number"
            min={0}
            value={val("dob") ? dobAge : val("age")}
            disabled={!!val("dob")}
            readOnly={!!val("dob")}
            onChange={(e) => set("age", e.target.value === "" ? "" : Number(e.target.value))}
            required={!val("dob")}
          />
        </Field>
        <Field label="Mobile Number" req>
          <input value={val("phone")} onChange={(e) => set("phone", e.target.value)} placeholder="10-digit mobile" required />
        </Field>
        <ClinicBranchField
          value={val("branch")}
          onChange={(branchId) => set("branch", branchId)}
        />
        <Field label="Reason for visit">
          <select value={val("reasonForVisit")} onChange={(e) => set("reasonForVisit", e.target.value)}>
            <option value="">Select…</option>
            {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </Field>
        {editing && (
          <Field label="Status">
            <select value={val("status")} onChange={(e) => set("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        )}
        <Field label="Patient ID" hint="Auto-generated" full>
          <input value={editing ? val("patientId") : "Auto-generated on save"} disabled readOnly />
        </Field>
      </div>

      <PhotoUpload
        url={val("photo")}
        uploading={uploading === "photo"}
        onPick={(f) => uploadFile("photo", f)}
        onClear={() => set("photo", "")}
      />

      <button
        type="button"
        className="btn btn-ghost sm form-more-toggle"
        onClick={() => setShowMore((v) => !v)}
      >
        {showMore ? "Hide additional details" : "＋ Add more details (optional)"}
      </button>

      {showMore && (
        <div className="form-more fade-up">
          <h4 className="form-section-title">Contact</h4>
          <div className="form-grid">
            <Field label="Alternate Number">
              <input value={val("altPhone")} onChange={(e) => set("altPhone", e.target.value)} />
            </Field>
            <Field label="Email">
              <input type="email" value={val("email")} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Blood Group">
              <input value={val("bloodGroup")} onChange={(e) => set("bloodGroup", e.target.value)} placeholder="e.g. O+" />
            </Field>
            <Field label="Referred By" hint="Friend / doctor / social media">
              <input value={val("referredBy")} onChange={(e) => set("referredBy", e.target.value)} />
            </Field>
            <Field label="Address" full>
              <textarea
                value={val("address.street")}
                onChange={(e) => set("address.street", e.target.value)}
                placeholder="House/Flat, Street, Area, City, Pincode"
              />
            </Field>
          </div>

          <h4 className="form-section-title">Medical history</h4>
          <div className="chip-label">Existing conditions</div>
          <div className="chip-grid">
            {CONDITIONS.map((c) => {
              const on = !!getPath(values, `medical.${c.name}`);
              return (
                <button
                  type="button"
                  key={c.name}
                  className={`chip ${on ? "on" : ""}`}
                  onClick={() => set(`medical.${c.name}`, !on)}
                >
                  <span className="tick">{on ? "✓" : "+"}</span> {c.label}
                </button>
              );
            })}
          </div>
          <div className="form-grid" style={{ marginTop: 18 }}>
            <Field label="Allergies" full hint="Medicine / food / latex">
              <textarea value={val("allergies")} onChange={(e) => set("allergies", e.target.value)} />
            </Field>
            <Field label="Current Medications" full>
              <textarea value={val("currentMedications")} onChange={(e) => set("currentMedications", e.target.value)} />
            </Field>
          </div>

          <h4 className="form-section-title">Dental history</h4>
          <div className="form-grid">
            <YesNo label="Previous dental treatment" value={!!values.previousTreatment} onChange={(v) => set("previousTreatment", v)} />
            <Field label="Last dental visit">
              <input type="date" value={val("lastVisitDate") ? String(val("lastVisitDate")).slice(0, 10) : ""} onChange={(e) => set("lastVisitDate", e.target.value)} />
            </Field>
            <YesNo label="Gum bleeding issues" value={!!values.gumBleeding} onChange={(v) => set("gumBleeding", v)} />
            <Field label="Tooth pain history" full>
              <textarea value={val("toothPainHistory")} onChange={(e) => set("toothPainHistory", e.target.value)} />
            </Field>
            <Field label="Ongoing dental problem" full>
              <textarea value={val("ongoingProblem")} onChange={(e) => set("ongoingProblem", e.target.value)} />
            </Field>
          </div>

          <h4 className="form-section-title">Attachments</h4>
          <div className="form-grid">
            <FileDrop label="ID Proof" url={val("idProof")} uploading={uploading === "idProof"} onPick={(f) => uploadFile("idProof", f)} onClear={() => set("idProof", "")} />
            <FileDrop label="X-ray" url={val("xray")} uploading={uploading === "xray"} onPick={(f) => uploadFile("xray", f)} onClear={() => set("xray", "")} />
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="chip-label">Previous prescriptions</div>
            <div className="file-list">
              {(values.prescriptions || []).map((url, i) => (
                <div className="file-pill" key={url}>
                  <a href={url} target="_blank" rel="noreferrer">{url.split("/").pop()}</a>
                  <button type="button" onClick={() => set("prescriptions", values.prescriptions.filter((_, k) => k !== i))}>✕</button>
                </div>
              ))}
            </div>
            <label className="upload-btn">
              {uploading === "prescriptions" ? "Uploading…" : "＋ Add prescription"}
              <input type="file" accept="image/*,application/pdf" hidden onChange={(e) => uploadFile("prescriptions", e.target.files?.[0], { multiple: true })} />
            </label>
          </div>

          <h4 className="form-section-title">Notes</h4>
          <div className="form-grid">
            <Field label="Comments" full>
              <textarea value={val("comments")} onChange={(e) => set("comments", e.target.value)} />
            </Field>
            <Field label="Doctor instructions" full>
              <textarea value={val("doctorInstructions")} onChange={(e) => set("doctorInstructions", e.target.value)} />
            </Field>
            <Field label="Special notes" full>
              <textarea value={val("specialNotes")} onChange={(e) => set("specialNotes", e.target.value)} />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, req, hint, full, children }) {
  return (
    <div className={`field ${full ? "full" : ""}`}>
      <label>{label} {req && <span className="req">*</span>} {hint && <span className="hint">{hint}</span>}</label>
      {children}
    </div>
  );
}

function YesNo({ label, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="yesno">
        <button type="button" className={value ? "on" : ""} onClick={() => onChange(true)}>Yes</button>
        <button type="button" className={!value ? "on" : ""} onClick={() => onChange(false)}>No</button>
      </div>
    </div>
  );
}

function PhotoUpload({ url, uploading, onPick, onClear }) {
  return (
    <div className="photo-upload">
      <div className="photo-frame">
        {url ? <img src={url} alt="Patient" /> : <span>👤</span>}
      </div>
      <div className="photo-actions">
        <div className="field-label">Patient Photo <span className="hint">optional</span></div>
        <div className="row">
          <label className="upload-btn">
            {uploading ? "Uploading…" : url ? "Change photo" : "Upload photo"}
            <input type="file" accept="image/*" hidden onChange={(e) => onPick(e.target.files?.[0])} />
          </label>
          {url && <button type="button" className="btn btn-ghost sm" onClick={onClear}>Remove</button>}
        </div>
      </div>
    </div>
  );
}

function FileDrop({ label, url, uploading, onPick, onClear }) {
  return (
    <div className="field">
      <label>{label} <span className="hint">optional</span></label>
      {url ? (
        <div className="file-pill solo">
          <a href={url} target="_blank" rel="noreferrer">{url.split("/").pop()}</a>
          <button type="button" onClick={onClear}>✕</button>
        </div>
      ) : (
        <label className="dropzone">
          <span>{uploading ? "Uploading…" : "📎 Click to upload (image / PDF)"}</span>
          <input type="file" accept="image/*,application/pdf" hidden onChange={(e) => onPick(e.target.files?.[0])} />
        </label>
      )}
    </div>
  );
}
