import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiError } from "../api/client.js";

const ACCOUNT_TYPES = [
  {
    id: "clinic",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2C9.5 2 8 3.2 6.5 3.2C4.5 3.2 3 5 3 7.8C3 10.5 4 13 4.6 16C5.1 18.5 5.6 21 7.2 21C8.7 21 8.8 18 9.5 15.5C10 13.7 10.6 12.5 12 12.5C13.4 12.5 14 13.7 14.5 15.5C15.2 18 15.3 21 16.8 21C18.4 21 18.9 18.5 19.4 16C20 13 21 10.5 21 7.8C21 5 19.5 3.2 17.5 3.2C16 3.2 14.5 2 12 2Z" />
      </svg>
    ),
    label: "Clinic",
    desc: "Solo practice",
    perks: ["Patient records", "Appointments", "Billing"],
  },
  {
    id: "enterprise",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M3 12h18M8 16h.01M12 16h.01M16 16h.01" />
      </svg>
    ),
    label: "Enterprise",
    desc: "Multi-branch",
    perks: ["All clinic features", "Branch analytics", "Central admin"],
    disabled: true,
  },
];

function AuthHero() {
  return (
    <div className="login-hero">
      <div className="hero-grid" aria-hidden="true" />
      <div className="login-brand">
        <div className="tooth-mark">
          <span className="pulse"></span>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2C9.5 2 8 3.2 6.5 3.2C4.5 3.2 3 5 3 7.8C3 10.5 4 13 4.6 16C5.1 18.5 5.6 21 7.2 21C8.7 21 8.8 18 9.5 15.5C10 13.7 10.6 12.5 12 12.5C13.4 12.5 14 13.7 14.5 15.5C15.2 18 15.3 21 16.8 21C18.4 21 18.9 18.5 19.4 16C20 13 21 10.5 21 7.8C21 5 19.5 3.2 17.5 3.2C16 3.2 14.5 2 12 2Z" fill="#1E90FF" />
          </svg>
        </div>
        <div>
          <div className="name">Denta Cloud</div>
          <div className="sub">CLINIC OS · v3.2</div>
        </div>
      </div>

      <div className="login-hero-mid">
        <span className="hero-eyebrow">Trusted by 500+ dental clinics</span>
        <h1>Run every branch of your dental practice from one place.</h1>
        <p>Appointments, patients, doctors, billing and inventory — beautifully unified across all your clinics.</p>
        <div className="hero-features">
          <span className="hero-feature-pill">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8l3 3 7-7" /></svg>
            HIPAA-ready security
          </span>
          <span className="hero-feature-pill">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8l3 3 7-7" /></svg>
            Real-time sync
          </span>
          <span className="hero-feature-pill">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8l3 3 7-7" /></svg>
            24/7 cloud access
          </span>
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><div className="n">4</div><div className="l">Branches</div></div>
          <div className="hero-stat"><div className="n">12k+</div><div className="l">Patients</div></div>
          <div className="hero-stat"><div className="n">99.9%</div><div className="l">Uptime</div></div>
        </div>
      </div>

      <div className="login-foot">© 2026 Denta Cloud · Multi-Branch Clinic Management</div>
    </div>
  );
}

function MobileBrand() {
  return (
    <div className="auth-mobile-brand">
      <div className="tooth-mark">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 2C9.5 2 8 3.2 6.5 3.2C4.5 3.2 3 5 3 7.8C3 10.5 4 13 4.6 16C5.1 18.5 5.6 21 7.2 21C8.7 21 8.8 18 9.5 15.5C10 13.7 10.6 12.5 12 12.5C13.4 12.5 14 13.7 14.5 15.5C15.2 18 15.3 21 16.8 21C18.4 21 18.9 18.5 19.4 16C20 13 21 10.5 21 7.8C21 5 19.5 3.2 17.5 3.2C16 3.2 14.5 2 12 2Z" fill="#1E90FF" />
        </svg>
      </div>
      <span className="auth-mobile-brand-name">Denta Cloud</span>
    </div>
  );
}

function AccountTypeSelector({ accountType, onSelect }) {
  return (
    <div className="account-type-select">
      {ACCOUNT_TYPES.map((t) => (
        <div
          key={t.id}
          className={`account-type-opt ${accountType === t.id ? "active" : ""} ${t.disabled ? "disabled" : ""}`}
          onClick={() => !t.disabled && onSelect(t.id)}
          role="button"
          tabIndex={t.disabled ? -1 : 0}
          onKeyDown={(e) => e.key === "Enter" && !t.disabled && onSelect(t.id)}
        >
          {t.disabled && <span className="coming-soon-badge">Coming soon</span>}
          {accountType === t.id && !t.disabled && (
            <span className="account-type-check">
              <svg viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          )}
          <div className="account-type-icon">{t.icon}</div>
          <div className="rl">{t.label}</div>
          <div className="rd">{t.desc}</div>
          <ul className="account-type-perks">
            {t.perks.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function FieldIcon({ children }) {
  return <span className="field-icon" aria-hidden="true">{children}</span>;
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const score =
    (password.length >= 6 ? 1 : 0) +
    (password.length >= 10 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
  const level = score <= 1 ? "weak" : score <= 3 ? "fair" : "strong";
  const labels = { weak: "Weak", fair: "Good", strong: "Strong" };

  return (
    <div className="password-strength">
      <div className="password-strength-bars">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`bar ${score >= i * 2 - 1 ? level : ""}`} />
        ))}
      </div>
      <span className={`password-strength-label ${level}`}>{labels[level]}</span>
    </div>
  );
}

function IconInput({ icon, type = "text", ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`icon-input-wrap ${isPassword ? "has-password-toggle" : ""}`}>
      <FieldIcon>{icon}</FieldIcon>
      <input type={inputType} {...props} />
      {isPassword && (
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2.5 10s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5z" />
              <circle cx="10" cy="10" r="2.2" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2.5 10s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5z" />
              <circle cx="10" cy="10" r="2.2" />
              <path d="M3 17L17 3" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

function SubmitButton({ loading, loadingText, children, disabled }) {
  return (
    <button className="btn btn-primary login-submit" type="submit" disabled={loading || disabled}>
      {loading ? (
        <span className="btn-loading">
          <span className="spinner" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function RegisterForm({
  clinicName,
  setClinicName,
  address,
  setAddress,
  email,
  setEmail,
  phone,
  setPhone,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  error,
  loading,
  onSubmit,
}) {
  return (
    <form className="login-form register-form" onSubmit={onSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="field">
        <label>Clinic name <span className="req">*</span></label>
        <IconInput
          icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 17V7l7-4 7 4v10" /><path d="M7 17v-5h6v5" /></svg>}
          type="text"
          value={clinicName}
          onChange={(e) => setClinicName(e.target.value)}
          placeholder="Smile Dental Clinic"
          required
        />
      </div>

      <div className="field">
        <label>Address <span className="req">*</span></label>
        <div className="icon-textarea-wrap">
          <FieldIcon>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M10 18s-6-5.2-6-9a6 6 0 1 1 12 0c0 3.8-6 9-6 9z" />
              <circle cx="10" cy="9" r="2" />
            </svg>
          </FieldIcon>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, city, state, PIN"
            rows={2}
            required
          />
        </div>
      </div>

      <div className="register-fields-grid">
        <div className="field">
          <label>Email <span className="req">*</span></label>
          <IconInput
            icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="4" width="16" height="12" rx="2" /><path d="M2 6l8 5 8-5" /></svg>}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@clinic.com"
            required
          />
        </div>
        <div className="field">
          <label>Mobile number <span className="req">*</span></label>
          <IconInput
            icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="2" width="10" height="16" rx="2" /><path d="M9 15h2" /></svg>}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            required
          />
        </div>
      </div>

      <div className="register-fields-grid">
        <div className="field">
          <label>Password <span className="req">*</span></label>
          <IconInput
            icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="9" width="12" height="8" rx="1.5" /><path d="M7 9V6a3 3 0 0 1 6 0v3" /></svg>}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            required
          />
          <PasswordStrength password={password} />
        </div>
        <div className="field">
          <label>Confirm password <span className="req">*</span></label>
          <IconInput
            icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 10l4 4 8-8" /></svg>}
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
          />
          {confirmPassword && password !== confirmPassword && (
            <span className="field-inline-error">Passwords don&apos;t match</span>
          )}
        </div>
      </div>

      <button
        className="btn btn-primary login-submit"
        type="submit"
        disabled={loading || (confirmPassword && password !== confirmPassword)}
      >
        {loading ? (
          <span className="btn-loading">
            <span className="spinner" />
            Creating account...
          </span>
        ) : (
          <>Create account <span className="btn-arrow">✓</span></>
        )}
      </button>

      <div className="register-trust">
        <div className="register-trust-item">
          <span className="trust-ic">🔒</span>
          <span>Secure & encrypted</span>
        </div>
        <div className="register-trust-item">
          <span className="trust-ic">⚡</span>
          <span>Setup in 2 minutes</span>
        </div>
      </div>
    </form>
  );
}

export default function AuthPage({ initialMode = "login" }) {
  const navigate = useNavigate();
  const { login, register, forgotPassword } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [accountType, setAccountType] = useState("clinic");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  function switchMode(next) {
    setMode(next);
    setError("");
    setSuccess("");
  }

  async function handleLogin(e) {
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

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register({
        accountType: "clinic",
        clinicName,
        address,
        email,
        phone,
        password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await forgotPassword(email);
      setSuccess(data.message);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  const titles = {
    login: { h: "Welcome back", lead: "Sign in to your clinic account." },
    register: { h: "Create your account", lead: "Join thousands of dental practices on Denta Cloud." },
    forgot: { h: "Forgot password", lead: "Enter your email and we'll send a reset link." },
  };

  const { h, lead } = titles[mode];

  const panelClass = mode === "register" ? "register-mode" : mode === "login" ? "login-mode" : "forgot-mode";

  return (
    <div className={`login-page ${panelClass}`}>
      <AuthHero />

      <div className="login-panel">
        {(mode === "register" || mode === "login" || mode === "forgot") && <MobileBrand />}
        <div className={`login-card auth-card ${mode === "register" ? "register-card" : mode === "login" ? "signin-card" : "compact-card"}`}>
          <div className="auth-card-glow" aria-hidden="true" />

          <div className="login-card-header">
            {mode === "login" && (
              <span className="auth-badge">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" />
                  <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
                </svg>
                Secure sign in
              </span>
            )}
            <h2>{h}</h2>
            <p className="lead">{lead}</p>
          </div>

          {mode === "login" && (
            <>
              <AccountTypeSelector
                accountType={accountType}
                onSelect={(id) => {
                  setAccountType(id);
                  setError("");
                }}
              />
              <form className="login-form signin-form" onSubmit={handleLogin}>
                {error && <div className="form-error">{error}</div>}
                <div className="field">
                  <label>Email</label>
                  <IconInput
                    icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="4" width="16" height="12" rx="2" /><path d="M2 6l8 5 8-5" /></svg>}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@clinic.com"
                    required
                  />
                </div>
                <div className="field">
                  <label>Password</label>
                  <IconInput
                    icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="9" width="12" height="8" rx="1.5" /><path d="M7 9V6a3 3 0 0 1 6 0v3" /></svg>}
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="auth-link-row">
                  <label className="remember-me">
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="auth-text-link" onClick={() => switchMode("forgot")}>
                    Forgot password?
                  </button>
                </div>
                <SubmitButton loading={loading} loadingText="Signing in...">
                  Sign in <span className="btn-arrow">→</span>
                </SubmitButton>
                <div className="register-trust signin-trust">
                  <div className="register-trust-item">
                    <span className="trust-ic">🔒</span>
                    <span>256-bit encryption</span>
                  </div>
                  <div className="register-trust-item">
                    <span className="trust-ic">⚡</span>
                    <span>Instant access</span>
                  </div>
                </div>
              </form>
            </>
          )}

          {mode === "register" && (
            <RegisterForm
              clinicName={clinicName}
              setClinicName={setClinicName}
              address={address}
              setAddress={setAddress}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              error={error}
              loading={loading}
              onSubmit={handleRegister}
            />
          )}

          {mode === "forgot" && (
            <form className="login-form" onSubmit={handleForgot}>
              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}
              <div className="field">
                <label>Email</label>
                <IconInput
                  icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="4" width="16" height="12" rx="2" /><path d="M2 6l8 5 8-5" /></svg>}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@clinic.com"
                  required
                />
              </div>
              <SubmitButton loading={loading} loadingText="Sending...">
                Send reset link <span className="btn-arrow">→</span>
              </SubmitButton>
            </form>
          )}

          <div className="auth-footer-links">
            {mode === "login" && (
              <p>
                Don&apos;t have an account?{" "}
                <button type="button" className="auth-text-link" onClick={() => switchMode("register")}>
                  Create one
                </button>
              </p>
            )}
            {mode === "register" && (
              <p>
                Already have an account?{" "}
                <button type="button" className="auth-text-link" onClick={() => switchMode("login")}>
                  Sign in
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <p>
                <button type="button" className="auth-text-link" onClick={() => switchMode("login")}>
                  Back to sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  return <AuthPage initialMode="login" />;
}

export function RegisterPage() {
  return <AuthPage initialMode="register" />;
}

export function ForgotPasswordPage() {
  return <AuthPage initialMode="forgot" />;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!token) {
      setError("Invalid reset link");
      return;
    }
    setLoading(true);
    try {
      const data = await resetPassword(token, password);
      setSuccess(data.message);
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page forgot-mode">
      <AuthHero />
      <div className="login-panel">
        <MobileBrand />
        <div className="login-card auth-card compact-card">
          <div className="auth-card-glow" aria-hidden="true" />
          <div className="login-card-header">
            <h2>Reset password</h2>
            <p className="lead">Enter your new password below.</p>
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}
            <div className="field">
              <label>New password</label>
              <IconInput
                icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="9" width="12" height="8" rx="1.5" /><path d="M7 9V6a3 3 0 0 1 6 0v3" /></svg>}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <PasswordStrength password={password} />
            </div>
            <div className="field">
              <label>Confirm password</label>
              <IconInput
                icon={<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 10l4 4 8-8" /></svg>}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <span className="field-inline-error">Passwords don&apos;t match</span>
              )}
            </div>
            <SubmitButton loading={loading} loadingText="Updating..." disabled={!!success}>
              Update password <span className="btn-arrow">✓</span>
            </SubmitButton>
          </form>
          <div className="auth-footer-links">
            <p>
              <Link to="/login" className="auth-text-link">
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
