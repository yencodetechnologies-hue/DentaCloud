import { useEffect, useState } from "react";
import CrudPage from "../components/CrudPage.jsx";
import FileDrop from "../components/FileDrop.jsx";
import useOptions from "../hooks/useOptions.js";
import api from "../api/client.js";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

const CATEGORY = [
  { value: "material", label: "Material" },
  { value: "chair", label: "Chair" },
  { value: "other", label: "Other" },
];

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function toDateInput(d) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}
function money(n) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
}

function InventorySummary({ version }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/inventory", { params: { limit: 200 } }).then(({ data }) => setItems(data.data)).catch(() => {});
  }, [version]);

  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const lowStock = items.filter((i) => i.quantity <= (i.reorderLevel || 0));
  const expiring = items.filter((i) => i.expiryDate && new Date(i.expiryDate) <= soon && new Date(i.expiryDate) >= now);

  if (!lowStock.length && !expiring.length) return null;

  return (
    <div className="panel" style={{ marginBottom: 18 }}>
      <div className="panel-head"><h3>Alerts</h3></div>
      {lowStock.length > 0 && (
        <div className="row-item"><div className="av">⚠️</div><div className="info"><div className="nm">{lowStock.length} item(s) low on stock</div><div className="sub">{lowStock.map((i) => i.name).join(", ")}</div></div></div>
      )}
      {expiring.length > 0 && (
        <div className="row-item"><div className="av">⏰</div><div className="info"><div className="nm">{expiring.length} item(s) expiring within 30 days</div><div className="sub">{expiring.map((i) => i.name).join(", ")}</div></div></div>
      )}
    </div>
  );
}

export default function Inventory() {
  const vendors = useOptions("vendors", (v) => ({ value: v._id, label: v.name }));
  const branches = useOptions("branches", (b) => ({ value: b._id, label: b.name }));

  return (
    <CrudPage
      title="Inventory"
      subtitle="Track materials, chairs and stock levels."
      endpoint="inventory"
      singular="Item"
      defaultValues={{ category: "material", quantity: 0, unit: "units", amount: 0, reorderLevel: 0 }}
      topContent={<InventorySummary />}
      wideForm
      columns={[
        { key: "name", header: "Item", render: (r) => <span className="cell-main">{r.name}</span> },
        { key: "category", header: "Category", render: (r) => <span style={{ textTransform: "capitalize" }}>{r.category}</span> },
        { key: "vendor", header: "Vendor", render: (r) => r.vendor?.name || "—" },
        { key: "quantity", header: "Qty", render: (r) => `${r.quantity} ${r.unit || ""}` },
        { key: "expiryDate", header: "Expiry", render: (r) => fmtDate(r.expiryDate) },
        { key: "amount", header: "Amount", render: (r) => money(r.amount) },
      ]}
      fields={[]}
      renderForm={({ values, setValues }) => (
        <div className="form-grid">
          <div className="field">
            <label>Item Name <span className="req">*</span></label>
            <input value={values.name || ""} onChange={(e) => setValues({ ...values, name: e.target.value })} required />
          </div>
          <div className="field">
            <label>Category</label>
            <select value={values.category || "material"} onChange={(e) => setValues({ ...values, category: e.target.value })}>
              {CATEGORY.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Vendor</label>
            <select value={values.vendor || ""} onChange={(e) => setValues({ ...values, vendor: e.target.value })}>
              <option value="">Select…</option>
              {vendors.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Branch</label>
            <select value={values.branch || ""} onChange={(e) => setValues({ ...values, branch: e.target.value })}>
              <option value="">Select…</option>
              {branches.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Quantity</label>
            <input type="number" min="0" value={values.quantity ?? 0} onChange={(e) => setValues({ ...values, quantity: Number(e.target.value) })} />
          </div>
          <div className="field">
            <label>Unit</label>
            <input value={values.unit || ""} onChange={(e) => setValues({ ...values, unit: e.target.value })} placeholder="e.g. boxes, pcs" />
          </div>
          <div className="field">
            <label>Reorder Level</label>
            <input type="number" min="0" value={values.reorderLevel ?? 0} onChange={(e) => setValues({ ...values, reorderLevel: Number(e.target.value) })} />
          </div>
          <div className="field">
            <label>Amount (₹)</label>
            <input type="number" min="0" value={values.amount ?? 0} onChange={(e) => setValues({ ...values, amount: Number(e.target.value) })} />
          </div>
          <div className="field">
            <label>Purchase Date</label>
            <input type="date" value={values.purchaseDate || ""} onChange={(e) => setValues({ ...values, purchaseDate: e.target.value })} />
          </div>
          <div className="field">
            <label>Expiry Date</label>
            <input type="date" value={values.expiryDate || ""} onChange={(e) => setValues({ ...values, expiryDate: e.target.value })} />
          </div>
          <div className="field">
            <label>Warranty Until</label>
            <input type="date" value={values.warrantyUntil || ""} onChange={(e) => setValues({ ...values, warrantyUntil: e.target.value })} />
          </div>
          <FileDrop label="Invoice" url={values.invoiceUrl} onChange={(url) => setValues({ ...values, invoiceUrl: url })} />
        </div>
      )}
      toForm={(r) => ({
        name: r.name,
        category: r.category,
        vendor: r.vendor?._id || "",
        branch: r.branch?._id || "",
        quantity: r.quantity,
        unit: r.unit,
        reorderLevel: r.reorderLevel,
        amount: r.amount,
        purchaseDate: toDateInput(r.purchaseDate),
        expiryDate: toDateInput(r.expiryDate),
        warrantyUntil: toDateInput(r.warrantyUntil),
        invoiceUrl: r.invoiceUrl,
      })}
      toPayload={(v) => ({ ...v, vendor: v.vendor || null, branch: v.branch || null })}
      renderView={(r) => (
        <DetailGrid>
          <DetailItem label="Item" value={r.name} />
          <DetailItem label="Category" value={r.category} />
          <DetailItem label="Vendor" value={r.vendor?.name} />
          <DetailItem label="Branch" value={r.branch?.name} />
          <DetailItem label="Quantity" value={`${r.quantity} ${r.unit || ""}`} />
          <DetailItem label="Reorder Level" value={r.reorderLevel} />
          <DetailItem label="Amount" value={money(r.amount)} />
          <DetailItem label="Purchase Date" value={fmtDate(r.purchaseDate)} />
          <DetailItem label="Expiry Date" value={fmtDate(r.expiryDate)} />
          <DetailItem label="Warranty Until" value={fmtDate(r.warrantyUntil)} />
          <DetailItem label="Invoice" value={r.invoiceUrl ? <a href={r.invoiceUrl} target="_blank" rel="noreferrer">View</a> : "—"} />
        </DetailGrid>
      )}
    />
  );
}
