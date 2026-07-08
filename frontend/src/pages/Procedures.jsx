import CrudPage from "../components/CrudPage.jsx";
import PageDashboard from "../components/PageDashboard.jsx";
import Badge from "../components/Badge.jsx";
import useOptions from "../hooks/useOptions.js";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

const CATEGORIES = [
  "General", "Orthodontics", "Endodontics", "Periodontics", "Prosthodontics", "Surgery", "Cosmetic", "Diagnostic",
].map((c) => ({ value: c, label: c }));

const STATUS = [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }];

function money(n) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
}

export default function Procedures() {
  const enterprises = useOptions("enterprises", (e) => ({ value: e._id, label: e.name }));

  return (
    <CrudPage
      title="Procedures"
      subtitle="Procedure price list — charges used in billing and estimates."
      endpoint="procedures"
      singular="Procedure"
      statusOptions={STATUS}
      defaultValues={{ category: "General", charge: 0, defaultSessions: 1, status: "active" }}
      topContent={
        <PageDashboard
          resource="procedures"
          cards={[
            { key: "total", label: "Total Procedures", icon: "📝" },
            { key: "active", label: "Active", icon: "✅" },
            { key: "avgCharge", label: "Avg Charge", icon: "💰", prefix: "₹" },
          ]}
        />
      }
      columns={[
        { key: "name", header: "Procedure", render: (r) => <div><div className="cell-main">{r.name}</div><div className="cell-sub">{r.code || "—"}</div></div> },
        { key: "category", header: "Category", render: (r) => r.category },
        { key: "charge", header: "Charge", render: (r) => money(r.charge) },
        { key: "defaultSessions", header: "Sessions", render: (r) => r.defaultSessions },
        { key: "branch", header: "Branch", render: (r) => r.branch?.name || "All" },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
      ]}
      fields={[
        { name: "name", label: "Procedure Name", required: true },
        { name: "code", label: "Code", placeholder: "e.g. RCT" },
        { name: "category", label: "Category", type: "select", options: CATEGORIES },
        { name: "charge", label: "Charge (₹)", type: "number", required: true },
        { name: "defaultSessions", label: "Default Sessions", type: "number" },
        { name: "enterprise", label: "Enterprise", type: "select", options: enterprises },
        { name: "branch", label: "Branch", type: "clinicBranch" },
        { name: "description", label: "Description", type: "textarea", full: true },
        { name: "status", label: "Status", type: "select", options: STATUS },
      ]}
      toForm={(r) => ({
        name: r.name,
        code: r.code || "",
        category: r.category || "General",
        charge: r.charge ?? 0,
        defaultSessions: r.defaultSessions ?? 1,
        enterprise: r.enterprise?._id || "",
        branch: r.branch?._id || "",
        description: r.description || "",
        status: r.status || "active",
      })}
      toPayload={(v) => ({
        ...v,
        enterprise: v.enterprise || null,
        branch: v.branch || null,
        charge: Number(v.charge) || 0,
        defaultSessions: Number(v.defaultSessions) || 1,
      })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Name" value={r.name} />
          <DetailItem label="Code" value={r.code} />
          <DetailItem label="Category" value={r.category} />
          <DetailItem label="Charge" value={money(r.charge)} />
          <DetailItem label="Sessions" value={r.defaultSessions} />
          <DetailItem label="Branch" value={r.branch?.name} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
          <DetailItem label="Description" value={r.description} full />
        </DetailGrid>
      )}
    />
  );
}
