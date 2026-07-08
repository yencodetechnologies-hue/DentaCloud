import { useState } from "react";
import CrudPage from "../components/CrudPage.jsx";
import PageDashboard from "../components/PageDashboard.jsx";
import Badge from "../components/Badge.jsx";
import useOptions from "../hooks/useOptions.js";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

const TABS = [
  { id: "fixed-costs", label: "Fixed Costs", endpoint: "fixed-costs", singular: "Fixed Cost" },
  { id: "investments", label: "Investments", endpoint: "investments", singular: "Investment" },
  { id: "financial-profiles", label: "Financial Profiles", endpoint: "financial-profiles", singular: "Financial Profile" },
];

const FREQ = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "one-time", label: "One-time" },
];

function money(n) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
}

function FixedCostsTab() {
  const enterprises = useOptions("enterprises", (e) => ({ value: e._id, label: e.name }));
  return (
    <CrudPage
      title="Fixed Costs"
      subtitle="Recurring fixed costs per branch."
      endpoint="fixed-costs"
      singular="Fixed Cost"
      defaultValues={{ frequency: "monthly", amount: 0, status: "active" }}
      columns={[
        { key: "name", header: "Name", render: (r) => r.name },
        { key: "category", header: "Category", render: (r) => r.category || "—" },
        { key: "amount", header: "Amount", render: (r) => money(r.amount) },
        { key: "frequency", header: "Frequency", render: (r) => r.frequency },
        { key: "branch", header: "Branch", render: (r) => r.branch?.name || "—" },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "category", label: "Category" },
        { name: "amount", label: "Amount (₹)", type: "number", required: true },
        { name: "frequency", label: "Frequency", type: "select", options: FREQ },
        { name: "enterprise", label: "Enterprise", type: "select", options: enterprises },
        { name: "branch", label: "Branch", type: "clinicBranch" },
        { name: "notes", label: "Notes", type: "textarea", full: true },
        { name: "status", label: "Status", type: "select", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
      ]}
      toForm={(r) => ({
        name: r.name,
        category: r.category || "",
        amount: r.amount ?? 0,
        frequency: r.frequency || "monthly",
        enterprise: r.enterprise?._id || "",
        branch: r.branch?._id || "",
        notes: r.notes || "",
        status: r.status || "active",
      })}
      toPayload={(v) => ({ ...v, enterprise: v.enterprise || null, branch: v.branch || null, amount: Number(v.amount) || 0 })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Name" value={r.name} />
          <DetailItem label="Category" value={r.category} />
          <DetailItem label="Amount" value={money(r.amount)} />
          <DetailItem label="Frequency" value={r.frequency} />
          <DetailItem label="Branch" value={r.branch?.name} />
          <DetailItem label="Status" value={<Badge value={r.status} />} />
          <DetailItem label="Notes" value={r.notes} full />
        </DetailGrid>
      )}
    />
  );
}

function InvestmentsTab() {
  const enterprises = useOptions("enterprises", (e) => ({ value: e._id, label: e.name }));
  return (
    <CrudPage
      title="Investments"
      subtitle="Capital investments and equipment purchases."
      endpoint="investments"
      singular="Investment"
      defaultValues={{ amount: 0, date: new Date().toISOString().slice(0, 10) }}
      columns={[
        { key: "name", header: "Name", render: (r) => r.name },
        { key: "amount", header: "Amount", render: (r) => money(r.amount) },
        { key: "date", header: "Date", render: (r) => new Date(r.date).toLocaleDateString("en-IN") },
        { key: "category", header: "Category", render: (r) => r.category || "—" },
        { key: "branch", header: "Branch", render: (r) => r.branch?.name || "—" },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "amount", label: "Amount (₹)", type: "number", required: true },
        { name: "date", label: "Date", type: "date" },
        { name: "category", label: "Category" },
        { name: "enterprise", label: "Enterprise", type: "select", options: enterprises },
        { name: "branch", label: "Branch", type: "clinicBranch" },
        { name: "notes", label: "Notes", type: "textarea", full: true },
      ]}
      toForm={(r) => ({
        name: r.name,
        amount: r.amount ?? 0,
        date: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
        category: r.category || "",
        enterprise: r.enterprise?._id || "",
        branch: r.branch?._id || "",
        notes: r.notes || "",
      })}
      toPayload={(v) => ({ ...v, enterprise: v.enterprise || null, branch: v.branch || null, amount: Number(v.amount) || 0 })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Name" value={r.name} />
          <DetailItem label="Amount" value={money(r.amount)} />
          <DetailItem label="Date" value={new Date(r.date).toLocaleDateString("en-IN")} />
          <DetailItem label="Category" value={r.category} />
          <DetailItem label="Branch" value={r.branch?.name} />
          <DetailItem label="Notes" value={r.notes} full />
        </DetailGrid>
      )}
    />
  );
}

function FinancialProfilesTab() {
  const enterprises = useOptions("enterprises", (e) => ({ value: e._id, label: e.name }));
  return (
    <CrudPage
      title="Financial Profiles"
      subtitle="Per-branch financial profile and opening capital."
      endpoint="financial-profiles"
      singular="Financial Profile"
      defaultValues={{ openingCapital: 0, monthlyFixedCostTotal: 0 }}
      columns={[
        { key: "branch", header: "Branch", render: (r) => r.branch?.name || "—" },
        { key: "openingCapital", header: "Opening Capital", render: (r) => money(r.openingCapital) },
        { key: "monthlyFixedCostTotal", header: "Monthly Fixed Cost", render: (r) => money(r.monthlyFixedCostTotal) },
      ]}
      fields={[
        { name: "branch", label: "Branch", type: "clinicBranch", required: true },
        { name: "enterprise", label: "Enterprise", type: "select", options: enterprises },
        { name: "openingCapital", label: "Opening Capital (₹)", type: "number" },
        { name: "monthlyFixedCostTotal", label: "Monthly Fixed Cost Total (₹)", type: "number" },
        { name: "notes", label: "Notes", type: "textarea", full: true },
      ]}
      toForm={(r) => ({
        branch: r.branch?._id || "",
        enterprise: r.enterprise?._id || "",
        openingCapital: r.openingCapital ?? 0,
        monthlyFixedCostTotal: r.monthlyFixedCostTotal ?? 0,
        notes: r.notes || "",
      })}
      toPayload={(v) => ({
        ...v,
        branch: v.branch || null,
        enterprise: v.enterprise || null,
        openingCapital: Number(v.openingCapital) || 0,
        monthlyFixedCostTotal: Number(v.monthlyFixedCostTotal) || 0,
      })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Branch" value={r.branch?.name} />
          <DetailItem label="Opening Capital" value={money(r.openingCapital)} />
          <DetailItem label="Monthly Fixed Cost" value={money(r.monthlyFixedCostTotal)} />
          <DetailItem label="Notes" value={r.notes} full />
        </DetailGrid>
      )}
    />
  );
}

export default function Finance() {
  const [tab, setTab] = useState("fixed-costs");

  return (
    <div className="fade-up">
      <div className="section-head">
        <div>
          <h2>Finance</h2>
          <p>Fixed costs, investments, and branch financial profiles.</p>
        </div>
      </div>
      <PageDashboard
        resource="finance"
        cards={[
          { key: "fixedCosts", label: "Active Fixed Costs", icon: "📊", prefix: "₹" },
          { key: "investments", label: "Total Investments", icon: "💼", prefix: "₹" },
          { key: "profiles", label: "Financial Profiles", icon: "🏦" },
        ]}
      />
      <div className="table-toolbar" style={{ marginBottom: 16 }}>
        <div className="left" style={{ gap: 8, display: "flex" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`btn ${tab === t.id ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === "fixed-costs" && <FixedCostsTab />}
      {tab === "investments" && <InvestmentsTab />}
      {tab === "financial-profiles" && <FinancialProfilesTab />}
    </div>
  );
}
