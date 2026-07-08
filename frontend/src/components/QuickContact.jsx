import { useState } from "react";
import api, { apiError } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import Modal from "./Modal.jsx";

export default function QuickContact({ phone, patientId, patientName }) {
  const toast = useToast();
  const [logOpen, setLogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("answered");

  if (!phone) return <>—</>;
  const digits = phone.replace(/[^\d+]/g, "");
  const btnStyle = { marginLeft: 6, textDecoration: "none", cursor: "pointer", border: "none", background: "none" };

  async function saveLog() {
    if (!notes.trim()) {
      toast.error("Please enter what was discussed");
      return;
    }
    setSaving(true);
    try {
      await api.post("/call-logs", {
        contact: phone,
        patient: patientId || null,
        notes,
        outcome,
      });
      toast.success("Call logged");
      setLogOpen(false);
      setNotes("");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <span onClick={(e) => e.stopPropagation()}>
      {phone}
      <a href={`tel:${digits}`} title="Call" style={btnStyle}>📞</a>
      <a href={`https://wa.me/${digits.replace("+", "")}`} title="WhatsApp" target="_blank" rel="noreferrer" style={btnStyle}>💬</a>
      <button type="button" title="Log call" style={btnStyle} onClick={() => setLogOpen(true)}>📝</button>
      {logOpen && (
        <Modal title={`Log call${patientName ? ` — ${patientName}` : ""}`} onClose={() => setLogOpen(false)}>
          <div className="form-grid">
            <div className="field">
              <label>Outcome</label>
              <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                <option value="answered">Answered</option>
                <option value="missed">Missed</option>
                <option value="callback">Callback</option>
                <option value="voicemail">Voicemail</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="field full">
              <label>What was discussed <span className="req">*</span></label>
              <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter call notes…" />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={() => setLogOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={saveLog} disabled={saving}>{saving ? "Saving…" : "Save log"}</button>
          </div>
        </Modal>
      )}
    </span>
  );
}
