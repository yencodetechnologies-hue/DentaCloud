import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiError } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

function Counter({ value, prefix = "" }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const target = Number(value) || 0;
    const dur = 1000;
    const start = performance.now();
    cancelAnimationFrame(ref.current);
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.floor(eased * target));
      if (p < 1) ref.current = requestAnimationFrame(step);
    }
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);
  return <>{prefix}{display.toLocaleString("en-IN")}</>;
}

const SPARKS = [
  [40, 70, 55, 90, 65, 100, 80],
  [50, 60, 45, 75, 95, 70, 88],
  [60, 40, 80, 35, 65, 50, 72],
  [30, 55, 20, 45, 25, 38, 22],
];

function fmtTime(d) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard")
      .then(({ data }) => setData(data))
      .catch((err) => toast.error(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const maxRevenue = Math.max(1, ...(data?.branchwise || []).map((b) => b.revenue));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (user?.name || "Admin").split(" ")[0];

  const cards = [
    { icon: "📅", bg: "#E3FBF6", trend: "▲ 12%", up: true, value: stats.todayAppointments, label: "Today's Appointments" },
    { icon: "💳", bg: "#FFF3E3", trend: "▲ 8.4%", up: true, value: stats.todayRevenue, prefix: "₹", label: "Revenue Today" },
    { icon: "🦷", bg: "#EAE8FF", trend: "▲ 4", up: true, value: stats.pendingTreatments, label: "Pending Treatments" },
    { icon: "👥", bg: "#E3FBF6", trend: "▲ 6%", up: true, value: stats.patients, label: "Total Patients" },
  ];

  return (
    <div className="fade-up">
      <div className="section-head">
        <div>
          <h2>{greeting}, {firstName} 👋</h2>
          <p>Here's what's happening across all branches today, {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.</p>
        </div>
      </div>

      <div className="stat-grid">
        {cards.map((c, i) => (
          <div className="stat-card" key={i}>
            <div className="top-row">
              <div className="ic" style={{ background: c.bg }}>{c.icon}</div>
              <span className={`trend ${c.up ? "up" : "down"}`}>{c.trend}</span>
            </div>
            <div className="num">
              {loading ? "—" : <Counter value={c.value} prefix={c.prefix || ""} />}
            </div>
            <div className="lbl">{c.label}</div>
            <div className="spark">
              {SPARKS[i].map((h, j) => (
                <i key={j} style={{ height: `${h}%`, animationDelay: `${0.1 + j * 0.05}s` }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <h3>Upcoming Appointments</h3>
            <span className="link-btn" onClick={() => navigate("/appointments")}>View all →</span>
          </div>
          {loading ? (
            <div className="table-loading">Loading…</div>
          ) : (data.upcoming || []).length === 0 ? (
            <div className="empty-state"><div className="big">📅</div>No upcoming appointments</div>
          ) : (
            data.upcoming.map((a) => (
              <div className="row-item" key={a._id}>
                <div className="av">{(a.patient?.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("")}</div>
                <div className="info">
                  <div className="nm">{a.patient?.name} — {a.treatment || "Consultation"}</div>
                  <div className="sub">{a.doctor?.name} · {a.branch?.name}</div>
                </div>
                <span className={`status-dot ${a.status === "confirmed" || a.status === "completed" ? "green" : "amber"}`}></span>
                <div className="time">{a.time || fmtTime(a.date)}</div>
              </div>
            ))
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Branch-wise Today</h3>
            <span className="link-btn" onClick={() => navigate("/branches")}>All branches →</span>
          </div>
          <div className="branch-bar-list">
            {loading ? (
              <div className="table-loading">Loading…</div>
            ) : (
              (data.branchwise || []).map((b) => (
                <div className="b-row" key={b.id}>
                  <div className="b-top">
                    <span>{b.name}</span>
                    <span>{b.appts} appts · ₹{b.revenue.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.round((b.revenue / maxRevenue) * 100)}%` }}></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Quick Stats</h3>
        </div>
        <div className="stat-grid" style={{ marginBottom: 0 }}>
          <div className="row-item"><div className="av">🏢</div><div className="info"><div className="nm">{loading ? "—" : stats.branches}</div><div className="sub">Branches</div></div></div>
          <div className="row-item"><div className="av">👨‍⚕️</div><div className="info"><div className="nm">{loading ? "—" : stats.doctors}</div><div className="sub">Doctors</div></div></div>
          <div className="row-item"><div className="av">🧑‍💼</div><div className="info"><div className="nm">{loading ? "—" : stats.staff}</div><div className="sub">Staff Members</div></div></div>
          <div className="row-item"><div className="av">👥</div><div className="info"><div className="nm">{loading ? "—" : stats.patients}</div><div className="sub">Patients</div></div></div>
        </div>
      </div>
    </div>
  );
}
