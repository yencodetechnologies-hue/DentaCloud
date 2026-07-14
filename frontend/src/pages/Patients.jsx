import { useEffect, useState } from "react";
import CrudPage from "../components/CrudPage.jsx";
import PageDashboard from "../components/PageDashboard.jsx";
import Badge from "../components/Badge.jsx";
import PatientForm from "../components/PatientForm.jsx";
import api, { apiError } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

const REASON_LABELS = {
  toothPain: "Tooth pain",
  cleaning: "Cleaning",
  checkup: "Check-up",
  cosmetic: "Cosmetic treatment",
  emergency: "Emergency",
};

const CONDITION_LABELS = {
  diabetes: "Diabetes",
  bloodPressure: "Blood Pressure",
  heartDisease: "Heart Disease",
  asthma: "Asthma",
  epilepsy: "Epilepsy",
  thyroid: "Thyroid",
  pregnancy: "Pregnancy",
};

const initials = (name) => (name || "").split(" ").map((p) => p[0]).slice(0, 2).join("");

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const fmtAddress = (a) => {
  if (!a) return "—";
  return a.street || "—";
};

function buildPatientName(values) {
  return [values.titlePrefix, values.firstName, values.lastName].filter(Boolean).join(" ").trim();
}

function splitLegacyName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { titlePrefix: "Baby.", firstName: "", lastName: "" };
  const titles = new Set(["Baby.", "Mast.", "Mr.", "Mrs.", "Ms.", "Dr."]);
  if (titles.has(parts[0])) {
    return {
      titlePrefix: parts[0],
      firstName: parts[1] || "",
      lastName: parts.slice(2).join(" "),
    };
  }
  return { titlePrefix: "Baby.", firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

function conditionList(medical) {
  if (!medical) return "None reported";
  const on = Object.keys(CONDITION_LABELS).filter((k) => medical[k]);
  return on.length ? on.map((k) => CONDITION_LABELS[k]).join(", ") : "None reported";
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const emptyDefaults = {
  status: "active",
  gender: "male",
  titlePrefix: "Baby.",
  firstName: "",
  lastNamePrefix: "D/o",
  lastName: "",
  altPhoneRelation: "Father",
  altPhone: "",
  email: "",
  age: "",
  dob: "",
  medical: {},
  address: { street: "" },
  prescriptions: [],
  relatedParty: [],
  sourceOfReference: "",
  referredBy: "",
  previousTreatment: false,
  gumBleeding: false,
};

function patientLocation(r) {
  if (!r) return "-";
  return r.address?.city || r.address?.street || r.branch?.name || "-";
}

export default function Patients() {
  const toast = useToast();
  const [dashKey, setDashKey] = useState(0);
  const [statusBusyId, setStatusBusyId] = useState(null);

  async function togglePatientStatus(row, setRows) {
    const nextStatus = row.status === "active" ? "inactive" : "active";
    setStatusBusyId(row._id);
    try {
      await api.put(`/patients/${row._id}`, { status: nextStatus });
      setRows?.((prev) => prev.map((r) => (r._id === row._id ? { ...r, status: nextStatus } : r)));
      toast.success(`Patient marked ${nextStatus}`);
      setDashKey((k) => k + 1);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <CrudPage
      title="Patients"
      subtitle="Register and manage patient records across branches."
      endpoint="patients"
      singular="Patient"
      wideForm
      onChanged={() => setDashKey((k) => k + 1)}
      tableProps={{
        selectable: true,
        sortable: true,
        hideDelete: true,
        actionVariant: "teal",
      }}
      topContent={
        <PageDashboard
          resource="patients"
          refreshKey={dashKey}
          cards={[
            { key: "total", label: "Total Patients", icon: "👥" },
            { key: "active", label: "Active", icon: "✅" },
            { key: "inactive", label: "Inactive", icon: "⏸️" },
          ]}
        />
      }
      statusOptions={STATUS_OPTIONS}
      defaultValues={emptyDefaults}
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
          key: "patientId",
          header: "User Name",
          render: (r) => r.patientId || "-",
        },
        {
          key: "email",
          header: "Email",
          render: (r) => r.email || "-",
        },
        {
          key: "phone",
          header: "Phone",
          render: (r) => r.phone || "-",
        },
        {
          key: "location",
          header: "Location",
          render: (r) => patientLocation(r),
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
                  togglePatientStatus(r, setRows);
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
      renderForm={({ values, setValues, editing }) => (
        <PatientForm
          values={values}
          setValues={setValues}
          editing={editing}
        />
      )}
      toForm={(r) => {
        const legacy = splitLegacyName(r.name);
        return {
          name: r.name || "",
          titlePrefix: r.titlePrefix || legacy.titlePrefix,
          firstName: r.firstName || legacy.firstName,
          lastNamePrefix: r.lastNamePrefix || "D/o",
          lastName: r.lastName || legacy.lastName,
          gender: r.gender || "male",
          dob: r.dob || "",
          age: r.age ?? "",
          photo: r.photo || "",
          phone: r.phone || "",
          altPhoneRelation: r.altPhoneRelation || "Father",
          altPhone: r.altPhone || "",
          email: r.email || "",
          address: {
            street: [r.address?.street, r.address?.city].filter(Boolean).join(", "),
          },
          patientId: r.patientId || "",
          branch: r.branch?._id || "",
          referredBy: r.referredBy || "",
          sourceOfReference: r.sourceOfReference || "",
          referredByPatient: r.referredByPatient?._id || "",
          relatedParty: r.relatedParty || [],
          thankYouSentAt: r.thankYouSentAt || "",
          bloodGroup: r.bloodGroup || "",
          medical: r.medical || {},
          allergies: r.allergies || "",
          currentMedications: r.currentMedications || "",
          previousTreatment: !!r.previousTreatment,
          lastVisitDate: r.lastVisitDate || "",
          toothPainHistory: r.toothPainHistory || "",
          gumBleeding: !!r.gumBleeding,
          ongoingProblem: r.ongoingProblem || "",
          firstVisitDate: r.firstVisitDate || "",
          reasonForVisit: r.reasonForVisit || "",
          idProof: r.idProof || "",
          xray: r.xray || "",
          prescriptions: r.prescriptions || [],
          comments: r.comments || "",
          status: r.status || "active",
        };
      }}
      toPayload={(v) => {
        const { patientId, ...rest } = v;
        // Remove billing/payment fields from patient payloads.
        // (Old records may still contain these fields in the DB.)
        const { insurance, paymentPreference, ...withoutBilling } = rest;
        const name = buildPatientName(withoutBilling) || withoutBilling.name || "";
        return {
          ...withoutBilling,
          name,
          age: withoutBilling.age === "" ? 0 : withoutBilling.age,
          dob: withoutBilling.dob || null,
          lastVisitDate: withoutBilling.lastVisitDate || null,
          firstVisitDate: withoutBilling.firstVisitDate || null,
          branch: withoutBilling.branch || null,
          sourceOfReference: withoutBilling.sourceOfReference || "",
          referredBy: withoutBilling.referredBy || "",
          referredByPatient: withoutBilling.referredByPatient || null,
          relatedParty: withoutBilling.relatedParty || [],
          address: {
            street: withoutBilling.address?.street || "",
          },
        };
      }}
      renderView={(r) => <PatientDetailView patient={r} />}
    />
  );
}

function PatientDetailView({ patient: r }) {
  const [patientReports, setPatientReports] = useState([]);

  useEffect(() => {
    api.get("/reports", { params: { patient: r._id, limit: 20 } })
      .then(({ data }) => setPatientReports(data.data || []))
      .catch(() => setPatientReports([]));
  }, [r._id]);

  return (
        <div className="patient-view">
          <div className="pv-head">
            {r.photo ? <img className="pv-photo" src={r.photo} alt={r.name} /> : <div className="pv-photo ph">{initials(r.name)}</div>}
            <div>
              <h3>{r.name}</h3>
              <p>{r.patientId || "—"} · {r.age || "—"} yrs · {r.gender}</p>
              <Badge value={r.status} />
            </div>
          </div>

          <h4 className="pv-group">Contact</h4>
          <DetailGrid>
            <DetailItem label="Mobile" value={r.phone} />
            <DetailItem label="Alternate" value={r.altPhoneRelation ? `${r.altPhoneRelation}: ${r.altPhone || "—"}` : r.altPhone} />
            <DetailItem label="Email" value={r.email} />
            <DetailItem label="Blood Group" value={r.bloodGroup} />
            <DetailItem label="Branch" value={r.branch?.name} />
            <DetailItem label="Reference By" value={r.referredBy} />
            <DetailItem label="Source" value={r.sourceOfReference || "—"} />
            <DetailItem label="Thank-you Email" value={r.thankYouSentAt ? new Date(r.thankYouSentAt).toLocaleString("en-IN") : "Not sent"} />
            <DetailItem label="Address" value={fmtAddress(r.address)} full />
          </DetailGrid>

          {(r.relatedParty || []).length > 0 && (
            <>
              <h4 className="pv-group">Related Party</h4>
              <DetailGrid>
                {(r.relatedParty || []).map((p, i) => (
                  <DetailItem key={i} label={p.relation || "Related"} value={`${p.name || ""} ${p.phone || ""}`.trim()} />
                ))}
              </DetailGrid>
            </>
          )}

          <h4 className="pv-group">Medical</h4>
          <DetailGrid>
            <DetailItem label="Conditions" value={conditionList(r.medical)} full />
            <DetailItem label="Allergies" value={r.allergies} full />
            <DetailItem label="Current Medications" value={r.currentMedications} full />
          </DetailGrid>

          <h4 className="pv-group">Dental</h4>
          <DetailGrid>
            <DetailItem label="Previous Treatment" value={r.previousTreatment ? "Yes" : "No"} />
            <DetailItem label="Last Visit" value={fmtDate(r.lastVisitDate)} />
            <DetailItem label="Gum Bleeding" value={r.gumBleeding ? "Yes" : "No"} />
            <DetailItem label="Tooth Pain History" value={r.toothPainHistory} full />
            <DetailItem label="Ongoing Problem" value={r.ongoingProblem} full />
          </DetailGrid>

          <h4 className="pv-group">Visit & Billing</h4>
          <DetailGrid>
            <DetailItem label="First Visit" value={fmtDate(r.firstVisitDate)} />
            <DetailItem label="Reason" value={REASON_LABELS[r.reasonForVisit] || "—"} />
            <DetailItem label="Insurance" value={r.insurance ? "Yes" : "No"} />
            <DetailItem label="Payment" value={r.paymentPreference ? r.paymentPreference.toUpperCase() : "—"} />
          </DetailGrid>

          {(r.idProof || r.xray || (r.prescriptions || []).length > 0) && (
            <>
              <h4 className="pv-group">Attachments</h4>
              <div className="pv-files">
                {r.idProof && <a href={r.idProof} target="_blank" rel="noreferrer" className="file-pill solo"><span>ID Proof</span></a>}
                {r.xray && <a href={r.xray} target="_blank" rel="noreferrer" className="file-pill solo"><span>X-ray</span></a>}
                {(r.prescriptions || []).map((url, i) => (
                  <a href={url} target="_blank" rel="noreferrer" className="file-pill solo" key={url}><span>Prescription {i + 1}</span></a>
                ))}
              </div>
            </>
          )}

          {patientReports.length > 0 && (
            <>
              <h4 className="pv-group">Clinical Reports</h4>
              <div className="pv-files">
                {patientReports.map((rep) => (
                  <div className="file-pill solo" key={rep._id}>
                    <span>{rep.title || rep.type}</span>
                    {(rep.files || []).map((f, i) => (
                      <a key={i} href={f} target="_blank" rel="noreferrer">View</a>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}

          {r.comments && (
            <>
              <h4 className="pv-group">Notes</h4>
              <DetailGrid>
                <DetailItem label="Comments" value={r.comments} full />
              </DetailGrid>
            </>
          )}
        </div>
  );
}
