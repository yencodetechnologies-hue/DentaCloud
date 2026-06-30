import CrudPage from "../components/CrudPage.jsx";
import Badge from "../components/Badge.jsx";
import useOptions from "../hooks/useOptions.js";
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
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
];

function InvoiceForm({ values, setValues, patients, branches }) {
  const items = values.items || [];
  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const total = Math.max(0, subtotal + (Number(values.tax) || 0) - (Number(values.discount) || 0));

  function setItem(i, key, val) {
    const next = items.map((it, idx) => (idx === i ? { ...it, [key]: key === "description" ? val : Number(val) } : it));
    setValues({ ...values, items: next });
  }
  function addItem() {
    setValues({ ...values, items: [...items, { description: "", qty: 1, price: 0 }] });
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
          <label>Payment Method</label>
          <select value={values.paymentMethod || "cash"} onChange={(e) => setValues({ ...values, paymentMethod: e.target.value })}>
            {PAYMENT.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ margin: "18px 0 8px", fontWeight: 600, fontSize: 13 }}>Line Items</div>
      <div className="line-item-row" style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px" }}>
        <span>Description</span><span>Qty</span><span>Price</span><span></span>
      </div>
      {items.map((it, i) => (
        <div className="line-item-row" key={i}>
          <input value={it.description} placeholder="Service / item" onChange={(e) => setItem(i, "description", e.target.value)} />
          <input type="number" min="0" value={it.qty} onChange={(e) => setItem(i, "qty", e.target.value)} />
          <input type="number" min="0" value={it.price} onChange={(e) => setItem(i, "price", e.target.value)} />
          <button type="button" className="act-btn danger" onClick={() => removeItem(i)}>🗑️</button>
        </div>
      ))}
      <button type="button" className="btn btn-sm" onClick={addItem} style={{ marginTop: 4 }}>＋ Add line</button>

      <div className="form-grid" style={{ marginTop: 18 }}>
        <div className="field">
          <label>Tax (₹)</label>
          <input type="number" min="0" value={values.tax ?? 0} onChange={(e) => setValues({ ...values, tax: Number(e.target.value) })} />
        </div>
        <div className="field">
          <label>Discount (₹)</label>
          <input type="number" min="0" value={values.discount ?? 0} onChange={(e) => setValues({ ...values, discount: Number(e.target.value) })} />
        </div>
        <div className="field">
          <label>Amount Paid (₹)</label>
          <input type="number" min="0" value={values.paid ?? 0} onChange={(e) => setValues({ ...values, paid: Number(e.target.value) })} />
        </div>
        <div className="field">
          <label>Total</label>
          <input value={money(total)} readOnly style={{ fontWeight: 700 }} />
        </div>
      </div>
    </div>
  );
}

export default function Billing() {
  const patients = useOptions("patients", (p) => ({ value: p._id, label: p.name }));
  const branches = useOptions("branches", (b) => ({ value: b._id, label: b.name }));

  return (
    <CrudPage
      title="Billing"
      subtitle="Create invoices and track patient payments."
      endpoint="invoices"
      singular="Invoice"
      statusOptions={[{ value: "paid", label: "Paid" }, { value: "partial", label: "Partial" }, { value: "unpaid", label: "Unpaid" }]}
      defaultValues={{ date: toDateInput(new Date()), paymentMethod: "cash", items: [{ description: "", qty: 1, price: 0 }], tax: 0, discount: 0, paid: 0 }}
      columns={[
        { key: "invoiceNo", header: "Invoice", render: (r) => <span className="cell-main">{r.invoiceNo}</span> },
        { key: "patient", header: "Patient", render: (r) => r.patient?.name || "—" },
        { key: "branch", header: "Branch", render: (r) => r.branch?.name || "—" },
        { key: "date", header: "Date", render: (r) => fmtDate(r.date) },
        { key: "total", header: "Total", render: (r) => money(r.total) },
        { key: "paid", header: "Paid", render: (r) => money(r.paid) },
        { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
      ]}
      fields={[]}
      wideForm
      renderForm={({ values, setValues }) => (
        <InvoiceForm values={values} setValues={setValues} patients={patients} branches={branches} />
      )}
      toForm={(r) => ({
        patient: r.patient?._id || "",
        branch: r.branch?._id || "",
        date: toDateInput(r.date),
        paymentMethod: r.paymentMethod,
        items: r.items?.length ? r.items.map((it) => ({ description: it.description, qty: it.qty, price: it.price })) : [{ description: "", qty: 1, price: 0 }],
        tax: r.tax,
        discount: r.discount,
        paid: r.paid,
      })}
      toPayload={(v) => ({
        patient: v.patient,
        branch: v.branch || null,
        date: v.date,
        paymentMethod: v.paymentMethod,
        items: (v.items || []).filter((it) => it.description),
        tax: Number(v.tax) || 0,
        discount: Number(v.discount) || 0,
        paid: Number(v.paid) || 0,
      })}
      renderView={(r) => (
        <div>
          <DetailGrid>
            <DetailItem label="Invoice No" value={r.invoiceNo} />
            <DetailItem label="Patient" value={r.patient?.name} />
            <DetailItem label="Branch" value={r.branch?.name} />
            <DetailItem label="Date" value={fmtDate(r.date)} />
            <DetailItem label="Payment Method" value={<span style={{ textTransform: "capitalize" }}>{r.paymentMethod}</span>} />
            <DetailItem label="Status" value={<Badge value={r.status} />} />
          </DetailGrid>
          <table className="invoice-items">
            <thead>
              <tr><th>Description</th><th>Qty</th><th>Price</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {(r.items || []).map((it, i) => (
                <tr key={i}>
                  <td>{it.description}</td>
                  <td>{it.qty}</td>
                  <td>{money(it.price)}</td>
                  <td>{money(it.qty * it.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16, marginLeft: "auto", width: 260 }}>
            <div className="b-top" style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>Subtotal</span><span>{money(r.subtotal)}</span></div>
            <div className="b-top" style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>Tax</span><span>{money(r.tax)}</span></div>
            <div className="b-top" style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>Discount</span><span>- {money(r.discount)}</span></div>
            <div className="b-top" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontWeight: 700, borderTop: "1px solid var(--line)" }}><span>Total</span><span>{money(r.total)}</span></div>
            <div className="b-top" style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>Paid</span><span>{money(r.paid)}</span></div>
            <div className="b-top" style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", color: "var(--coral)" }}><span>Balance</span><span>{money(r.total - r.paid)}</span></div>
          </div>
        </div>
      )}
    />
  );
}
