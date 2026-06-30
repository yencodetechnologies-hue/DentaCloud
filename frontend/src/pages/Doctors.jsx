import CrudPage from "../components/CrudPage.jsx";
import Badge from "../components/Badge.jsx";
import useOptions from "../hooks/useOptions.js";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

export default function Doctors() {
  const branches = useOptions("branches", (b) => ({ value: b._id, label: b.name }));

  return (
    <CrudPage
      title="Doctors"
      subtitle="Manage doctors, specializations and branch assignments."
      endpoint="doctors"
      singular="Doctor"
      statusOptions={[{ value: "active", label: "Active" }, { value: "on-leave", label: "On Leave" }, { value: "inactive", label: "Inactive" }]}
      defaultValues={{ status: "active", experience: 0, consultationFee: 0 }}
      columns={[
        {
          key: "name",
          header: "Doctor",
          render: (r) => (
            <div className="cell-avatar">
              <div className="av">{(r.name || "").split(" ").map((p) => p[0]).slice(0, 2).join("")}</div>
              <div>
                <div className="cell-main">{r.name}</div>
                <div className="cell-sub">{r.specialization || "—"}</div>
              </div>
            </div>
          ),
        },
        { key: "branch", header: "Branch", render: (r) => r.branch?.name || "—" },
        { key: "phone", header: "Phone", render: (r) => r.phone || "—" },
        { key: "experience", header: "Exp.", render: (r) => `${r.experience || 0} yrs` },
        { key: "consultationFee", header: "Fee", render: (r) => `₹${(r.consultationFee || 0).toLocaleString("en-IN")}` },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
      ]}
      fields={() => [
        { name: "name", label: "Full Name", required: true },
        { name: "specialization", label: "Specialization", placeholder: "e.g. Endodontist" },
        { name: "qualification", label: "Qualification", placeholder: "BDS, MDS" },
        { name: "experience", label: "Experience (years)", type: "number", min: 0 },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone" },
        { name: "consultationFee", label: "Consultation Fee (₹)", type: "number", min: 0 },
        { name: "branch", label: "Branch", type: "select", options: branches },
        { name: "status", label: "Status", type: "select", options: [{ value: "active", label: "Active" }, { value: "on-leave", label: "On Leave" }, { value: "inactive", label: "Inactive" }] },
      ]}
      toForm={(r) => ({ name: r.name, specialization: r.specialization, qualification: r.qualification, experience: r.experience, email: r.email, phone: r.phone, consultationFee: r.consultationFee, branch: r.branch?._id || "", status: r.status })}
      toPayload={(v) => ({ ...v, branch: v.branch || null })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Name" value={r.name} />
          <DetailItem label="Specialization" value={r.specialization} />
          <DetailItem label="Qualification" value={r.qualification} />
          <DetailItem label="Experience" value={`${r.experience || 0} years`} />
          <DetailItem label="Branch" value={r.branch?.name} />
          <DetailItem label="Consultation Fee" value={`₹${(r.consultationFee || 0).toLocaleString("en-IN")}`} />
          <DetailItem label="Email" value={r.email} />
          <DetailItem label="Phone" value={r.phone} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
        </DetailGrid>
      )}
    />
  );
}
