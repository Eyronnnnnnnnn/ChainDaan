import { useState } from "react";
import { profileApi } from "../api/client.js";
import { getCurrentUser, logout } from "../lib/session.js";
import ProfilePictureUpload from "../components/ProfilePictureUpload.jsx";
import Avatar from "../components/Avatar.jsx";
import {
  SunIcon,
  MoonIcon,
  VerifiedBadgeIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  UserIcon,
  LogOutIcon,
  CheckIcon,
} from "../components/Icons.jsx";
import "./SupplierDashboard.css";

export default function BusinessProfile() {
  const currentUser = getCurrentUser() || {};
  const [profile, setProfile] = useState(currentUser);
  const [status, setStatus] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const update = (field) => (event) => {
    setProfile({ ...profile, [field]: event.target.value });
    setStatus("");
  };

  async function save() {
    try {
      const updated = await profileApi.update(profile._id, profile);
      setProfile(updated);
      localStorage.setItem("chaindaan_user", JSON.stringify(updated));
      setStatus("saved");
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <main className={`dashboard-shell ${darkMode ? "dark-mode" : ""}`}>
      <aside className="dashboard-sidebar">
        <a href="/" className="dashboard-brand">
          <span className="brand-mark">CD</span>
          <span>Chain Daan</span>
        </a>
        <div className="supplier-mini">
          <Avatar user={profile} />
          <div>
            <b>{profile.name || profile.fullName || "Business"}</b>
            <span>Business account</span>
          </div>
        </div>
        <nav className="dashboard-nav">
          <a href="/business-dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", textDecoration: "none", color: "inherit" }}>
            <span className="dashboard-icon">←</span>Back to dashboard
          </a>
        </nav>
        <div className="sidebar-bottom">
          <button onClick={logout} className="logout-link" type="button">
            <span className="dashboard-icon"><LogOutIcon size={17} /></span>Log out
          </button>
        </div>
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-kicker">BUSINESS WORKSPACE</p>
            <h1>My Profile</h1>
          </div>
          <div className="topbar-actions">
            <button
              className="theme-toggle"
              onClick={() => setDarkMode((current) => !current)}
              type="button"
              aria-label="Toggle dark mode"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            </button>
            <div className="topbar-user">
              <Avatar user={profile} size="small" />
              <span>{profile.name || profile.fullName || "Business"}</span>
              <VerifiedBadgeIcon size={14} />
            </div>
          </div>
        </header>
        <div className="dashboard-content profile-content">
          <div className="welcome-row">
            <div>
              <h2>Edit your profile</h2>
              <p>Keep your business details and profile picture current for supplier conversations.</p>
            </div>
            <button
              className="primary-action"
              onClick={save}
              type="button"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {status === "saved" ? <><CheckIcon size={15} /> Saved</> : status || "Save changes"}
            </button>
          </div>
          <section className="dashboard-card profile-card">
            {/* Glassmorphism Profile Cover Banner with side contact meta */}
            <div className="profile-cover">
              <div className="profile-cover-content">
                <ProfilePictureUpload user={profile} onUpdated={setProfile} />
                <div className="profile-cover-meta">
                  <div className="profile-meta-header">
                    <h2 className="profile-cover-name">{profile.name || "Your Business Name"}</h2>
                    <VerifiedBadgeIcon size={20} />
                  </div>
                  {profile.fullName && (
                    <p className="profile-meta-fullname">
                      <UserIcon size={14} /> Contact Person: {profile.fullName}
                    </p>
                  )}
                  <div className="profile-meta-contact-row">
                    {profile.email && (
                      <span className="profile-meta-chip">
                        <MailIcon size={13} /> {profile.email}
                      </span>
                    )}
                    {profile.phone && (
                      <span className="profile-meta-chip">
                        <PhoneIcon size={13} /> {profile.phone}
                      </span>
                    )}
                    {profile.town && (
                      <span className="profile-meta-chip">
                        <MapPinIcon size={13} /> {profile.town}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="profile-fields">
              <label>
                FULL NAME
                <input
                  value={profile.fullName || ""}
                  onChange={update("fullName")}
                  placeholder="e.g. Maria Santos"
                />
              </label>
              <label>
                BUSINESS NAME *
                <input
                  value={profile.name || ""}
                  onChange={update("name")}
                  placeholder="e.g. North Coast Cafe & Grocery"
                  required
                />
              </label>
              <label>
                BUSINESS CATEGORY
                <select value={profile.category || "Restaurant & Food Service"} onChange={update("category")}>
                  <option value="Restaurant & Food Service">Restaurant & Food Service</option>
                  <option value="Retail & Sari-Sari Store">Retail & Sari-Sari Store</option>
                  <option value="Supermarket & Grocery">Supermarket & Grocery</option>
                  <option value="Hotel & Hospitality">Hotel & Hospitality</option>
                  <option value="Bakery & Cafe">Bakery & Cafe</option>
                  <option value="Wholesale & Trading">Wholesale & Trading</option>
                  <option value="General Merchandise">General Merchandise</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label>
                MUNICIPALITY / LOCATION *
                <input
                  value={profile.town || ""}
                  onChange={update("town")}
                  placeholder="e.g. Laoag City"
                  required
                />
              </label>
              <label>
                EMAIL ADDRESS *
                <input
                  type="email"
                  value={profile.email || ""}
                  onChange={update("email")}
                  placeholder="business@example.com"
                  required
                />
              </label>
              <label>
                PHONE NUMBER
                <input
                  value={profile.phone || ""}
                  onChange={update("phone")}
                  placeholder="0917-XXX-XXXX"
                />
              </label>
              <label className="full-field">
                DEFAULT DELIVERY ADDRESS
                <input
                  value={profile.deliveryInfo || ""}
                  onChange={update("deliveryInfo")}
                  placeholder="e.g. Door 2, Rizal St., Brgy 1, Laoag City"
                />
              </label>
              <label className="full-field">
                OPERATING / BUSINESS HOURS
                <input
                  value={profile.businessHours || ""}
                  onChange={update("businessHours")}
                  placeholder="e.g. Mon - Sun: 7:00 AM - 9:00 PM"
                />
              </label>
              <label className="full-field">
                ABOUT YOUR BUSINESS
                <textarea
                  value={profile.about || ""}
                  onChange={update("about")}
                  placeholder="Tell suppliers about your business and sourcing requirements..."
                />
              </label>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
