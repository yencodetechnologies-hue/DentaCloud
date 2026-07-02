import CrudPage from "../components/CrudPage.jsx";
import Badge from "../components/Badge.jsx";
import PatientForm from "../components/PatientForm.jsx";
import QuickContact from "../components/QuickContact.jsx";
import useOptions from "../hooks/useOptions.js";
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
  const parts = [a.street, a.city, a.pincode].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
};

function conditionList(medical) {
  if (!medical) return "None reported";
  const on = Object.keys(CONDITION_LABELS).filter((k) => medical[k]);
  return on.length ? on.map((k) => CONDITION_LABELS[k]).join(", ") : "None reported";
}

const emptyDefaults = {
  status: "active",
  gender: "male",
  age: "",
  dob: "",
  medical: {},
  address: {},
  prescriptions: [],
  previousTreatment: false,
  gumBleeding: false,
};

export default function Patients() {
  const branches = useOptions("branches", (b) => ({ value: b._id, label: b.name }));

  return (
    <CrudPage
      title="Patients"
      subtitle="Register and manage patient records across branches."
      endpoint="patients"
      singular="Patient"
      wideForm
      statusOptions={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
      defaultValues={emptyDefaults}
      columns={[
        {
          key: "name",
          header: "Patient",
          render: (r) => (
            <div className="cell-avatar">
              {r.photo ? <img className="av av-img" src={r.photo} alt={r.name} /> : <div className="av">{initials(r.name)}</div>}
              <div>
                <div className="cell-main">{r.name}</div>
                <div className="cell-sub">{r.patientId || "—"} · {r.age || "—"} yrs · {r.gender}</div>
              </div>
            </div>
          ),
        },
        { key: "phone", header: "Phone", render: (r) => <QuickContact phone={r.phone} /> },
        { key: "branch", header: "Branch", render: (r) => r.branch?.name || "—" },
        { key: "reasonForVisit", header: "Reason", render: (r) => REASON_LABELS[r.reasonForVisit] || "—" },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
      ]}
      fields={() => []}
      renderForm={({ values, setValues, editing }) => (
        <PatientForm
          values={values}
          setValues={setValues}
          editing={editing}
          branches={branches}
        />
      )}
      toForm={(r) => ({
        name: r.name || "",
        gender: r.gender || "male",
        dob: r.dob || "",
        age: r.age ?? "",
        photo: r.photo || "",
        phone: r.phone || "",
        altPhone: r.altPhone || "",
        email: r.email || "",
        address: r.address || {},
        patientId: r.patientId || "",
        branch: r.branch?._id || "",
        referredBy: r.referredBy || "",
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
        doctorInstructions: r.doctorInstructions || "",
        specialNotes: r.specialNotes || "",
        status: r.status || "active",
      })}
      toPayload={(v) => {
        const { patientId, ...rest } = v;
        // Remove billing/payment fields from patient payloads.
        // (Old records may still contain these fields in the DB.)
        const { insurance, paymentPreference, ...withoutBilling } = rest;
        return {
          ...withoutBilling,
          age: withoutBilling.age === "" ? 0 : withoutBilling.age,
          dob: withoutBilling.dob || null,
          lastVisitDate: withoutBilling.lastVisitDate || null,
          firstVisitDate: withoutBilling.firstVisitDate || null,
          branch: withoutBilling.branch || null,
        };
      }}
      renderView={(r) => (
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
            <DetailItem label="Alternate" value={r.altPhone} />
            <DetailItem label="Email" value={r.email} />
            <DetailItem label="Blood Group" value={r.bloodGroup} />
            <DetailItem label="Branch" value={r.branch?.name} />
            <DetailItem label="Referred By" value={r.referredBy} />
            <DetailItem label="Address" value={fmtAddress(r.address)} full />
          </DetailGrid>

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

          {(r.comments || r.doctorInstructions || r.specialNotes) && (
            <>
              <h4 className="pv-group">Notes</h4>
              <DetailGrid>
                <DetailItem label="Comments" value={r.comments} full />
                <DetailItem label="Doctor Instructions" value={r.doctorInstructions} full />
                <DetailItem label="Special Notes" value={r.specialNotes} full />
              </DetailGrid>
            </>
          )}
        </div>
      )}
    />
  );
}
