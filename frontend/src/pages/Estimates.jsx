import { useState } from "react";
import CrudPage from "../components/CrudPage.jsx";
import Badge from "../components/Badge.jsx";
import useOptions from "../hooks/useOptions.js";
import api, { apiError } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import { DetailGrid, DetailItem } from "../components/Detail.jsx";

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

const STATUS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "converted", label: "Converted" },
];

function EstimateForm({ values, setValues, patients, branches }) {
  const items = values.items || [];
  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const gst = items.reduce((s, it) => s + ((Number(it.qty) || 0) * (Number(it.price) || 0) * (Number(it.gstRate) || 0)) / 100, 0);
  const total = Math.max(0, subtotal + gst - (Number(values.discount) || 0));

  function setItem(i, key, val) {
    const next = items.map((it, idx) => (idx === i ? { ...it, [key]: key === "description" || key === "hsn" ? val : Number(val) } : it));
    setValues({ ...values, items: next });
  }
  function addItem() {
    setValues({ ...values, items: [...items, { description: "", hsn: "", qty: 1, price: 0, gstRate: 0 }] });
  }
  function removeItem(i) {
    setValues({ ...values, items: items.filter((_, idx) => idx !== i) });
  }

  return (
    <div>
      <div className="form-grid">
        <div className="field">
          <label>Patient <span className="req">*</span></label>
          <select value={values.patient || ""} onChange={(e) => setValues({ ...values, patient: e.target.value })} required>
            <option value="">Select…</option>
            {patients.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
          <label>Date</label>
          <input type="date" value={values.date || ""} onChange={(e) => setValues({ ...values, date: e.target.value })} />
        </div>
        <div className="field">
          <label>Valid Until</label>
          <input type="date" value={values.validUntil || ""} onChange={(e) => setValues({ ...values, validUntil: e.target.value })} />
        </div>
        <div className="field">
          <label>Status</label>
          <select value={values.status || "draft"} onChange={(e) => setValues({ ...values, status: e.target.value })}>
            {STATUS.filter((s) => s.value !== "converted").map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ margin: "18px 0 8px", fontWeight: 600, fontSize: 13 }}>Line Items</div>
      <div className="line-item-row" style={{ gridTemplateColumns: "2fr 1fr 0.7fr 0.9fr 0.7fr auto", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px" }}>
        <span>Description</span><span>HSN</span><span>Qty</span><span>Price</span><span>GST %</span><span></span>
      </div>
      {items.map((it, i) => (
        <div className="line-item-row" style={{ gridTemplateColumns: "2fr 1fr 0.7fr 0.9fr 0.7fr auto" }} key={i}>
          <input value={it.description} placeholder="Service / item" onChange={(e) => setItem(i, "description", e.target.value)} />
          <input value={it.hsn || ""} placeholder="HSN/SAC" onChange={(e) => setItem(i, "hsn", e.target.value)} />
          <input type="number" min="0" value={it.qty} onChange={(e) => setItem(i, "qty", e.target.value)} />
          <input type="number" min="0" value={it.price} onChange={(e) => setItem(i, "price", e.target.value)} />
          <input type="number" min="0" value={it.gstRate || 0} onChange={(e) => setItem(i, "gstRate", e.target.value)} />
          <button type="button" className="act-btn danger" onClick={() => removeItem(i)}>🗑️</button>
        </div>
      ))}
      <button type="button" className="btn btn-sm" onClick={addItem} style={{ marginTop: 4 }}>＋ Add line</button>

      <div className="form-grid" style={{ marginTop: 18 }}>
        <div className="field">
          <label>Discount (₹)</label>
          <input type="number" min="0" value={values.discount ?? 0} onChange={(e) => setValues({ ...values, discount: Number(e.target.value) })} />
        </div>
        <div className="field">
          <label>Total</label>
          <input value={money(total)} readOnly style={{ fontWeight: 700 }} />
        </div>
      </div>
    </div>
  );
}

export default function Estimates() {
  const patients = useOptions("patients", (p) => ({ value: p._id, label: p.name }));
  const branches = useOptions("branches", (b) => ({ value: b._id, label: b.name }));
  const toast = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  async function convertToInvoice(row) {
    try {
      await api.post(`/estimates/${row._id}/convert`);
      toast.success("Converted to invoice");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <CrudPage
      key={refreshKey}
      title="Estimates"
      subtitle="Prepare treatment cost estimates and convert accepted ones to invoices."
      endpoint="estimates"
      singular="Estimate"
      statusOptions={STATUS}
      defaultValues={{ date: toDateInput(new Date()), status: "draft", items: [{ description: "", hsn: "", qty: 1, price: 0, gstRate: 0 }], discount: 0 }}
      columns={[
        { key: "estimateNo", header: "Estimate", render: (r) => <span className="cell-main">{r.estimateNo}</span> },
        { key: "patient", header: "Patient", render: (r) => r.patient?.name || "—" },
        { key: "date", header: "Date", render: (r) => fmtDate(r.date) },
        { key: "total", header: "Total", render: (r) => money(r.total) },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
        {
          key: "actions2",
          header: "",
          render: (r) =>
            r.status !== "converted" ? (
              <button type="button" className="btn btn-sm" onClick={(e) => { e.stopPropagation(); convertToInvoice(r); }}>
                → Invoice
              </button>
            ) : (
              <span className="cell-sub">Converted</span>
            ),
        },
      ]}
      fields={[]}
      wideForm
      renderForm={({ values, setValues }) => (
        <EstimateForm values={values} setValues={setValues} patients={patients} branches={branches} />
      )}
      toForm={(r) => ({
        patient: r.patient?._id || "",
        branch: r.branch?._id || "",
        date: toDateInput(r.date),
        validUntil: toDateInput(r.validUntil),
        status: r.status,
        items: r.items?.length ? r.items.map((it) => ({ description: it.description, hsn: it.hsn, qty: it.qty, price: it.price, gstRate: it.gstRate })) : [{ description: "", hsn: "", qty: 1, price: 0, gstRate: 0 }],
        discount: r.discount,
      })}
      toPayload={(v) => ({
        patient: v.patient,
        branch: v.branch || null,
        date: v.date,
        validUntil: v.validUntil || null,
        status: v.status,
        items: (v.items || []).filter((it) => it.description),
        discount: Number(v.discount) || 0,
      })}
      renderView={(r) => (
        <div>
          <DetailGrid>
            <DetailItem label="Estimate No" value={r.estimateNo} />
            <DetailItem label="Patient" value={r.patient?.name} />
            <DetailItem label="Branch" value={r.branch?.name} />
            <DetailItem label="Date" value={fmtDate(r.date)} />
            <DetailItem label="Valid Until" value={fmtDate(r.validUntil)} />
            <DetailItem label="Status" value={<Badge value={r.status} />} />
          </DetailGrid>
          <table className="invoice-items">
            <thead>
              <tr><th>Description</th><th>HSN</th><th>Qty</th><th>Price</th><th>GST %</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {(r.items || []).map((it, i) => (
                <tr key={i}>
                  <td>{it.description}</td>
                  <td>{it.hsn || "—"}</td>
                  <td>{it.qty}</td>
                  <td>{money(it.price)}</td>
                  <td>{it.gstRate || 0}%</td>
                  <td>{money(it.qty * it.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16, marginLeft: "auto", width: 260 }}>
            <div className="b-top" style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>Subtotal</span><span>{money(r.subtotal)}</span></div>
            <div className="b-top" style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>CGST</span><span>{money(r.taxBreakdown?.cgst)}</span></div>
            <div className="b-top" style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>SGST</span><span>{money(r.taxBreakdown?.sgst)}</span></div>
            <div className="b-top" style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>Discount</span><span>- {money(r.discount)}</span></div>
            <div className="b-top" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontWeight: 700, borderTop: "1px solid var(--line)" }}><span>Total</span><span>{money(r.total)}</span></div>
          </div>
          {r.status !== "converted" && (
            <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => convertToInvoice(r)}>
              Convert to Invoice
            </button>
          )}
        </div>
      )}
    />
  );
}
