import { useEffect, useMemo, useState } from "react";
import CrudPage from "../components/CrudPage.jsx";
import Badge from "../components/Badge.jsx";
import useOptions from "../hooks/useOptions.js";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";
import api, { apiError } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

const TITLE_OPTIONS = ["Baby.", "Dr.", "Mr.", "Mrs.", "Ms."];
const RELATION_OPTIONS = ["D/o", "S/o", "W/o", "C/o"];
const ALT_RELATION_OPTIONS = ["Father", "Mother", "Spouse", "Guardian", "Other"];
const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];
const ACCOUNT_TYPES = ["Savings", "Current", "Salary", "NRI"];
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const optionObjects = (items) => items.map((value) => ({ value, label: value }));

function dateInputValue(value) {
  return value ? String(value).slice(0, 10) : "";
}

function ageFromDob(dob) {
  if (!dob) return "";
  const [year, month, day] = String(dob).slice(0, 10).split("-").map(Number);
  const birth = new Date(year, month - 1, day);
  if (Number.isNaN(birth.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : "";
}

function buildStaffName(values) {
  return [values.titlePrefix, values.firstName, values.lastName].filter(Boolean).join(" ").trim();
}

export default function Staff() {
  const branches = useOptions("branches", (b) => ({ value: b._id, label: b.name }));

  return (
    <CrudPage
      title="Staff"
      subtitle="Manage staff profiles and bank details."
      endpoint="staff"
      singular="Staff"
      wideForm
      statusOptions={STATUS_OPTIONS}
      defaultValues={{
        titlePrefix: "Dr.",
        lastNamePrefix: "D/o",
        altPhoneRelation: "Father",
        gender: "male",
        status: "active",
      }}
      columns={[
        {
          key: "name",
          header: "Staff",
          render: (r) => (
            <div className="cell-avatar">
              {r.image ? (
                <img className="av av-img" src={r.image} alt={r.name} />
              ) : (
                <div className="av">{(r.name || "").split(" ").map((p) => p[0]).slice(0, 2).join("")}</div>
              )}
              <div>
                <div className="cell-main">{r.name}</div>
                <div className="cell-sub">{r.qualification || r.location || "-"}</div>
              </div>
            </div>
          ),
        },
        { key: "phone", header: "Phone", render: (r) => r.phone || "-" },
        { key: "email", header: "Email", render: (r) => r.email || "-" },
        { key: "location", header: "Location", render: (r) => r.location || "-" },
        { key: "qualification", header: "Qualification", render: (r) => r.qualification || "-" },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
      ]}
      fields={() => []}
      renderForm={({ values, setValues }) => <StaffForm values={values} setValues={setValues} branches={branches} />}
      toForm={(r) => ({
        titlePrefix: r.titlePrefix || "Dr.",
        firstName: r.firstName || r.name || "",
        lastNamePrefix: r.lastNamePrefix || "D/o",
        lastName: r.lastName || "",
        phone: r.phone || "",
        altPhoneRelation: r.altPhoneRelation || "Father",
        alternativePhone: r.alternativePhone || "",
        email: r.email || "",
        gender: r.gender || "male",
        dob: dateInputValue(r.dob),
        age: r.age ?? "",
        location: r.location || "",
        address1: r.address1 || "",
        address2: r.address2 || "",
        pincode: r.pincode || "",
        qualification: r.qualification || "",
        image: r.image || "",
        accountHolderName: r.accountHolderName || "",
        accountNumber: r.accountNumber || "",
        accountType: r.accountType || "",
        bankName: r.bankName || "",
        bankBranchName: r.bankBranchName || "",
        ifscCode: r.ifscCode || "",
        branch: r.branch?._id || "",
        status: r.status || "active",
      })}
      toPayload={(v) => ({
        name: buildStaffName(v),
        titlePrefix: v.titlePrefix || "",
        firstName: v.firstName || "",
        lastNamePrefix: v.lastNamePrefix || "",
        lastName: v.lastName || "",
        phone: v.phone || "",
        altPhoneRelation: v.altPhoneRelation || "",
        alternativePhone: v.alternativePhone || "",
        email: v.email || "",
        gender: v.gender || "",
        dob: v.dob || null,
        age: v.age === "" ? 0 : v.age,
        location: v.location || "",
        address1: v.address1 || "",
        address2: v.address2 || "",
        pincode: v.pincode || "",
        qualification: v.qualification || "",
        image: v.image || "",
        accountHolderName: v.accountHolderName || "",
        accountNumber: v.accountNumber || "",
        accountType: v.accountType || "",
        bankName: v.bankName || "",
        bankBranchName: v.bankBranchName || "",
        ifscCode: v.ifscCode || "",
        branch: v.branch || null,
        status: v.status || "active",
      })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Name" value={r.name} />
          <DetailItem label="Phone" value={r.phone} />
          <DetailItem label="Alternative Phone" value={r.alternativePhone} />
          <DetailItem label="Email" value={r.email} />
          <DetailItem label="Gender" value={r.gender} />
          <DetailItem label="Date of Birth" value={r.dob ? new Date(r.dob).toLocaleDateString("en-IN") : "-"} />
          <DetailItem label="Age" value={r.age} />
          <DetailItem label="Location" value={r.location} />
          <DetailItem label="Address1" value={r.address1} />
          <DetailItem label="Address2" value={r.address2} />
          <DetailItem label="Pincode" value={r.pincode} />
          <DetailItem label="Qualification" value={r.qualification} />
          <DetailItem label="Account Holder Name" value={r.accountHolderName} />
          <DetailItem label="Account Number" value={r.accountNumber} />
          <DetailItem label="Account Type" value={r.accountType} />
          <DetailItem label="Bank Name" value={r.bankName} />
          <DetailItem label="Branch Name" value={r.bankBranchName} />
          <DetailItem label="IFSC Code" value={r.ifscCode} />
          <DetailItem label="Clinic Branch" value={r.branch?.name} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
          {r.image && <DetailItem label="Image" value={<a href={r.image} target="_blank" rel="noreferrer">View image</a>} />}
        </DetailGrid>
      )}
    />
  );
}

function StaffForm({ values, setValues, branches }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const computedAge = useMemo(() => ageFromDob(values.dob), [values.dob]);

  useEffect(() => {
    if (!values.dob || computedAge === "" || values.age === computedAge) return;
    setValues({ ...values, age: computedAge });
  }, [computedAge, setValues, values]);

  function set(name, value) {
    setValues({ ...values, [name]: value });
  }

  async function uploadImage(file) {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post("/uploads", form, { headers: { "Content-Type": "multipart/form-data" } });
      set("image", data.url);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="staff-form doctor-form">
      <div className="form-grid">
        <Field label="Name" req>
          <div className="input-pair select-first">
            <select value={values.titlePrefix || "Dr."} onChange={(e) => set("titlePrefix", e.target.value)}>
              {optionObjects(TITLE_OPTIONS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input value={values.firstName || ""} onChange={(e) => set("firstName", e.target.value)} placeholder="Enter Name" required />
          </div>
        </Field>
        <Field label="Last Name">
          <div className="input-pair select-first">
            <select value={values.lastNamePrefix || "D/o"} onChange={(e) => set("lastNamePrefix", e.target.value)}>
              {optionObjects(RELATION_OPTIONS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input value={values.lastName || ""} onChange={(e) => set("lastName", e.target.value)} placeholder="Enter Last Name" />
          </div>
        </Field>
        <Field label="Phone" req>
          <input value={values.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="Enter Phone Number" required />
        </Field>
        <Field label="Alternative Phone Number">
          <div className="input-pair select-first">
            <select value={values.altPhoneRelation || "Father"} onChange={(e) => set("altPhoneRelation", e.target.value)}>
              {optionObjects(ALT_RELATION_OPTIONS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input value={values.alternativePhone || ""} onChange={(e) => set("alternativePhone", e.target.value)} placeholder="Enter Alternative Phone" />
          </div>
        </Field>
        <Field label="Email" req>
          <input type="email" value={values.email || ""} onChange={(e) => set("email", e.target.value)} placeholder="Enter Email" required />
        </Field>
        <Field label="Gender" req>
          <select value={values.gender || "male"} onChange={(e) => set("gender", e.target.value)} required>
            {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </Field>
        <div className="form-grid compact-row">
          <Field label="Date of Birth" req>
            <input type="date" value={values.dob || ""} onChange={(e) => set("dob", e.target.value)} required />
          </Field>
          <Field label="Age">
            <input
              type="number"
              min={0}
              value={values.age ?? ""}
              onChange={(e) => set("age", e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Enter Age"
            />
          </Field>
        </div>
        <Field label="Location" req>
          <input value={values.location || ""} onChange={(e) => set("location", e.target.value)} placeholder="Enter Location" required />
        </Field>
        <Field label="Address1" req>
          <input value={values.address1 || ""} onChange={(e) => set("address1", e.target.value)} placeholder="Enter Address Line 1" required />
        </Field>
        <Field label="Address2">
          <input value={values.address2 || ""} onChange={(e) => set("address2", e.target.value)} placeholder="Enter Address Line 2" />
        </Field>
        <Field label="Pincode" req>
          <input value={values.pincode || ""} onChange={(e) => set("pincode", e.target.value)} placeholder="Pincode" required />
        </Field>
        <Field label="Qualification" req>
          <input value={values.qualification || ""} onChange={(e) => set("qualification", e.target.value)} placeholder="Enter Qualification" required />
        </Field>
      </div>

      <div className="doctor-image-row staff-image-row">
        <div className="field">
          <label>Image</label>
          <label className="doctor-browse">
            {uploading ? "Uploading..." : "Browse"}
            <input type="file" accept="image/*" hidden onChange={(e) => uploadImage(e.target.files?.[0])} />
          </label>
        </div>
        <div className="doctor-avatar-preview staff-avatar-preview">
          {values.image ? <img src={values.image} alt="Staff" /> : <span />}
        </div>
        {values.image && (
          <button type="button" className="staff-image-remove" onClick={() => set("image", "")} aria-label="Remove image">
            Delete
          </button>
        )}
      </div>

      <h4 className="staff-form-section">Bank Details</h4>
      <div className="form-grid">
        <Field label="Account Holder Name" req>
          <input value={values.accountHolderName || ""} onChange={(e) => set("accountHolderName", e.target.value)} placeholder="Enter Account Holder Name" required />
        </Field>
        <Field label="Account Number" req>
          <input value={values.accountNumber || ""} onChange={(e) => set("accountNumber", e.target.value)} required />
        </Field>
        <Field label="Account Type" req>
          <select value={values.accountType || ""} onChange={(e) => set("accountType", e.target.value)} required>
            <option value="">Select Account Type</option>
            {optionObjects(ACCOUNT_TYPES).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Bank Name" req>
          <input value={values.bankName || ""} onChange={(e) => set("bankName", e.target.value)} placeholder="Enter Bank Name" required />
        </Field>
        <Field label="Branch Name" req>
          <input value={values.bankBranchName || ""} onChange={(e) => set("bankBranchName", e.target.value)} placeholder="Enter Branch Name" required />
        </Field>
        <Field label="IFSC Code" req>
          <input value={values.ifscCode || ""} onChange={(e) => set("ifscCode", e.target.value.toUpperCase())} placeholder="Enter IFSC Code" required />
        </Field>
        <Field label="Clinic Branch">
          <select value={values.branch || ""} onChange={(e) => set("branch", e.target.value)}>
            <option value="">Select Branch</option>
            {branches.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={values.status || "active"} onChange={(e) => set("status", e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, req, children }) {
  return (
    <div className="field">
      <label>{label} {req && <span className="req">*</span>}</label>
      {children}
    </div>
  );
}
