import CrudPage from "../components/CrudPage.jsx";
import Badge from "../components/Badge.jsx";
import useOptions from "../hooks/useOptions.js";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

const TYPE = [
  { value: "dental-chair", label: "Dental Chair" },
  { value: "xray-machine", label: "X-Ray Machine" },
  { value: "scanner", label: "Scanner" },
  { value: "autoclave", label: "Autoclave" },
  { value: "other", label: "Other" },
];
const STATUS = [
  { value: "active", label: "Active" },
  { value: "under-repair", label: "Under Repair" },
  { value: "retired", label: "Retired" },
];

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function money(n) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
}

export default function Equipment() {
  const branches = useOptions("branches", (b) => ({ value: b._id, label: b.name }));

  return (
    <CrudPage
      title="Equipment"
      subtitle="Track clinic equipment, service dates and warranty."
      endpoint="equipment"
      singular="Equipment"
      statusOptions={STATUS}
      defaultValues={{ type: "other", status: "active", repairCost: 0 }}
      columns={[
        { key: "name", header: "Equipment", render: (r) => <span className="cell-main">{r.name}</span> },
        { key: "type", header: "Type", render: (r) => <span style={{ textTransform: "capitalize" }}>{r.type?.replace("-", " ")}</span> },
        { key: "branch", header: "Branch", render: (r) => r.branch?.name || "—" },
        { key: "nextServiceDate", header: "Next Service", render: (r) => fmtDate(r.nextServiceDate) },
        { key: "repairCost", header: "Repair Cost", render: (r) => money(r.repairCost) },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
      ]}
      fields={() => [
        { name: "name", label: "Equipment Name", required: true },
        { name: "type", label: "Type", type: "select", options: TYPE },
        { name: "branch", label: "Branch", type: "select", options: branches },
        { name: "purchaseDate", label: "Purchase Date", type: "date" },
        { name: "lastServiceDate", label: "Last Service Date", type: "date" },
        { name: "nextServiceDate", label: "Next Service Date", type: "date" },
        { name: "repairCost", label: "Repair Cost (₹)", type: "number", min: 0 },
        { name: "warrantyUntil", label: "Warranty Until", type: "date" },
        { name: "amcUntil", label: "AMC Until", type: "date" },
        { name: "status", label: "Status", type: "select", options: STATUS },
      ]}
      toForm={(r) => ({
        name: r.name,
        type: r.type,
        branch: r.branch?._id || "",
        purchaseDate: r.purchaseDate ? new Date(r.purchaseDate).toISOString().slice(0, 10) : "",
        lastServiceDate: r.lastServiceDate ? new Date(r.lastServiceDate).toISOString().slice(0, 10) : "",
        nextServiceDate: r.nextServiceDate ? new Date(r.nextServiceDate).toISOString().slice(0, 10) : "",
        repairCost: r.repairCost,
        warrantyUntil: r.warrantyUntil ? new Date(r.warrantyUntil).toISOString().slice(0, 10) : "",
        amcUntil: r.amcUntil ? new Date(r.amcUntil).toISOString().slice(0, 10) : "",
        status: r.status,
      })}
      toPayload={(v) => ({ ...v, branch: v.branch || null })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Equipment" value={r.name} />
          <DetailItem label="Type" value={r.type} />
          <DetailItem label="Branch" value={r.branch?.name} />
          <DetailItem label="Purchase Date" value={fmtDate(r.purchaseDate)} />
          <DetailItem label="Last Service" value={fmtDate(r.lastServiceDate)} />
          <DetailItem label="Next Service" value={fmtDate(r.nextServiceDate)} />
          <DetailItem label="Repair Cost" value={money(r.repairCost)} />
          <DetailItem label="Warranty Until" value={fmtDate(r.warrantyUntil)} />
          <DetailItem label="AMC Until" value={fmtDate(r.amcUntil)} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
        </DetailGrid>
      )}
    />
  );
}
