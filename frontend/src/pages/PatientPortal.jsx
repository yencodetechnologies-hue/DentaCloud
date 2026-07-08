import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";

export default function PatientPortal() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.linkedRef) {
      setLoading(false);
      return;
    }
    Promise.all([
      api.get(`/patients/${user.linkedRef}`),
      api.get("/appointments", { params: { limit: 10, patient: user.linkedRef } }),
    ])
      .then(([pRes, aRes]) => {
        setPatient(pRes.data);
        setAppointments(aRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="table-loading">Loading…</div>;

  if (!user?.linkedRef) {
    return (
      <div className="empty-state">
        <div className="big">🩺</div>
        <p>Your patient profile is not linked yet. Contact the clinic admin.</p>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="section-head">
        <div>
          <h2>My Records</h2>
          <p>Welcome, {patient?.name || user.name}</p>
        </div>
      </div>
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h3>Patient Info</h3></div>
        <div className="stat-grid" style={{ marginBottom: 0 }}>
          <div className="row-item"><div className="av">🆔</div><div className="info"><div className="nm">{patient?.patientId}</div><div className="sub">Patient ID</div></div></div>
          <div className="row-item"><div className="av">📞</div><div className="info"><div className="nm">{patient?.phone}</div><div className="sub">Phone</div></div></div>
          <div className="row-item"><div className="av">✉️</div><div className="info"><div className="nm">{patient?.email || "—"}</div><div className="sub">Email</div></div></div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><h3>Recent Appointments</h3></div>
        {appointments.length === 0 ? (
          <div className="empty-state"><div className="big">📅</div>No appointments</div>
        ) : (
          appointments.map((a) => (
            <div className="row-item" key={a._id}>
              <div className="av">📅</div>
              <div className="info">
                <div className="nm">{a.treatment || "Consultation"}</div>
                <div className="sub">{a.doctor?.name} · {new Date(a.date).toLocaleDateString("en-IN")}</div>
              </div>
              <div className="time">{a.status}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
