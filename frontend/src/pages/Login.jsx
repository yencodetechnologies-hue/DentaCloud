import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiError } from "../api/client.js";

const ROLES = [
  { id: "dental-admin", emoji: "🛡️", label: "Admin", desc: "Full access", email: "admin@evident.com", password: "admin123" },
  { id: "doctor", emoji: "👨‍⚕️", label: "Doctor", desc: "Clinical", email: "doctor@evident.com", password: "doctor123" },
  { id: "staff", emoji: "🧑‍💼", label: "Staff", desc: "Front desk", email: "staff@evident.com", password: "staff123" },
  { id: "csa", emoji: "☎️", label: "CSA", desc: "Customer service", email: "csa@evident.com", password: "csa123" },
  { id: "housekeeping", emoji: "🧹", label: "Housekeeping", desc: "Facilities", email: "housekeeping@evident.com", password: "housekeeping123" },
  { id: "security", emoji: "🛡️", label: "Security", desc: "Premises", email: "security@evident.com", password: "security123" },
  { id: "patient", emoji: "🧑", label: "Patient", desc: "Self-service", email: "patient@evident.com", password: "patient123" },
  { id: "vendor", emoji: "🚚", label: "Vendor", desc: "Supplier portal", email: "vendor@evident.com", password: "vendor123" },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState(ROLES[0]);
  const [email, setEmail] = useState(ROLES[0].email);
  const [password, setPassword] = useState(ROLES[0].password);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function selectRole(r) {
    setRole(r);
    setEmail(r.email);
    setPassword(r.password);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="login-brand">
          <div className="tooth-mark">
            <span className="pulse"></span>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2C9.5 2 8 3.2 6.5 3.2C4.5 3.2 3 5 3 7.8C3 10.5 4 13 4.6 16C5.1 18.5 5.6 21 7.2 21C8.7 21 8.8 18 9.5 15.5C10 13.7 10.6 12.5 12 12.5C13.4 12.5 14 13.7 14.5 15.5C15.2 18 15.3 21 16.8 21C18.4 21 18.9 18.5 19.4 16C20 13 21 10.5 21 7.8C21 5 19.5 3.2 17.5 3.2C16 3.2 14.5 2 12 2Z" fill="#1E90FF" />
            </svg>
          </div>
          <div>
            <div className="name">Evident Dental</div>
            <div className="sub">CLINIC OS · v3.2</div>
          </div>
        </div>

        <div className="login-hero-mid">
          <h1>Run every branch of your dental practice from one place.</h1>
          <p>Appointments, patients, doctors, billing and inventory — beautifully unified across all your clinics.</p>
          <div className="hero-stats">
            <div className="hero-stat"><div className="n">4</div><div className="l">Branches</div></div>
            <div className="hero-stat"><div className="n">12k+</div><div className="l">Patients</div></div>
            <div className="hero-stat"><div className="n">99.9%</div><div className="l">Uptime</div></div>
          </div>
        </div>

        <div className="login-foot">© 2026 Evident Dental · Multi-Branch Clinic Management</div>
      </div>

      <div className="login-panel">
        <div className="login-card">
          <h2>Welcome back 👋</h2>
          <p className="lead">Select your role and sign in to continue.</p>

          <div className="role-select">
            {ROLES.map((r) => (
              <div
                key={r.id}
                className={`role-opt ${role.id === r.id ? "active" : ""}`}
                onClick={() => selectRole(r)}
              >
                <div className="emoji">{r.emoji}</div>
                <div className="rl">{r.label}</div>
                <div className="rd">{r.desc}</div>
              </div>
            ))}
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}
            <div className="field">
              <label>Email</label>
              <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@evident.com" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
              {loading ? "Signing in..." : `Sign in as ${role.label}`}
            </button>
          </form>

          <div className="login-hint">
            Demo credentials are pre-filled. Admin: <code>admin@evident.com</code> / <code>admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
