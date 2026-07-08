import { useState, useEffect } from "react";
import CrudPage from "../components/CrudPage.jsx";
import PageDashboard from "../components/PageDashboard.jsx";
import Badge from "../components/Badge.jsx";
import useOptions from "../hooks/useOptions.js";
import ClinicBranchField from "../components/ClinicBranchField.jsx";
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

const PAYMENT = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "net-banking", label: "Net Banking" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
];

function calcTotals(items, discount) {
  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const gst = items.reduce((s, it) => s + ((Number(it.qty) || 0) * (Number(it.price) || 0) * (Number(it.gstRate) || 0)) / 100, 0);
  const total = Math.max(0, subtotal + gst - (Number(discount) || 0));
  return { subtotal, gst, cgst: gst / 2, sgst: gst / 2, total };
}

function InvoiceForm({ values, setValues, patients, procedures = [] }) {
  const items = values.items || [];
  const payments = values.payments || [];
  const { subtotal, gst, cgst, sgst, total } = calcTotals(items, values.discount);
  const paid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const [newPayment, setNewPayment] = useState({ amount: "", method: "cash", reference: "" });

  function setItem(i, key, val) {
    const next = items.map((it, idx) => (idx === i ? { ...it, [key]: key === "description" || key === "hsn" ? val : Number(val) } : it));
    setValues({ ...values, items: next });
  }
  function applyProcedure(i, procId) {
    const proc = procedures.find((p) => p._id === procId);
    if (!proc) return;
    const next = items.map((it, idx) =>
      idx === i ? { ...it, description: proc.name, price: proc.charge, procedureId: procId } : it
    );
    setValues({ ...values, items: next });
  }
  function addItem() {
    setValues({ ...values, items: [...items, { description: "", hsn: "", qty: 1, price: 0, gstRate: 0 }] });
  }
  function removeItem(i) {
    setValues({ ...values, items: items.filter((_, idx) => idx !== i) });
  }
  function addPayment() {
    if (!newPayment.amount) return;
    setValues({ ...values, payments: [...payments, { ...newPayment, amount: Number(newPayment.amount), date: new Date().toISOString() }] });
    setNewPayment({ amount: "", method: "cash", reference: "" });
  }
  function removePayment(i) {
    setValues({ ...values, payments: payments.filter((_, idx) => idx !== i) });
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
        <ClinicBranchField
          value={values.branch || ""}
          onChange={(branchId) => setValues({ ...values, branch: branchId })}
        />
        <div className="field">
          <label>Date</label>
          <input type="date" value={values.date || ""} onChange={(e) => setValues({ ...values, date: e.target.value })} />
        </div>
      </div>

      <div style={{ margin: "18px 0 8px", fontWeight: 600, fontSize: 13 }}>Line Items</div>
      <div className="line-item-row" style={{ gridTemplateColumns: "1.2fr 2fr 1fr 0.7fr 0.9fr 0.7fr auto", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px" }}>
        <span>Procedure</span><span>Description</span><span>HSN</span><span>Qty</span><span>Price</span><span>GST %</span><span></span>
      </div>
      {items.map((it, i) => (
        <div className="line-item-row" style={{ gridTemplateColumns: "1.2fr 2fr 1fr 0.7fr 0.9fr 0.7fr auto" }} key={i}>
          <select value={it.procedureId || ""} onChange={(e) => applyProcedure(i, e.target.value)}>
            <option value="">Pick procedure</option>
            {procedures.map((p) => <option key={p._id} value={p._id}>{p.name} — ₹{p.charge}</option>)}
          </select>
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
          <label>CGST / SGST</label>
          <input value={`${money(cgst)} / ${money(sgst)}`} readOnly />
        </div>
        <div className="field">
          <label>Total</label>
          <input value={money(total)} readOnly style={{ fontWeight: 700 }} />
        </div>
        <div className="field">
          <label>Paid</label>
          <input value={money(paid)} readOnly style={{ fontWeight: 700 }} />
        </div>
      </div>

      <div style={{ margin: "18px 0 8px", fontWeight: 600, fontSize: 13 }}>Payment History</div>
      {payments.map((p, i) => (
        <div className="line-item-row" style={{ gridTemplateColumns: "1fr 1fr 1fr auto", alignItems: "center" }} key={i}>
          <span>{money(p.amount)}</span>
          <span style={{ textTransform: "capitalize" }}>{p.method}</span>
          <span>{p.reference || "—"}</span>
          <button type="button" className="act-btn danger" onClick={() => removePayment(i)}>🗑️</button>
        </div>
      ))}
      <div className="line-item-row" style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}>
        <input type="number" min="0" placeholder="Amount" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} />
        <select value={newPayment.method} onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}>
          {PAYMENT.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input placeholder="Reference (optional)" value={newPayment.reference} onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })} />
        <button type="button" className="btn btn-sm" onClick={addPayment}>＋ Add payment</button>
      </div>
    </div>
  );
}

export default function Billing() {
  const patients = useOptions("patients", (p) => ({ value: p._id, label: p.name }));
  const [procedures, setProcedures] = useState([]);
  const toast = useToast();

  useEffect(() => {
    api.get("/procedures", { params: { limit: 200, status: "active" } })
      .then(({ data }) => setProcedures(data.data || []))
      .catch(() => {});
  }, []);

  async function logPaymentReminder(r) {
    try {
      await api.post("/notifications", {
        type: "payment-reminder",
        channel: "sms",
        recipientName: r.patient?.name,
        recipientContact: r.patient?.phone,
        message: `Reminder: ₹${(r.total - r.paid).toLocaleString("en-IN")} balance due on invoice ${r.invoiceNo}`,
        relatedEntityType: "Invoice",
        relatedEntityId: r._id,
        branch: r.branch?._id,
      });
      toast.success("Reminder logged");
    } catch (err) {
      toast.error(apiError(err));
    }
  }

  return (
    <CrudPage
      title="Billing"
      subtitle="Create invoices, apply GST and track patient payments."
      endpoint="invoices"
      singular="Invoice"
      topContent={
        <PageDashboard
          resource="invoices"
          cards={[
            { key: "total", label: "Total Invoices", icon: "💳" },
            { key: "todayRevenue", label: "Collected Today", icon: "💰", prefix: "₹" },
            { key: "unpaid", label: "Unpaid / Partial", icon: "⚠️" },
          ]}
        />
      }
      statusOptions={[{ value: "paid", label: "Paid" }, { value: "partial", label: "Partial" }, { value: "unpaid", label: "Unpaid" }]}
      defaultValues={{ date: toDateInput(new Date()), items: [{ description: "", hsn: "", qty: 1, price: 0, gstRate: 0 }], discount: 0, payments: [] }}
      columns={[
        { key: "invoiceNo", header: "Invoice", render: (r) => <span className="cell-main">{r.invoiceNo}</span> },
        { key: "patient", header: "Patient", render: (r) => r.patient?.name || "—" },
        { key: "branch", header: "Branch", render: (r) => r.branch?.name || "—" },
        { key: "date", header: "Date", render: (r) => fmtDate(r.date) },
        { key: "total", header: "Total", render: (r) => money(r.total) },
        { key: "paid", header: "Paid", render: (r) => money(r.paid) },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
        {
          key: "remind",
          header: "",
          render: (r) =>
            r.status !== "paid" ? (
              <button type="button" className="btn btn-sm" onClick={(e) => { e.stopPropagation(); logPaymentReminder(r); }}>
                🔔 Remind
              </button>
            ) : null,
        },
      ]}
      fields={[]}
      wideForm
      renderForm={({ values, setValues }) => (
        <InvoiceForm values={values} setValues={setValues} patients={patients} procedures={procedures} />
      )}
      toForm={(r) => ({
        patient: r.patient?._id || "",
        branch: r.branch?._id || "",
        date: toDateInput(r.date),
        items: r.items?.length ? r.items.map((it) => ({ description: it.description, hsn: it.hsn, qty: it.qty, price: it.price, gstRate: it.gstRate })) : [{ description: "", hsn: "", qty: 1, price: 0, gstRate: 0 }],
        discount: r.discount,
        payments: r.payments || [],
      })}
      toPayload={(v) => ({
        patient: v.patient,
        branch: v.branch || null,
        date: v.date,
        items: (v.items || []).filter((it) => it.description),
        discount: Number(v.discount) || 0,
        payments: v.payments || [],
      })}
      renderView={(r) => (
        <div>
          <DetailGrid>
            <DetailItem label="Invoice No" value={r.invoiceNo} />
            <DetailItem label="Patient" value={r.patient?.name} />
            <DetailItem label="Branch" value={r.branch?.name} />
            <DetailItem label="Date" value={fmtDate(r.date)} />
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
            <div className="b-top" style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>Paid</span><span>{money(r.paid)}</span></div>
            <div className="b-top" style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", color: "var(--coral)" }}><span>Balance</span><span>{money(r.total - r.paid)}</span></div>
          </div>
          {(r.payments || []).length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Payment History</div>
              <table className="invoice-items">
                <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th></tr></thead>
                <tbody>
                  {r.payments.map((p, i) => (
                    <tr key={i}>
                      <td>{fmtDate(p.date)}</td>
                      <td>{money(p.amount)}</td>
                      <td style={{ textTransform: "capitalize" }}>{p.method}</td>
                      <td>{p.reference || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    />
  );
}
