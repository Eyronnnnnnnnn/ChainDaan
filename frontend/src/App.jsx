import { lazy, Suspense, useEffect } from "react";
import { getCurrentUser } from "./lib/session.js";
import { routeRedirect } from "./lib/route-access.js";

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useTheme } from "./lib/theme.js";
import "./Theme.css";
import "./App.css";
import Login, { ForgotPassword, ResetPassword, SignIn } from "./pages/Login.jsx";
const SupplierDashboard = lazy(() => import("./pages/SupplierDashboard.jsx"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard.jsx"));
const BusinessProfile = lazy(() => import("./pages/BusinessProfile.jsx"));
const Legal = lazy(() => import("./pages/Legal.jsx"));
import Home from "./pages/Home.jsx";
const ProtectedRoute = ({ children, role }) => {
  const redirect = routeRedirect(localStorage.getItem("chaindaan_token"), getCurrentUser(), role);
  return redirect ? <Navigate to={redirect} replace /> : children;
};

function OAuthResult() {
  const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search);
  const token = params.get("oauthToken");
  const encodedUser = params.get("oauthUser");
  let user = null;
  if (token && encodedUser) {
    try {
      const base64 = encodedUser.replace(/-/g, "+").replace(/_/g, "/");
      const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")), (character) => character.charCodeAt(0));
      user = JSON.parse(new TextDecoder().decode(bytes));
      if (!user?._id || !["business", "supplier"].includes(user.role)) user = null;
    } catch {
      user = null;
    }
  }

  useEffect(() => {
    if (!token || !user) return;
    localStorage.setItem("chaindaan_token", token);
    localStorage.setItem("chaindaan_user", JSON.stringify(user));
    window.location.replace(user.role === "business" ? "/business-dashboard" : "/supplier-dashboard");
  }, [token, user]);

  const message = params.get("oauthError") || (token ? "Social sign-in returned invalid account data." : "Social sign-in could not be completed.");
  return <main className="oauth-result"><section className="register-panel"><h1>{user ? "Signing you in" : "Sign-in unsuccessful"}</h1><p role="status">{user ? "Completing social sign-in..." : message}</p>{!user && <a className="home-button" href="/login">Back to sign in</a>}</section></main>;
}

function ThemeControl() {
  const [dark, setDark] = useTheme();
  const { pathname } = useLocation();
  const dashboard = pathname.includes("dashboard");
  const home = !["/business-dashboard", "/supplier-dashboard", "/business-profile", "/privacy", "/terms"].includes(pathname);
  useEffect(() => { document.documentElement.classList.toggle("app-dark", dark && !home); }, [dark, home]);
  return dashboard || home ? null : <button className="app-theme-toggle" type="button" onClick={() => setDark(!dark)} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>{dark ? "Light mode" : "Dark mode"}</button>;
}

function App() {
  return (
    <Router>
      <ThemeControl />
      <Suspense fallback={<p role="status">Loading page...</p>}>
      <Routes>
        <Route path="/register" element={<Login />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth/callback" element={<OAuthResult />} />
        <Route path="/privacy" element={<Legal />} />
        <Route path="/terms" element={<Legal />} />
        <Route path="/supplier-dashboard" element={<ProtectedRoute role="supplier"><SupplierDashboard /></ProtectedRoute>} />
        <Route path="/business-dashboard" element={<ProtectedRoute role="business"><BusinessDashboard /></ProtectedRoute>} />
        <Route path="/business-profile" element={<ProtectedRoute role="business"><BusinessProfile /></ProtectedRoute>} />
        <Route path="*" element={<Home />} />
      </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
