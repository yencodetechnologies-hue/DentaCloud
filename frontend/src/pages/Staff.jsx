import CrudPage from "../components/CrudPage.jsx";
import Badge from "../components/Badge.jsx";
import useOptions from "../hooks/useOptions.js";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

const SHIFTS = [
  { value: "morning", label: "Morning" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
  { value: "full-day", label: "Full Day" },
];

export default function Staff() {
  const branches = useOptions("branches", (b) => ({ value: b._id, label: b.name }));

  return (
    <CrudPage
      title="Staff"
      subtitle="Manage non-clinical staff, roles and shifts."
      endpoint="staff"
      singular="Staff"
      statusOptions={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
      defaultValues={{ status: "active", shift: "morning", salary: 0, role: "Receptionist" }}
      columns={[
        {
          key: "name",
          header: "Staff",
          render: (r) => (
            <div className="cell-avatar">
              <div className="av">{(r.name || "").split(" ").map((p) => p[0]).slice(0, 2).join("")}</div>
              <div>
                <div className="cell-main">{r.name}</div>
                <div className="cell-sub">{r.role}</div>
              </div>
            </div>
          ),
        },
        { key: "branch", header: "Branch", render: (r) => r.branch?.name || "—" },
        { key: "shift", header: "Shift", render: (r) => <Badge value={r.shift} /> },
        { key: "phone", header: "Phone", render: (r) => r.phone || "—" },
        { key: "salary", header: "Salary", render: (r) => `₹${(r.salary || 0).toLocaleString("en-IN")}` },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
      ]}
      fields={() => [
        { name: "name", label: "Full Name", required: true },
        { name: "role", label: "Role", placeholder: "e.g. Receptionist" },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone" },
        { name: "shift", label: "Shift", type: "select", options: SHIFTS },
        { name: "salary", label: "Salary (₹)", type: "number", min: 0 },
        { name: "branch", label: "Branch", type: "select", options: branches },
        { name: "status", label: "Status", type: "select", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
      ]}
      toForm={(r) => ({ name: r.name, role: r.role, email: r.email, phone: r.phone, shift: r.shift, salary: r.salary, branch: r.branch?._id || "", status: r.status })}
      toPayload={(v) => ({ ...v, branch: v.branch || null })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Name" value={r.name} />
          <DetailItem label="Role" value={r.role} />
          <DetailItem label="Branch" value={r.branch?.name} />
          <DetailItem label="Shift" value={<Badge value={r.shift} />} />
          <DetailItem label="Salary" value={`₹${(r.salary || 0).toLocaleString("en-IN")}`} />
          <DetailItem label="Email" value={r.email} />
          <DetailItem label="Phone" value={r.phone} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
        </DetailGrid>
      )}
    />
  );
}
