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

const TITLE_OPTIONS = ["Dr."];
const RELATION_OPTIONS = ["D/o", "F/o", "H/o", "M/o", "S/o", "W/o"];
const ALT_RELATION_OPTIONS = ["Father", "Daughter", "Mother", "Son", "Sister", "Spouse"];
const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "on-leave", label: "On Leave" },
  { value: "inactive", label: "Inactive" },
];
const ACCOUNT_TYPES = ["Savings", "Current", "Salary", "NRI"];

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

function buildDoctorName(values) {
  return [values.titlePrefix, values.firstName, values.lastName].filter(Boolean).join(" ").trim();
}

function doctorAddressFromRecord(r) {
  if (!r) return "";
  if (r.address1 && !r.address2 && !r.pincode && !r.location) return r.address1;
  return [r.address1, r.address2, r.location, r.pincode].filter(Boolean).join(", ");
}

const optionObjects = (items) => items.map((value) => ({ value, label: value }));

function yearFromMaybe(value) {
  const s = String(value || "").trim();
  if (!s) return null;
  const n = Number(s);
  if (Number.isFinite(n) && n >= 1900 && n <= 2100) return n;
  const m = s.match(/(19\d{2}|20\d{2}|2100)/);
  return m ? Number(m[1]) : null;
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

export default function Doctors() {
  const [dashKey, setDashKey] = useState(0);
  const toast = useToast();
  const [statusBusyId, setStatusBusyId] = useState(null);

  async function toggleDoctorStatus(row, setRows) {
    const nextStatus = row.status === "active" ? "inactive" : "active";
    setStatusBusyId(row._id);
    try {
      await api.put(`/doctors/${row._id}`, { status: nextStatus });
      setRows?.((prev) => prev.map((r) => (r._id === row._id ? { ...r, status: nextStatus } : r)));
      toast.success(`Doctor marked ${nextStatus}`);
      setDashKey((k) => k + 1);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setStatusBusyId(null);
    }
  }

  function formatGender(g) {
    if (!g) return "-";
    return g.charAt(0).toUpperCase() + g.slice(1);
  }

  function formatAltNumber(r) {
    if (!r.alternativePhone) return "";
    if (r.altPhoneRelation) return `${r.altPhoneRelation} ( ${r.alternativePhone} )`;
    return r.alternativePhone;
  }

  return (
    <CrudPage
      title="Doctors"
      subtitle="Manage doctors and their branch assignments."
      endpoint="doctors"
      singular="Doctor"
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
          resource="doctors"
          refreshKey={dashKey}
          cards={[
            { key: "total", label: "Total Doctors", icon: "👨‍⚕️" },
            { key: "active", label: "Active", icon: "✅" },
            { key: "onLeave", label: "On Leave", icon: "🏖️" },
          ]}
        />
      }
      defaultValues={{
        titlePrefix: "Dr.",
        lastNamePrefix: "D/o",
        altPhoneRelation: "Father",
        gender: "male",
        status: "active",
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
          header: "Name",
          render: (r) => (
            <span className="cell-main">
              {r.name || "-"}
              {r.phone ? ` ( ${r.phone} )` : ""}
            </span>
          ),
        },
        {
          key: "email",
          header: "Email",
          render: (r) => r.email || "-",
        },
        {
          key: "gender",
          header: "Gender",
          render: (r) => formatGender(r.gender),
        },
        {
          key: "alternativePhone",
          header: "Alternative Number",
          render: (r) => formatAltNumber(r) || "",
        },
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
                  toggleDoctorStatus(r, setRows);
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
      renderForm={({ values, setValues }) => (
        <DoctorWizardForm values={values} setValues={setValues} />
      )}
      toForm={(r) => {
        const dob = dateInputValue(r.dob);
        const bdsYear = r?.degrees?.bdsYear ?? yearFromMaybe(r?.degrees?.bds);
        const mdsYear = r?.degrees?.mdsYear ?? yearFromMaybe(r?.degrees?.mds);
        return {
          titlePrefix: r.titlePrefix || "Dr.",
          firstName: r.firstName || r.name || "",
          lastNamePrefix: r.lastNamePrefix || "D/o",
          lastName: r.lastName || "",
          phone: r.phone || "",
          altPhoneRelation: r.altPhoneRelation || "Father",
          alternativePhone: r.alternativePhone || "",
          landline: r.landline || "",
          email: r.email || "",
          gender: r.gender || "male",
          dob,
          age: dob ? ageFromDob(dob) : (r.age ?? ""),
          address: doctorAddressFromRecord(r),
          branch: r.branch?._id || "",
          status: r.status || "active",
          image: r.image || "",

          upid: r.upid || "",
          qualification: r.qualification || "",
          degrees: {
            ...(r.degrees || {}),
            bdsYear: bdsYear ?? null,
            mdsYear: mdsYear ?? null,
          },
          dciRegNo: r.dciRegNo || "",
          specialization: r.specialization || "",
          feeStructure: r.feeStructure || [],
          weeklySchedule: r.weeklySchedule || [],
          availability: r.availability || [],

          accountHolderName: r.accountHolderName || "",
          accountNumber: r.accountNumber || "",
          accountType: r.accountType || "",
          bankName: r.bankName || "",
          bankBranchName: r.bankBranchName || "",
          ifscCode: r.ifscCode || "",
          upiId: r.upiId || "",
        };
      }}
      toPayload={(v) => ({
        name: buildDoctorName(v),
        titlePrefix: v.titlePrefix || "",
        firstName: v.firstName || "",
        lastNamePrefix: v.lastNamePrefix || "",
        lastName: v.lastName || "",
        phone: v.phone || "",
        altPhoneRelation: v.altPhoneRelation || "",
        alternativePhone: v.alternativePhone || "",
        landline: v.landline || "",
        email: v.email || "",
        gender: v.gender || "",
        dob: v.dob || null,
        age: v.dob ? (ageFromDob(v.dob) || 0) : (v.age === "" ? 0 : Number(v.age)),
        location: "",
        address1: v.address || "",
        address2: "",
        pincode: "",
        branch: v.branch || null,
        status: v.status || "active",
        image: v.image || "",
        qualification: v.qualification || "",
        degrees: v.degrees || {},
        dciRegNo: v.dciRegNo || "",
        specialization: v.specialization || "",
        weeklySchedule: (v.weeklySchedule || []).map((day) => ({
          day: day.day,
          status: day.status === "available" ? "available" : "weeklyOff",
          slots: (day.slots || []).filter((s) => s?.from && s?.to).map((s) => ({ from: s.from, to: s.to })),
          breaks: [],
        })),
        availability: (v.availability || []).filter((s) => s?.day && s?.from && s?.to),
        feeStructure: v.feeStructure || [],

        accountHolderName: v.accountHolderName || "",
        accountNumber: v.accountNumber || "",
        accountType: v.accountType || "",
        bankName: v.bankName || "",
        bankBranchName: v.bankBranchName || "",
        ifscCode: v.ifscCode || "",
        upiId: v.upiId || "",
      })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Name" value={r.name} />
          <DetailItem label="Last Name Prefix" value={r.lastNamePrefix} />
          <DetailItem label="Last Name" value={r.lastName} />
          <DetailItem label="Phone Number" value={r.phone} />
          <DetailItem label="Alternative Phone" value={r.alternativePhone} />
          <DetailItem label="Alternative Relation" value={r.altPhoneRelation} />
          <DetailItem label="Land Line Number" value={r.landline} />
          <DetailItem label="Email" value={r.email} />
          <DetailItem label="Gender" value={r.gender} />
          <DetailItem label="Date of Birth" value={r.dob ? new Date(r.dob).toLocaleDateString("en-IN") : "-"} />
          <DetailItem label="Age" value={r.dob ? ageFromDob(r.dob) : r.age} />
          <DetailItem label="Address" value={doctorAddressFromRecord(r) || "-"} full />
          <DetailItem label="Qualification" value={r.qualification || "-"} />
          <DetailItem label="DCI Registration" value={r.dciRegNo} />
          <DetailItem label="BDS Passing Out Year" value={r.degrees?.bdsYear ?? "-"} />
          <DetailItem label="MDS Passing Out Year" value={r.degrees?.mdsYear ?? "-"} />
          <DetailItem label="Specialization" value={r.specialization} />
          <DetailItem
            label="Fee Structure"
            value={
              (r.feeStructure || []).length
                ? (r.feeStructure || []).map((x) => `${x.procedure || "Procedure"} — ₹${Number(x.fee || 0)}`).join(", ")
                : "-"
            }
            full
          />
          <DetailItem label="Availability" value={formatAvailability(r.availability)} full />
          <DetailItem label="Account Holder Name" value={r.accountHolderName || "-"} />
          <DetailItem label="Account Number" value={r.accountNumber || "-"} />
          <DetailItem label="Account Type" value={r.accountType || "-"} />
          <DetailItem label="Bank Name" value={r.bankName || "-"} />
          <DetailItem label="Bank Branch Name" value={r.bankBranchName || "-"} />
          <DetailItem label="IFSC Code" value={r.ifscCode || "-"} />
          <DetailItem label="Bank UPI ID" value={r.upiId || "-"} />
          <DetailItem label="Branch" value={r.branch?.name} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
          {r.image && <DetailItem label="Image" value={<a href={r.image} target="_blank" rel="noreferrer">View image</a>} />}
        </DetailGrid>
      )}
    />
  );
}

function DoctorWizardForm({ values, setValues }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [procedures, setProcedures] = useState([]);
  const [step, setStep] = useState(0); // 0 = Basic, 1 = Professional
  const computedAge = useMemo(() => ageFromDob(values.dob), [values.dob]);

  useEffect(() => {
    if (!values.dob || computedAge === "") return;
    setValues((prev) => {
      if (!prev || prev.age === computedAge) return prev;
      return { ...prev, age: computedAge };
    });
  }, [computedAge, setValues, values.dob]);

  // reset wizard when opening a new record / edit
  useEffect(() => {
    setStep(0);
  }, [values?.upid, values?.email, values?.phone]);

  useEffect(() => {
    api.get("/procedures", { params: { limit: 500, status: "active" } })
      .then(({ data }) => setProcedures(data?.data || []))
      .catch(() => setProcedures([]));
  }, []);

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
        vreq("Phone number", String(values.phone || "").trim()) &&
        vreq("Email", String(values.email || "").trim()) &&
        vreq("Gender", String(values.gender || "").trim()) &&
        vreq("Date of birth", String(values.dob || "").trim()) &&
        vreq("Address", String(values.address || "").trim()) &&
        vreq("Branch", String(values.branch || "").trim())
      );
    }

    // final submit validation (professional)
    return (
      vreq("Qualification", String(values.qualification || "").trim()) &&
      vreq("BDS passing out year", Number.isFinite(values?.degrees?.bdsYear) ? values.degrees.bdsYear : String(values?.degrees?.bdsYear || "").trim()) &&
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
      className="doctor-form"
      onKeyDown={(e) => {
        // Prevent accidental form submit (Enter) on step 1 navigation.
        // The form submit should only happen from the explicit "Save Doctor" action.
        if (e.key === "Enter" && step === 0) e.preventDefault();
      }}
    >
      <div className="wizard-header">
        <div className="wizard-steps" role="tablist" aria-label="Doctor form steps">
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
            <span className="n">2</span> Professional details
          </button>
        </div>
      </div>

      {step === 0 && (
        <FormSection title="Basic details" hint="Personal contact info, address, and branch assignment.">
          <div className="form-grid">
            <Field label="Name" req>
              <div className="input-pair select-first">
                <select value={values.titlePrefix || "Dr."} onChange={(e) => set("titlePrefix", e.target.value)}>
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
            <Field label="Phone Number" req>
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
            <Field label="Land Line Number">
              <input value={values.landline || ""} onChange={(e) => set("landline", e.target.value)} placeholder="Land Line Number" />
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
            <ClinicBranchField
              value={values.branch || ""}
              onChange={(branchId) => set("branch", branchId)}
              includeClinicName
            />
            <Field label="Status">
              <select value={values.status || "active"} onChange={(e) => set("status", e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
        </FormSection>
      )}

      {step === 1 && (
        <div className="doctor-form-sections">
          <FormSection title="Professional details" hint="Qualifications, registration, and specialization.">
            <div className="form-grid">
              <Field label="Qualification" req>
                <input value={values.qualification || ""} onChange={(e) => set("qualification", e.target.value)} placeholder="e.g. BDS, MDS" />
              </Field>
              <Field label="DCI Registration No">
                <input value={values.dciRegNo || ""} onChange={(e) => set("dciRegNo", e.target.value)} placeholder="DCI number" />
              </Field>
              <Field label="BDS Passing Out Year" req>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={values.degrees?.bdsYear ?? ""}
                  onChange={(e) => set("degrees", { ...values.degrees, bdsYear: e.target.value === "" ? null : Number(e.target.value) })}
                  placeholder="e.g. 2018"
                />
              </Field>
              <Field label="MDS Passing Out Year">
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={values.degrees?.mdsYear ?? ""}
                  onChange={(e) => set("degrees", { ...values.degrees, mdsYear: e.target.value === "" ? null : Number(e.target.value) })}
                  placeholder="e.g. 2021"
                />
              </Field>
              <Field label="Specialization">
                <input value={values.specialization || ""} onChange={(e) => set("specialization", e.target.value)} />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Fee structure" hint="Set procedure fees for this doctor.">
            <div className="fee-structure">
              {(values.feeStructure || []).map((row, i) => (
                <div key={i} className="fee-structure-row">
                  <Field label="Procedure" req>
                    <select
                      value={row.procedureRef || ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        const proc = procedures.find((p) => p._id === id);
                        const next = [...(values.feeStructure || [])];
                        next[i] = {
                          ...next[i],
                          procedureRef: id || null,
                          procedure: proc?.name || next[i]?.procedure || "",
                          fee: Number(proc?.charge ?? next[i]?.fee ?? 0),
                        };
                        set("feeStructure", next);
                      }}
                    >
                      <option value="">Select Procedure</option>
                      {procedures.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} — ₹{Number(p.charge || 0)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Fee (₹)" req>
                    <input
                      type="number"
                      min={0}
                      value={row.fee ?? 0}
                      onChange={(e) => {
                        const next = [...(values.feeStructure || [])];
                        next[i] = { ...next[i], fee: Number(e.target.value) };
                        set("feeStructure", next);
                      }}
                    />
                  </Field>
                  <div className="fee-structure-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => set("feeStructure", (values.feeStructure || []).filter((_, idx) => idx !== i))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => set("feeStructure", [...(values.feeStructure || []), { procedureRef: null, procedure: "", fee: 0 }])}
              >
                + Add procedure
              </button>
            </div>
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
              <Field label="Bank Branch Name" req>
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

          <FormSection title="Availability" hint="Set weekly working hours and days off.">
            <BusinessHoursEditor
              value={(values.weeklySchedule && values.weeklySchedule.length ? values.weeklySchedule : values.availability) || []}
              onChange={(next) => {
                const nextWeeklySchedule = next?.weeklySchedule || [];
                const nextAvailability = next?.availability || [];

                setValues((prev) => ({
                  ...(prev || {}),
                  weeklySchedule: nextWeeklySchedule,
                  availability: nextAvailability,
                }));
              }}
            />
          </FormSection>

          <FormSection title="Profile Picture" hint="Upload a clear square photo. JPG or PNG works best.">
            <ProfilePictureField
              url={values.image}
              uploading={uploading}
              alt="Doctor profile"
              onPick={uploadImage}
              onClear={clearImage}
            />
          </FormSection>
        </div>
      )}

      <div className={`wizard-nav ${step === 0 ? "end" : ""}`}>
        {step === 0 ? (
          <>
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
          </>
        ) : (
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>
              Back
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={(e) => {
                // if professional step invalid, stop form submit
                if (!validateStep(2)) e.preventDefault();
              }}
            >
              Save Doctor
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
