import CrudPage from "../components/CrudPage.jsx";
import PageDashboard from "../components/PageDashboard.jsx";
import Badge from "../components/Badge.jsx";
import QuickContact from "../components/QuickContact.jsx";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

const TYPE = [
  { value: "equipment", label: "Equipment" },
  { value: "material", label: "Material" },
];
const STATUS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function Vendors() {
  return (
    <CrudPage
      title="Vendors"
      subtitle="Manage equipment and material suppliers."
      endpoint="vendors"
      singular="Vendor"
      statusOptions={STATUS}
      defaultValues={{ type: "material", status: "active", buyDays: 0 }}
      topContent={
        <PageDashboard
          resource="vendors"
          cards={[
            { key: "total", label: "Total Vendors", icon: "🚚" },
            { key: "active", label: "Active", icon: "✅" },
            { key: "inactive", label: "Inactive", icon: "⏸️" },
          ]}
        />
      }
      columns={[
        { key: "name", header: "Vendor", render: (r) => <span className="cell-main">{r.name}</span> },
        { key: "type", header: "Type", render: (r) => <span style={{ textTransform: "capitalize" }}>{r.type}</span> },
        { key: "contactPerson", header: "Contact", render: (r) => r.contactPerson || "—" },
        { key: "phone", header: "Phone", render: (r) => <QuickContact phone={r.phone} /> },
        { key: "branch", header: "Branch", render: (r) => r.branch?.name || "—" },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
      ]}
      fields={() => [
        { name: "name", label: "Vendor Name", required: true },
        { name: "type", label: "Type", type: "select", options: TYPE },
        { name: "contactPerson", label: "Contact Person" },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email", type: "email" },
        { name: "gstin", label: "GSTIN" },
        { name: "buyDays", label: "Buy Days (lead time)", type: "number", min: 0 },
        { name: "branch", label: "Branch", type: "clinicBranch" },
        { name: "status", label: "Status", type: "select", options: STATUS },
        { name: "instructions", label: "Instructions", type: "textarea", full: true },
        { name: "address", label: "Address", type: "textarea", full: true },
      ]}
      toForm={(r) => ({
        name: r.name,
        type: r.type,
        contactPerson: r.contactPerson,
        phone: r.phone,
        email: r.email,
        gstin: r.gstin || "",
        buyDays: r.buyDays ?? 0,
        instructions: r.instructions || "",
        branch: r.branch?._id || "",
        status: r.status,
        address: r.address,
      })}
      toPayload={(v) => ({ ...v, branch: v.branch || null, buyDays: Number(v.buyDays) || 0 })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Vendor" value={r.name} />
          <DetailItem label="Type" value={r.type} />
          <DetailItem label="GSTIN" value={r.gstin} />
          <DetailItem label="Buy Days" value={r.buyDays} />
          <DetailItem label="Instructions" value={r.instructions} full />
          <DetailItem label="Contact Person" value={r.contactPerson} />
          <DetailItem label="Phone" value={r.phone} />
          <DetailItem label="Email" value={r.email} />
          <DetailItem label="Branch" value={r.branch?.name} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
          <DetailItem label="Address" value={r.address} full />
        </DetailGrid>
      )}
    />
  );
}
