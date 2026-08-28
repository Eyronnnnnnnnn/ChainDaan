import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const benefits = [
  "Access 500+ verified local suppliers",
  "Secure & transparent transactions",
  "Real-time order tracking",
  "Free to join for all businesses",
];

function Field({ label, placeholder, type = "text", icon, name, value, onChange }) {
  return (
    <label className="register-field">
      <span>{label} *</span>
      <div className="register-input-wrap">
        {icon && <span className="field-icon">{icon}</span>}
        <input name={name} type={type} placeholder={placeholder} value={value} onChange={onChange} required />
        {type === "password" && <span className="field-icon">◉</span>}
      </div>
    </label>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("business");
  const [form, setForm] = useState({ fullName: "", name: "", email: "", phone: "", town: "", category: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isBusiness = role === "business";
  const update = (event) => { setForm({ ...form, [event.target.name]: event.target.value }); setError(""); };
  async function register(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, role }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration failed.");
      localStorage.setItem("chaindaan_token", data.token);
      localStorage.setItem("chaindaan_user", JSON.stringify(data.user));
      navigate(role === "business" ? "/business-dashboard" : "/supplier-dashboard");
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  }

  return (
    <main className="register-page">
      <section className="register-intro">
        <a className="register-mark" href="/" aria-label="Chain Daan home">
          <img src="/images/logo.png" alt="Chain Daan" />
        </a>
        <div className="intro-copy">
          <h1>
            Join the <strong>Chain Daan</strong>
            <br />
            community today.
          </h1>
          <p>
            Whether you are a local business owner or a supplier, Chain Daan gives you the
            tools to grow, connect, and succeed in Ilocos Norte.
          </p>
          <ul>
            {benefits.map((benefit) => (
              <li key={benefit}><span aria-hidden="true">✓</span>{benefit}</li>
            ))}
          </ul>
        </div>
        <div className="register-mascot" aria-label="Chain Daan business partners">
          <span>Place image here</span>
        </div>
      </section>

      <section className="register-panel">
        <a className="back-link" href="/">← &nbsp;Back to Home</a>
        <h2>Create Account</h2>
        <p className="register-subtitle">Join Chain Daan — it&apos;s free!</p>
        <div className="role-switch" role="tablist" aria-label="Account type">
          <button className={isBusiness ? "selected" : ""} onClick={() => setRole("business")} type="button">
            🏢 I&apos;m a Business
          </button>
          <button className={!isBusiness ? "selected" : ""} onClick={() => setRole("supplier")} type="button">
            🏪 I&apos;m a Supplier
          </button>
        </div>
        <form className="register-form" onSubmit={register}>
          <div className="field-grid">
            <Field name="fullName" value={form.fullName} onChange={update} label="FULL NAME" placeholder="Juan dela Cruz" />
            <Field name="name" value={form.name} onChange={update} label={`${isBusiness ? "BUSINESS" : "SUPPLIER"} NAME`} placeholder="My Business Name" />
            <Field name="email" value={form.email} onChange={update} label="EMAIL ADDRESS" placeholder="you@business.com" type="email" icon="✉" />
            <Field name="phone" value={form.phone} onChange={update} label="PHONE NUMBER" placeholder="09XX-XXX-XXXX" type="tel" icon="♧" />
            <Field name="town" value={form.town} onChange={update} label="MUNICIPALITY" placeholder="Select municipality..." icon="⌖" />
            {!isBusiness && <Field name="category" value={form.category} onChange={update} label="PRODUCT CATEGORY" placeholder="Select category..." icon="▤" />}
            <Field name="password" value={form.password} onChange={update} label="PASSWORD" placeholder="Min. 8 characters" type="password" icon="♧" />
            <Field name="confirmPassword" value={form.confirmPassword} onChange={update} label="CONFIRM PASSWORD" placeholder="Re-enter password" type="password" icon="♧" />
          </div>
          <label className="terms-check">
            <input type="checkbox" required />
            <span>I agree to Chain Daan&apos;s <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a></span>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="create-account" type="submit" disabled={saving}>
            {saving ? "Saving account..." : `Create ${isBusiness ? "Business" : "Supplier"} Account`}
          </button>
        </form>
        <p className="sign-in">Already have an account? <a href="/login">Sign in</a></p>
      </section>
    </main>
  );
}

export function SignIn() {
  const navigate = useNavigate();
  const [role, setRole] = useState("business");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (event) => { setForm({ ...form, [event.target.name]: event.target.value }); setError(""); };
  async function signIn(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, role }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed.");
      localStorage.setItem("chaindaan_token", data.token);
      localStorage.setItem("chaindaan_user", JSON.stringify(data.user));
      navigate(role === "business" ? "/business-dashboard" : "/supplier-dashboard");
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  }
  return (
    <main className="register-page login-page">
      <section className="register-intro login-intro">
        <a className="register-mark" href="/" aria-label="Chain Daan home">
          <img src="/images/logo.png" alt="Chain Daan" />
        </a>
        <div className="intro-copy">
          <h1>
            Your gateway to
            <br />
            <strong>Ilocos Norte&apos;s</strong>
            <br />
            best local suppliers.
          </h1>
          <p>Sign in to access your dashboard, manage orders, and connect with hundreds of verified suppliers.</p>
          <div className="login-stats">
            <div><b>500+</b><span>Businesses</span></div>
            <div><b>1000+</b><span>Products</span></div>
            <div><b>20+</b><span>Municipalities</span></div>
            <div><b>100%</b><span>Secure</span></div>
          </div>
        </div>
        <div className="register-mascot" aria-label="Chain Daan representative"><span>Place image here</span></div>
      </section>

      <section className="register-panel login-panel">
        <a className="back-link" href="/">← &nbsp;Back to Home</a>
        <h2>Welcome back!</h2>
        <p className="register-subtitle">Sign in to your Chain Daan account</p>
        <div className="login-role-switch" role="tablist" aria-label="Sign in as">
          <button className={role === "business" ? "selected" : ""} onClick={() => setRole("business")} type="button">Business owner</button>
          <button className={role === "supplier" ? "selected" : ""} onClick={() => setRole("supplier")} type="button">Supplier</button>
        </div>
        <form className="login-form" onSubmit={signIn}>
          <Field name="email" value={form.email} onChange={update} label="EMAIL ADDRESS" placeholder="you@business.com" type="email" icon="✉" />
          <Field name="password" value={form.password} onChange={update} label="PASSWORD" placeholder="••••••••" type="password" icon="♧" />
          <div className="login-options">
            <label><input type="checkbox" /> Remember me</label>
            <a href="#forgot-password">Forgot password?</a>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="sign-in-button" type="submit" disabled={saving}>{saving ? "Signing in..." : "Sign In to Dashboard"}</button>
        </form>
        <div className="continue-divider"><span>or continue with</span></div>
        <div className="social-buttons">
          <button type="button"><b className="google-dot">●</b> Google</button>
          <button type="button"><b className="facebook-dot">●</b> Facebook</button>
        </div>
        <p className="sign-in register-prompt">Don&apos;t have an account? <a href="/register">Create one free</a></p>
      </section>
    </main>
  );
}
