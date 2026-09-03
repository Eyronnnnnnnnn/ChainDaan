import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { MailIcon, MapPinIcon, PackageIcon, PhoneIcon, StoreIcon, UserIcon } from "../components/Icons.jsx";

const benefits = [
  "Access 500+ verified local suppliers",
  "Secure & transparent transactions",
  "Real-time order tracking",
  "Free to join for all businesses",
];

function GoogleLogo() {
  return (
    <svg className="social-logo" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.22a4.46 4.46 0 0 1-1.94 2.92v2.41h3.14c1.84-1.69 2.93-4.18 2.93-7.36Z" />
      <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.41c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.49A9.75 9.75 0 0 0 12 21.75Z" />
      <path fill="#FBBC05" d="M6.53 13.88A5.86 5.86 0 0 1 6.22 12c0-.65.11-1.29.31-1.88V7.63H3.29A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.04 4.37l3.24-2.49Z" />
      <path fill="#EA4335" d="M12 6.09c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.18 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.71 5.38l3.24 2.49c.77-2.31 2.93-4.03 5.47-4.03Z" />
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg className="social-logo" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#1877F2" />
      <path fill="#fff" d="M13.35 19v-6h2.02l.3-2.34h-2.32V9.17c0-.68.19-1.14 1.17-1.14h1.25V5.94c-.22-.03-.98-.1-1.87-.1-1.85 0-3.12 1.13-3.12 3.2v1.62H8.69V13h2.09v6h2.57Z" />
    </svg>
  );
}

function SocialButtons({ onProvider }) {
  return (
    <div className="social-buttons">
      <button type="button" onClick={() => onProvider("Google")}><GoogleLogo /> Continue with Google</button>
      <button type="button" onClick={() => onProvider("Facebook")}><FacebookLogo /> Continue with Facebook</button>
    </div>
  );
}

function AuthHeader() {
  return (
    <header className="auth-header">
      <a className="auth-brand" href="/" aria-label="Chain Daan home">
        <img src="/images/logo.png" alt="Chain Daan" />
        <span>Chain Daan</span>
      </a>
      <nav aria-label="Authentication navigation">
        <a href="/">Home</a>
        <a href="/login">Sign in</a>
        <a className="auth-header-action" href="/register">Create account</a>
      </nav>
    </header>
  );
}

function AuthFooter() {
  return (
    <footer className="auth-footer">
      <span>© 2026 Chain Daan</span>
      <span>Connect with trusted local businesses</span>
      <span className="auth-legal-links"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a></span>
      <a href="mailto:aaronguillermo.dev@gmail.com">Contact developer</a>
    </footer>
  );
}

function Field({ label, placeholder, type = "text", icon, name, value, onChange }) {
  return (
    <label className="register-field">
      <span>{label} *</span>
      <div className="register-input-wrap">
        {icon && <span className="field-icon">{icon}</span>}
        <input name={name} type={type} placeholder={placeholder} value={value} onChange={onChange} required />
        {type === "password" && <span className="field-icon" aria-hidden="true">●</span>}
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
  const [socialMessage, setSocialMessage] = useState("");
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
  function continueWith(provider) {
    setSocialMessage(`${provider} sign-up needs OAuth credentials to be configured first.`);
  }

  return (
    <div className="auth-shell">
      <AuthHeader />
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
            <UserIcon size={15} /> I&apos;m a Business
          </button>
          <button className={!isBusiness ? "selected" : ""} onClick={() => setRole("supplier")} type="button">
            <StoreIcon size={15} /> I&apos;m a Supplier
          </button>
        </div>
        <form className="register-form" onSubmit={register}>
          <div className="field-grid">
            <Field name="fullName" value={form.fullName} onChange={update} label="FULL NAME" placeholder="Juan dela Cruz" />
            <Field name="name" value={form.name} onChange={update} label={`${isBusiness ? "BUSINESS" : "SUPPLIER"} NAME`} placeholder="My Business Name" />
            <Field name="email" value={form.email} onChange={update} label="EMAIL ADDRESS" placeholder="you@business.com" type="email" icon={<MailIcon size={14} />} />
            <Field name="phone" value={form.phone} onChange={update} label="PHONE NUMBER" placeholder="09XX-XXX-XXXX" type="tel" icon={<PhoneIcon size={14} />} />
            <Field name="town" value={form.town} onChange={update} label="MUNICIPALITY" placeholder="Select municipality..." icon={<MapPinIcon size={14} />} />
            {!isBusiness && <Field name="category" value={form.category} onChange={update} label="PRODUCT CATEGORY" placeholder="Select category..." icon={<PackageIcon size={14} />} />}
            <Field name="password" value={form.password} onChange={update} label="PASSWORD" placeholder="Min. 8 characters" type="password" icon={<UserIcon size={14} />} />
            <Field name="confirmPassword" value={form.confirmPassword} onChange={update} label="CONFIRM PASSWORD" placeholder="Re-enter password" type="password" icon={<UserIcon size={14} />} />
          </div>
          <label className="terms-check">
            <input type="checkbox" required />
            <span>I agree to Chain Daan&apos;s <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a></span>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="create-account" type="submit" disabled={saving}>
            {saving ? "Saving account..." : `Create ${isBusiness ? "Business" : "Supplier"} Account`}
          </button>
        </form>
        <div className="continue-divider"><span>or continue with</span></div>
        <SocialButtons onProvider={continueWith} />
        {socialMessage && <p className="social-message" role="status">{socialMessage}</p>}
        <p className="sign-in">Already have an account? <a href="/login">Sign in</a></p>
      </section>
      </main>
      <AuthFooter />
    </div>
  );
}

export function SignIn() {
  const navigate = useNavigate();
  const [role, setRole] = useState("business");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [socialMessage, setSocialMessage] = useState("");
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
  function continueWith(provider) {
    setSocialMessage(`${provider} sign-in needs OAuth credentials to be configured first.`);
  }
  return (
    <div className="auth-shell">
      <AuthHeader />
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
          <Field name="email" value={form.email} onChange={update} label="EMAIL ADDRESS" placeholder="you@business.com" type="email" icon={<MailIcon size={14} />} />
          <Field name="password" value={form.password} onChange={update} label="PASSWORD" placeholder="••••••••" type="password" icon={<UserIcon size={14} />} />
          <div className="login-options">
            <label><input type="checkbox" /> Remember me</label>
            <a href="#forgot-password">Forgot password?</a>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="sign-in-button" type="submit" disabled={saving}>{saving ? "Signing in..." : "Sign In to Dashboard"}</button>
        </form>
        <div className="continue-divider"><span>or continue with</span></div>
        <SocialButtons onProvider={continueWith} />
        {socialMessage && <p className="social-message" role="status">{socialMessage}</p>}
        <p className="sign-in register-prompt">Don&apos;t have an account? <a href="/register">Create one free</a></p>
      </section>
      </main>
      <AuthFooter />
    </div>
  );
}
