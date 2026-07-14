import { useEffect, useMemo, useState } from "react";
import CrudPage from "../components/CrudPage.jsx";
import PageDashboard from "../components/PageDashboard.jsx";
import Badge from "../components/Badge.jsx";
import ClinicBranchField from "../components/ClinicBranchField.jsx";
import BusinessHoursEditor from "../components/BusinessHoursEditor.jsx";
import ProfilePictureField from "../components/ProfilePictureField.jsx";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";
import api, { apiError } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";

const TITLE_OPTIONS = ["Mast.", "Mr.", "Mrs.", "Ms.", "Dr."];
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
const STAFF_TYPE_PRESETS = ["Admin", "CSA", "Housekeeping", "Security"];
const STAFF_TYPE_OPTIONS = [...STAFF_TYPE_PRESETS, "Custom"];

const optionObjects = (items) => items.map((value) => ({ value, label: value }));

function staffTypeFromRole(role) {
  if (STAFF_TYPE_PRESETS.includes(role)) return { staffType: role, customStaffType: "" };
  if (role) return { staffType: "Custom", customStaffType: role };
  return { staffType: "Admin", customStaffType: "" };
}

function resolveStaffType(values) {
  if (values.staffType === "Custom") return String(values.customStaffType || "").trim();
  return values.staffType || "Admin";
}

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

function staffAddressFromRecord(r) {
  if (!r) return "";
  if (r.address1 && !r.address2 && !r.pincode && !r.location) return r.address1;
  return [r.address1, r.address2, r.location, r.pincode].filter(Boolean).join(", ");
}

function formatAvailability(availability) {
  if (!Array.isArray(availability) || availability.length === 0) return "-";
  const dayLabel = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };
  const grouped = availability.reduce((acc, s) => {
    if (!s?.day) return acc;
    acc[s.day] = acc[s.day] || [];
    acc[s.day].push(`${s.from || ""}-${s.to || ""}`.replace(/^-|-$/g, ""));
    return acc;
  }, {});
  const parts = Object.keys(dayLabel)
    .filter((d) => grouped[d]?.length)
    .map((d) => `${dayLabel[d]}: ${grouped[d].filter(Boolean).join(", ")}`);
  return parts.join(" | ") || "-";
}

export default function Staff() {
  const toast = useToast();
  const [dashKey, setDashKey] = useState(0);
  const [statusBusyId, setStatusBusyId] = useState(null);

  async function toggleStaffStatus(row, setRows) {
    const nextStatus = row.status === "active" ? "inactive" : "active";
    setStatusBusyId(row._id);
    try {
      await api.put(`/staff/${row._id}`, { status: nextStatus });
      setRows?.((prev) => prev.map((r) => (r._id === row._id ? { ...r, status: nextStatus } : r)));
      toast.success(`Staff marked ${nextStatus}`);
      setDashKey((k) => k + 1);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <CrudPage
      title="Staff"
      subtitle="Manage staff profiles and bank details."
      endpoint="staff"
      singular="Staff"
      wideForm
      hideDefaultFooter
      statusOptions={STATUS_OPTIONS}
      onChanged={() => setDashKey((k) => k + 1)}
      tableProps={{
        selectable: true,
        sortable: true,
        hideDelete: true,
        actionVariant: "teal",
      }}
      topContent={
        <PageDashboard
          resource="staff"
          refreshKey={dashKey}
          cards={[
            { key: "total", label: "Total Staff", icon: "🧑‍💼" },
            { key: "active", label: "Active", icon: "✅" },
            { key: "inactive", label: "Inactive", icon: "⏸️" },
          ]}
        />
      }
      defaultValues={{
        titlePrefix: "Mast.",
        lastNamePrefix: "D/o",
        altPhoneRelation: "Father",
        gender: "male",
        status: "active",
        staffType: "Admin",
        customStaffType: "",
      }}
      columns={({ setRows, page }) => [
        {
          key: "sno",
          header: "S.No",
          width: 72,
          sortable: false,
          render: (_r, rowIndex) => (page - 1) * 10 + rowIndex + 1,
        },
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
                <div className="cell-sub">{r.role || r.designation || staffAddressFromRecord(r) || "-"}</div>
              </div>
            </div>
          ),
        },
        { key: "role", header: "Staff Type", render: (r) => r.role || r.designation || "-" },
        { key: "phone", header: "Phone", render: (r) => r.phone || "-" },
        { key: "email", header: "Email", render: (r) => r.email || "-" },
        { key: "address", header: "Address", render: (r) => staffAddressFromRecord(r) || "-" },
        { key: "qualification", header: "Qualification", render: (r) => r.qualification || "-" },
        {
          key: "status",
          header: "Status",
          render: (r) => {
            const active = r.status === "active";
            return (
              <button
                type="button"
                className={`status-toggle ${active ? "is-active" : "is-inactive"}`}
                disabled={statusBusyId === r._id}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStaffStatus(r, setRows);
                }}
                title={active ? "Set inactive" : "Set active"}
              >
                <span className="status-toggle-label">{active ? "Active" : "Inactive"}</span>
                <span className="status-toggle-knob" />
              </button>
            );
          },
        },
      ]}
      fields={() => []}
      renderForm={({ values, setValues }) => <StaffForm values={values} setValues={setValues} />}
      toForm={(r) => {
        const typeFields = staffTypeFromRole(r.role || r.designation || "");
        return {
        titlePrefix: r.titlePrefix || "Mast.",
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
        address: staffAddressFromRecord(r),
        qualification: r.qualification || "",
        image: r.image || "",
        accountHolderName: r.accountHolderName || "",
        accountNumber: r.accountNumber || "",
        accountType: r.accountType || "",
        bankName: r.bankName || "",
        bankBranchName: r.bankBranchName || "",
        ifscCode: r.ifscCode || "",
        upiId: r.upiId || "",
        employeeId: r.employeeId || "",
        designation: r.designation || "",
        ...typeFields,
        role: r.role || "",
        joiningDate: dateInputValue(r.joiningDate),
        weeklySchedule: r.weeklySchedule || [],
        availability: r.availability || [],
        documents: r.documents || [],
        salary: r.salary ?? 0,
        branch: r.branch?._id || "",
        status: r.status || "active",
      };
      }}
      toPayload={(v) => {
        const staffType = resolveStaffType(v);
        return {
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
        location: "",
        address1: v.address || "",
        address2: "",
        pincode: "",
        qualification: v.qualification || "",
        image: v.image || "",
        accountHolderName: v.accountHolderName || "",
        accountNumber: v.accountNumber || "",
        accountType: v.accountType || "",
        bankName: v.bankName || "",
        bankBranchName: v.bankBranchName || "",
        ifscCode: v.ifscCode || "",
        upiId: v.upiId || "",
        employeeId: v.employeeId || "",
        designation: v.designation || staffType,
        role: staffType || "Admin",
        joiningDate: v.joiningDate || null,
        weeklySchedule: (v.weeklySchedule || []).map((day) => ({
          day: day.day,
          status: day.status === "available" ? "available" : "weeklyOff",
          slots: (day.slots || []).filter((s) => s?.from && s?.to).map((s) => ({ from: s.from, to: s.to })),
          breaks: [],
        })),
        availability: (v.availability || []).filter((s) => s?.day && s?.from && s?.to),
        documents: v.documents || [],
        salary: Number(v.salary) || 0,
        branch: v.branch || null,
        status: v.status || "active",
      };
      }}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Name" value={r.name} />
          <DetailItem label="Staff Type" value={r.role || r.designation || "-"} />
          <DetailItem label="Phone" value={r.phone} />
          <DetailItem label="Alternative Phone" value={r.alternativePhone} />
          <DetailItem label="Email" value={r.email} />
          <DetailItem label="Gender" value={r.gender} />
          <DetailItem label="Date of Birth" value={r.dob ? new Date(r.dob).toLocaleDateString("en-IN") : "-"} />
          <DetailItem label="Age" value={r.age} />
          <DetailItem label="Address" value={staffAddressFromRecord(r) || "-"} full />
          <DetailItem label="Qualification" value={r.qualification} />
          <DetailItem label="Account Holder Name" value={r.accountHolderName} />
          <DetailItem label="Account Number" value={r.accountNumber} />
          <DetailItem label="Account Type" value={r.accountType} />
          <DetailItem label="Bank Name" value={r.bankName} />
          <DetailItem label="Branch Name" value={r.bankBranchName} />
          <DetailItem label="IFSC Code" value={r.ifscCode} />
          <DetailItem label="Bank UPI ID" value={r.upiId || "-"} />
          <DetailItem label="Employee ID" value={r.employeeId} />
          <DetailItem label="Designation" value={r.designation || r.role} />
          <DetailItem label="Joining Date" value={r.joiningDate ? new Date(r.joiningDate).toLocaleDateString("en-IN") : "-"} />
          <DetailItem label="Shift / Availability" value={formatAvailability(r.availability)} full />
          <DetailItem label="Salary" value={r.salary ? `₹${r.salary}` : "-"} />
          <DetailItem label="Clinic Branch" value={r.branch?.name} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
          {(r.documents || []).length > 0 && (
            <DetailItem
              label="Documents"
              value={(r.documents || []).map((d, i) => <a key={i} href={d.url} target="_blank" rel="noreferrer" style={{ display: "block" }}>{d.name || `Doc ${i + 1}`}</a>)}
              full
            />
          )}
        </DetailGrid>
      )}
    />
  );
}

function StaffForm({ values, setValues }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(0); // 0 = Basic, 1 = HR
  const computedAge = useMemo(() => ageFromDob(values.dob), [values.dob]);

  useEffect(() => {
    if (!values.dob || computedAge === "") return;
    setValues((prev) => {
      if (!prev || prev.age === computedAge) return prev;
      return { ...prev, age: computedAge };
    });
  }, [computedAge, setValues, values.dob]);

  useEffect(() => {
    setStep(0);
  }, [values?.employeeId, values?.email, values?.phone]);

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
      setValues((prev) => ({ ...(prev || {}), image: data.url }));
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
    }
  }

  function clearImage() {
    setValues((prev) => ({ ...(prev || {}), image: "" }));
  }

  function vreq(label, ok) {
    if (ok) return true;
    toast.error(`${label} is required`);
    return false;
  }

  function validateStep(nextStep) {
    if (nextStep === 1) {
      return (
        vreq("Name", String(values.firstName || "").trim()) &&
        vreq("Phone", String(values.phone || "").trim()) &&
        vreq("Email", String(values.email || "").trim()) &&
        vreq("Gender", String(values.gender || "").trim()) &&
        vreq("Date of birth", String(values.dob || "").trim()) &&
        vreq("Address", String(values.address || "").trim()) &&
        vreq("Qualification", String(values.qualification || "").trim()) &&
        vreq("Clinic branch", String(values.branch || "").trim())
      );
    }

    const staffTypeOk =
      values.staffType === "Custom"
        ? vreq("Custom staff type", String(values.customStaffType || "").trim())
        : vreq("Staff type", String(values.staffType || "").trim());

    return (
      staffTypeOk &&
      vreq("Account holder name", String(values.accountHolderName || "").trim()) &&
      vreq("Account number", String(values.accountNumber || "").trim()) &&
      vreq("Account type", String(values.accountType || "").trim()) &&
      vreq("Bank name", String(values.bankName || "").trim()) &&
      vreq("Bank branch name", String(values.bankBranchName || "").trim()) &&
      vreq("IFSC code", String(values.ifscCode || "").trim())
    );
  }

  return (
    <div
      className="staff-form doctor-form"
      onKeyDown={(e) => {
        if (e.key === "Enter" && step === 0) e.preventDefault();
      }}
    >
      <div className="wizard-header">
        <div className="wizard-steps" role="tablist" aria-label="Staff form steps">
          <button
            type="button"
            className={`wizard-step ${step === 0 ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setStep(0);
            }}
          >
            <span className="n">1</span> Basic details
          </button>
          <button
            type="button"
            className={`wizard-step ${step === 1 ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              if (step === 0 && !validateStep(1)) return;
              setStep(1);
            }}
          >
            <span className="n">2</span> HR details
          </button>
        </div>
      </div>

      {step === 0 && (
        <>
        <FormSection title="Basic details" hint="Personal contact info, address, and branch assignment.">
          <div className="form-grid">
            <Field label="Name" req>
              <div className="input-pair select-first">
                <select value={values.titlePrefix || "Mast."} onChange={(e) => set("titlePrefix", e.target.value)}>
                  {optionObjects(TITLE_OPTIONS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input value={values.firstName || ""} onChange={(e) => set("firstName", e.target.value)} placeholder="Enter Name" />
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
              <input value={values.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="Enter Phone Number" />
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
              <input type="email" value={values.email || ""} onChange={(e) => set("email", e.target.value)} placeholder="Enter Email" />
            </Field>
            <Field label="Gender" req>
              <select value={values.gender || "male"} onChange={(e) => set("gender", e.target.value)}>
                {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </Field>
            <div className="form-grid compact-row">
              <Field label="Date of Birth" req>
                <input
                  type="date"
                  value={values.dob || ""}
                  onChange={(e) => {
                    const dob = e.target.value;
                    setValues({
                      ...values,
                      dob,
                      age: dob ? ageFromDob(dob) : values.age,
                    });
                  }}
                />
              </Field>
              <Field label="Age">
                <input
                  type="number"
                  min={0}
                  value={values.dob ? computedAge : (values.age ?? "")}
                  readOnly={!!values.dob}
                  disabled={!!values.dob}
                  onChange={(e) => set("age", e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder={values.dob ? "" : "Enter Age"}
                />
              </Field>
            </div>
            <Field label="Address" req>
              <input value={values.address || ""} onChange={(e) => set("address", e.target.value)} placeholder="Enter Address" />
            </Field>
            <Field label="Qualification" req>
              <input value={values.qualification || ""} onChange={(e) => set("qualification", e.target.value)} placeholder="Enter Qualification" />
            </Field>
            <ClinicBranchField
              label="Clinic Branch"
              value={values.branch || ""}
              onChange={(branchId) => set("branch", branchId)}
            />
            <Field label="Status">
              <select value={values.status || "active"} onChange={(e) => set("status", e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
        </FormSection>

          <FormSection title="Profile Picture" hint="Upload a clear square photo. JPG or PNG works best.">
            <ProfilePictureField
              url={values.image}
              uploading={uploading}
              alt="Staff profile"
              onPick={uploadImage}
              onClear={clearImage}
            />
          </FormSection>
        </>
      )}

      {step === 1 && (
        <div className="doctor-form-sections">
          <FormSection title="HR details" hint="Employee info, shift schedule, and salary.">
            <div className="form-grid">
              <Field label="Employee ID">
                <input value={values.employeeId || ""} readOnly placeholder="Auto-generated" />
              </Field>
              <Field label="Staff Type" req>
                <select
                  value={values.staffType || "Admin"}
                  onChange={(e) => {
                    const staffType = e.target.value;
                    setValues({
                      ...values,
                      staffType,
                      customStaffType: staffType === "Custom" ? (values.customStaffType || "") : "",
                    });
                  }}
                >
                  {STAFF_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </Field>
              {values.staffType === "Custom" && (
                <Field label="Custom Staff Type" req>
                  <input
                    value={values.customStaffType || ""}
                    onChange={(e) => set("customStaffType", e.target.value)}
                    placeholder="Enter staff type"
                  />
                </Field>
              )}
              <Field label="Designation">
                <input value={values.designation || ""} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. Receptionist" />
              </Field>
              <Field label="Joining Date">
                <input type="date" value={values.joiningDate || ""} onChange={(e) => set("joiningDate", e.target.value)} />
              </Field>
              <Field label="Salary (₹)">
                <input type="number" min={0} value={values.salary ?? 0} onChange={(e) => set("salary", Number(e.target.value))} />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Shift / Availability" hint="Set weekly working hours and days off.">
            <BusinessHoursEditor
              value={(values.weeklySchedule && values.weeklySchedule.length ? values.weeklySchedule : values.availability) || []}
              onChange={(next) => {
                setValues((prev) => ({
                  ...(prev || {}),
                  weeklySchedule: next?.weeklySchedule || [],
                  availability: next?.availability || [],
                }));
              }}
            />
          </FormSection>

          <FormSection title="Bank details" hint="Account information used for payouts.">
            <div className="form-grid">
              <Field label="Account Holder Name" req>
                <input value={values.accountHolderName || ""} onChange={(e) => set("accountHolderName", e.target.value)} placeholder="Enter Account Holder Name" />
              </Field>
              <Field label="Account Number" req>
                <input value={values.accountNumber || ""} onChange={(e) => set("accountNumber", e.target.value)} />
              </Field>
              <Field label="Account Type" req>
                <select value={values.accountType || ""} onChange={(e) => set("accountType", e.target.value)}>
                  <option value="">Select Account Type</option>
                  {optionObjects(ACCOUNT_TYPES).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Bank Name" req>
                <input value={values.bankName || ""} onChange={(e) => set("bankName", e.target.value)} placeholder="Enter Bank Name" />
              </Field>
              <Field label="Branch Name" req>
                <input value={values.bankBranchName || ""} onChange={(e) => set("bankBranchName", e.target.value)} placeholder="Enter Branch Name" />
              </Field>
              <Field label="IFSC Code" req>
                <input value={values.ifscCode || ""} onChange={(e) => set("ifscCode", e.target.value.toUpperCase())} placeholder="Enter IFSC Code" />
              </Field>
              <Field label="Bank UPI ID">
                <input value={values.upiId || ""} onChange={(e) => set("upiId", e.target.value)} placeholder="e.g. name@bank" />
              </Field>
            </div>
          </FormSection>
        </div>
      )}

      <div className={`wizard-nav ${step === 0 ? "end" : ""}`}>
        {step === 0 ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={(e) => {
              e.preventDefault();
              if (!validateStep(1)) return;
              setStep(1);
            }}
          >
            Next
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>
              Back
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={(e) => {
                if (!validateStep(2)) e.preventDefault();
              }}
            >
              Save Staff
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function FormSection({ title, hint, children }) {
  return (
    <div className="doctor-form-panel">
      <div className="doctor-form-panel-copy">
        <div className="doctor-form-panel-title">{title}</div>
        {hint ? <p className="doctor-form-panel-hint">{hint}</p> : null}
      </div>
      <div className="doctor-form-panel-body">{children}</div>
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
