import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiError } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import useUserBranch from "../hooks/useUserBranch.js";
import useOptions from "../hooks/useOptions.js";

function Counter({ value, prefix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = Number(value) || 0;
    const dur = 1000;
    const start = performance.now();
    let frame;
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.floor(eased * target));
      if (p < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{prefix}{display.toLocaleString("en-IN")}</>;
}

const SPARKS = [
  [40, 70, 55, 90, 65, 100, 80],
  [50, 60, 45, 75, 95, 70, 88],
  [60, 40, 80, 35, 65, 50, 72],
  [30, 55, 20, 45, 25, 38, 22],
  [45, 65, 50, 70, 60, 80, 55],
  [35, 50, 30, 60, 40, 55, 45],
  [55, 45, 70, 60, 50, 65, 75],
  [40, 60, 50, 55, 45, 70, 60],
];

function fmtTime(d) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function Dashboard() {
  const { user } = useAuth();
  const { branchId } = useUserBranch();
  const toast = useToast();
  const navigate = useNavigate();
  const enterprises = useOptions("enterprises", (e) => ({ value: e._id, label: e.name }));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enterpriseFilter, setEnterpriseFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/dashboard", {
        params: {
          branch: branchId || undefined,
          enterprise: enterpriseFilter || undefined,
        },
      })
      .then(({ data }) => setData(data))
      .catch((err) => toast.error(apiError(err)))
      .finally(() => setLoading(false));
  }, [branchId, enterpriseFilter, toast]);

  const stats = data?.stats || {};
  const maxRevenue = Math.max(1, ...(data?.branchwise || []).map((b) => b.revenue));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (user?.name || "Admin").split(" ")[0];

  const cards = [
    { icon: "📅", bg: "#E3FBF6", trend: "", up: true, value: stats.todayAppointments, label: "Today's Appointments" },
    { icon: "💳", bg: "#FFF3E3", trend: "", up: true, value: stats.feesCollection ?? stats.todayRevenue, prefix: "₹", label: "Fees Collection Today" },
    { icon: "📈", bg: "#EAE8FF", trend: "", up: true, value: stats.projectedRevenue, prefix: "₹", label: "Projected Revenue" },
    { icon: "💼", bg: "#E3FBF6", trend: "", up: true, value: stats.workingCapital, prefix: "₹", label: "Working Capital" },
    { icon: "🔧", bg: "#FFEDEB", trend: "", up: false, value: stats.repairMaintenance, prefix: "₹", label: "Repair & Maintenance" },
    { icon: "🕒", bg: "#FFF3E3", trend: "", up: true, value: stats.staffPresent, label: "Staff Present" },
    { icon: "🦷", bg: "#EAE8FF", trend: "", up: true, value: stats.pendingTreatments, label: "Pending Treatments" },
    { icon: "🔁", bg: "#E3FBF6", trend: "", up: true, value: stats.followUpsUpcoming, label: "Follow-up Patients" },
  ];

  return (
    <div className="fade-up">
      <div className="section-head">
        <div>
          <h2>{greeting}, {firstName} 👋</h2>
          <p>Clinic-wise overview for {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.</p>
        </div>
        {user?.accountType === "enterprise" && (
          <div style={{ display: "flex", gap: 8 }}>
            <select className="select" value={enterpriseFilter} onChange={(e) => setEnterpriseFilter(e.target.value)}>
              <option value="">All Enterprises</option>
              {enterprises.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="stat-grid">
        {cards.map((c, i) => (
          <div className="stat-card" key={i}>
            <div className="top-row">
              <div className="ic" style={{ background: c.bg }}>{c.icon}</div>
            </div>
            <div className="num">
              {loading ? "—" : <Counter value={c.value} prefix={c.prefix || ""} />}
            </div>
            <div className="lbl">{c.label}</div>
            <div className="spark">
              {SPARKS[i % SPARKS.length].map((h, j) => (
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
          ) : (data?.upcoming || []).length === 0 ? (
            <div className="empty-state"><div className="big">📅</div>No upcoming appointments</div>
          ) : (
            data.upcoming.map((a) => (
              <div className="row-item" key={a._id}>
                <div className="av">{(a.patient?.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("")}</div>
                <div className="info">
                  <div className="nm">{a.patient?.name} — {a.treatment || "Consultation"}</div>
                  <div className="sub">{a.doctor?.name} · {a.branch?.name}</div>
                </div>
                {a.patient?.phone && (
                  <a href={`tel:${a.patient.phone.replace(/[^\d+]/g, "")}`} className="icon-btn" title="Call patient" onClick={(e) => e.stopPropagation()}>📞</a>
                )}
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
              (data?.branchwise || []).map((b) => (
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
        <div className="panel-head"><h3>Quick Stats</h3></div>
        <div className="stat-grid" style={{ marginBottom: 0 }}>
          <div className="row-item"><div className="av">🏢</div><div className="info"><div className="nm">{loading ? "—" : stats.branches}</div><div className="sub">Branches</div></div></div>
          <div className="row-item"><div className="av">👨‍⚕️</div><div className="info"><div className="nm">{loading ? "—" : stats.doctors}</div><div className="sub">Doctors</div></div></div>
          <div className="row-item"><div className="av">🧑‍💼</div><div className="info"><div className="nm">{loading ? "—" : stats.staff}</div><div className="sub">Staff Members</div></div></div>
          <div className="row-item"><div className="av">👥</div><div className="info"><div className="nm">{loading ? "—" : stats.patients}</div><div className="sub">Patients</div></div></div>
          <div className="row-item"><div className="av">💰</div><div className="info"><div className="nm">{loading ? "—" : `₹${(stats.fixedCosts || 0).toLocaleString("en-IN")}`}</div><div className="sub">Fixed Costs (active)</div></div></div>
        </div>
      </div>
    </div>
  );
}
