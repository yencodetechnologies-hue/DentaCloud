import CrudPage from "../components/CrudPage.jsx";
import PageDashboard from "../components/PageDashboard.jsx";
import Badge from "../components/Badge.jsx";
import useOptions from "../hooks/useOptions.js";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

export default function Branches() {
  const enterprises = useOptions("enterprises", (e) => ({ value: e._id, label: e.name }));

  return (
    <CrudPage
      title="Branches"
      subtitle="Manage all clinic branches and their details."
      endpoint="branches"
      singular="Branch"
      statusOptions={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
      defaultValues={{ status: "active" }}
      topContent={
        <PageDashboard
          resource="branches"
          cards={[
            { key: "total", label: "Total Branches", icon: "🏢" },
            { key: "active", label: "Active", icon: "✅", bg: "#E3FBF6" },
            { key: "inactive", label: "Inactive", icon: "⏸️", bg: "#FFEDEB" },
          ]}
        />
      }
      columns={[
        {
          key: "name",
          header: "Branch",
          render: (r) => (
            <div className="cell-avatar">
              <div className="av">{r.code?.slice(0, 2)}</div>
              <div>
                <div className="cell-main">{r.name}</div>
                <div className="cell-sub">{r.code} · {r.city}</div>
              </div>
            </div>
          ),
        },
        { key: "enterprise", header: "Enterprise", render: (r) => r.enterprise?.name || "—" },
        { key: "manager", header: "Manager", render: (r) => r.manager || "—" },
        { key: "phone", header: "Phone", render: (r) => r.phone || "—" },
        { key: "email", header: "Email", render: (r) => r.email || "—" },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
      ]}
      fields={[
        { name: "enterprise", label: "Enterprise", type: "select", options: enterprises },
        { name: "name", label: "Branch Name", required: true },
        { name: "code", label: "Branch Code", required: true, placeholder: "e.g. ADY" },
        { name: "city", label: "City" },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email", type: "email" },
        { name: "manager", label: "Manager" },
        { name: "address", label: "Address", type: "textarea", full: true },
        { name: "status", label: "Status", type: "select", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
      ]}
      toForm={(r) => ({
        enterprise: r.enterprise?._id || "",
        name: r.name,
        code: r.code,
        city: r.city,
        phone: r.phone,
        email: r.email,
        manager: r.manager,
        address: r.address,
        status: r.status,
      })}
      toPayload={(v) => ({
        ...v,
        enterprise: v.enterprise || null,
      })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Enterprise" value={r.enterprise?.name} />
          <DetailItem label="Branch Name" value={r.name} />
          <DetailItem label="Code" value={r.code} />
          <DetailItem label="City" value={r.city} />
          <DetailItem label="Manager" value={r.manager} />
          <DetailItem label="Phone" value={r.phone} />
          <DetailItem label="Email" value={r.email} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
          <DetailItem label="Address" value={r.address} full />
        </DetailGrid>
      )}
    />
  );
}
