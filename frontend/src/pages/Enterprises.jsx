import CrudPage from "../components/CrudPage.jsx";
import PageDashboard from "../components/PageDashboard.jsx";
import Badge from "../components/Badge.jsx";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function Enterprises() {
  return (
    <CrudPage
      title="Enterprises"
      subtitle="Manage dental enterprise organizations and their branches."
      endpoint="enterprises"
      singular="Enterprise"
      statusOptions={STATUS_OPTIONS}
      defaultValues={{ status: "active" }}
      topContent={
        <PageDashboard
          resource="enterprises"
          cards={[
            { key: "total", label: "Total Enterprises", icon: "🏛️" },
            { key: "active", label: "Active", icon: "✅", bg: "#E3FBF6" },
            { key: "inactive", label: "Inactive", icon: "⏸️", bg: "#FFEDEB" },
          ]}
        />
      }
      columns={[
        {
          key: "name",
          header: "Enterprise",
          render: (r) => (
            <div className="cell-avatar">
              {r.logo ? (
                <img className="av av-img" src={r.logo} alt={r.name} />
              ) : (
                <div className="av">{r.code?.slice(0, 2)}</div>
              )}
              <div>
                <div className="cell-main">{r.name}</div>
                <div className="cell-sub">{r.code}</div>
              </div>
            </div>
          ),
        },
        { key: "owner", header: "Owner", render: (r) => r.owner || "—" },
        { key: "gstin", header: "GSTIN", render: (r) => r.gstin || "—" },
        { key: "phone", header: "Phone", render: (r) => r.phone || "—" },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
      ]}
      fields={[
        { name: "name", label: "Enterprise Name", required: true },
        { name: "code", label: "Code", required: true, placeholder: "e.g. EVD" },
        { name: "owner", label: "Owner" },
        { name: "gstin", label: "GSTIN" },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email", type: "email" },
        { name: "logo", label: "Logo URL" },
        { name: "address", label: "Address", type: "textarea", full: true },
        { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
      ]}
      toForm={(r) => ({
        name: r.name,
        code: r.code,
        owner: r.owner || "",
        gstin: r.gstin || "",
        phone: r.phone || "",
        email: r.email || "",
        logo: r.logo || "",
        address: r.address || "",
        status: r.status || "active",
      })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Name" value={r.name} />
          <DetailItem label="Code" value={r.code} />
          <DetailItem label="Owner" value={r.owner} />
          <DetailItem label="GSTIN" value={r.gstin} />
          <DetailItem label="Phone" value={r.phone} />
          <DetailItem label="Email" value={r.email} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
          <DetailItem label="Address" value={r.address} full />
        </DetailGrid>
      )}
    />
  );
}
