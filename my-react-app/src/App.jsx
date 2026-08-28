import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login, { SignIn } from "./pages/Login.jsx";
import SupplierDashboard from "./pages/SupplierDashboard.jsx";
import BusinessDashboard from "./pages/BusinessDashboard.jsx";
import BusinessProfile from "./pages/BusinessProfile.jsx";

const Icon = ({ children, size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const images = {
  logo: "/images/logo.png",
  hero: "/images/hero-map.png",
  mascot: "/images/mascot.png",
  delivery: "/images/delivery.png",
};

const products = [
  ["Organic Malunggay Bundle", "Agriculture", "Laoag Fresh Produce", "₱180", "product-1.png"],
  ["Handwoven Abel Fabric", "Textiles", "Northern Weave Textiles", "₱850", "product-2.png"],
  ["Burnay Clay Pot Set", "Crafts", "Ilocos Pottery Works", "₱1,200", "product-3.png"],
  ["Premium Ilocos Rice", "Food & Grain", "Sarrat Rice Cooperative", "₱1,350", "product-4.png"],
];

function ImageSlot({ src, alt, className = "" }) {
  return (
    <div className={`image-slot ${className}`}>
      <img
        src={src}
        alt={alt}
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
      <span>Place image here</span>
    </div>
  );
}

function Home() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingMessage, setTrackingMessage] = useState("");
  const features = [
    [
      "For Businesses",
      "Find trusted suppliers, explore quality products, and grow your business.",
      "users",
    ],
    [
      "For Suppliers",
      "Reach more local businesses in Ilocos Norte and grow your network.",
      "store",
    ],
    [
      "Trusted & Secure",
      "We ensure safe transactions and verified suppliers you can rely on.",
      "shield",
    ],
    [
      "Support Local",
      "Empowering local businesses and strengthening the economy of Ilocos Norte.",
      "truck",
    ],
  ];
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Chain Daan home">
          <ImageSlot
            src={images.logo}
            alt="Chain Daan logo"
            className="logo-slot"
          />
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a className="active" href="#top">
            Home
          </a>
          <a href="#suppliers">Suppliers</a>
          <a href="#products">Products</a>
          <a href="#business">For Business</a>
          <a href="#about">About Us</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="header-actions">
          <a className="button button-outline" href="/login">
            <Icon size={18}>
              <circle cx="12" cy="8" r="3" />
              <path d="M5 20a7 7 0 0 1 14 0" />
            </Icon>
            Login
          </a>
          <a className="button button-gold" href="/register">
            <Icon size={18}>
              <circle cx="9" cy="8" r="3" />
              <path d="M3 20a6 6 0 0 1 12 0M19 8v6M16 11h6" />
            </Icon>
            Register
          </a>
        </div>
      </header>
      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow light">LOCAL SOURCING, MADE SIMPLE</p>
            <h1>
              Connecting Local
              <br />
              Businesses with
              <br />
              <strong>Trusted Suppliers</strong>
            </h1>
            <span className="location-pill">in Ilocos Norte</span>
            <p className="hero-text">
              Chain Daan is a digital platform that connects local businesses
              with trusted suppliers across Ilocos Norte. We make it easier for
              entrepreneurs to discover reliable products, build strong supplier
              partnerships, and streamline their sourcing process through one
              secure and user-friendly platform.
            </p>
            <form className="tracking-box" onSubmit={(event) => { event.preventDefault(); setTrackingMessage(trackingNumber.trim() ? "Your order is being tracked." : "Enter a tracking number to continue."); }}>
              <label>
                <Icon size={19}>
                  <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </Icon>
                Track Your Order
              </label>
              <div className="tracking-row">
                <input
                  aria-label="Tracking number"
                  value={trackingNumber}
                  onChange={(event) => { setTrackingNumber(event.target.value); setTrackingMessage(""); }}
                  placeholder="Enter Tracking Number..."
                />
                <button className="button button-gold" type="submit">
                  Track Order
                </button>
              </div>
              {trackingMessage && <p className="tracking-message">{trackingMessage}</p>}
            </form>
          </div>
          <div className="hero-visual">
            <ImageSlot src={images.hero} alt="Ilocos Norte supplier map" className="hero-image" />
            <ImageSlot src={images.mascot} alt="Chain Daan delivery mascot" className="mascot-image" />
            <div className="floating-icon">
              <Icon size={27}>
                <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" />
                <circle cx="7" cy="19" r="2" />
                <circle cx="18" cy="19" r="2" />
              </Icon>
            </div>
          </div>
        </section>
        <section className="feature-section" id="business">
          <div className="feature-grid">
            {features.map(([title, text, icon]) => (
              <article className="feature-card" key={title}>
                <div className="feature-icon">
                  <Icon>
                    {icon === "users" && (
                      <>
                        <circle cx="9" cy="8" r="3" />
                        <path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4" />
                      </>
                    )}
                    {icon === "store" && (
                      <>
                        <path d="M4 10h16v10H4zM3 10l2-6h14l2 6M8 14h8v6H8" />
                      </>
                    )}
                    {icon === "shield" && (
                      <>
                        <path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z" />
                        <path d="m8.5 12 2.2 2.2 4.8-5" />
                      </>
                    )}
                    {icon === "truck" && (
                      <>
                        <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z" />
                        <circle cx="7" cy="19" r="2" />
                        <circle cx="18" cy="19" r="2" />
                      </>
                    )}
                  </Icon>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <a href="#contact">
                  Learn More <span>›</span>
                </a>
              </article>
            ))}
          </div>
        </section>
        <section className="stats-section">
          <div className="stat">
            <b>20+</b>
            <span>Municipalities Covered</span>
          </div>
          <div className="stat">
            <b>500+</b>
            <span>Local Businesses</span>
          </div>
          <div className="stat">
            <b>1000+</b>
            <span>Products Available</span>
          </div>
          <div className="stat">
            <b>100%</b>
            <span>Secure Platform</span>
          </div>
        </section>
        <section className="how-section" id="about">
          <div className="how-copy">
            <p className="eyebrow">HOW IT WORKS</p>
            <h2>
              Simple, Fast &<br />
              <strong>Reliable Delivery</strong>
            </h2>
            <p>
              From ordering to doorstep delivery, Chain Daan ensures every
              transaction between businesses and suppliers in Ilocos Norte is
              smooth, secure, and traceable.
            </p>
            <div className="steps">
              <div>
                <b>01</b>
                <span>
                  <strong>Find a Supplier</strong>Browse verified local
                  suppliers across all 20+ municipalities.
                </span>
              </div>
              <div>
                <b>02</b>
                <span>
                  <strong>Place Your Order</strong>Secure checkout with full
                  transaction visibility and confirmation.
                </span>
              </div>
              <div>
                <b>03</b>
                <span>
                  <strong>Track & Receive</strong>Real-time tracking from
                  warehouse to your business door.
                </span>
              </div>
            </div>
            <a className="button button-blue" href="/register">
              Get Started Today <span>›</span>
            </a>
          </div>
          <ImageSlot
            src={images.delivery}
            alt="Local delivery handoff"
            className="delivery-image"
          />
        </section>
        <section className="products-section" id="products">
          <div className="section-heading"><div><p className="eyebrow">FEATURED</p><h2>Popular Products</h2></div><a href="#suppliers">View All <span>›</span></a></div>
          <div className="products-grid">{products.map(([name, category, supplier, price, image]) => <article className="product-card" key={name}><ImageSlot src={`/images/${image}`} alt={name} className="product-image" /><div className="product-info"><small>{category}</small><h3>{name}</h3><p>{supplier}</p><div className="product-bottom"><strong>{price}</strong><button className="button button-gold" type="button">Add</button></div></div></article>)}</div>
        </section>
        <section className="cta-section" id="register">
          <h2>
            Ready to grow your business
            <br />
            <strong>in Ilocos Norte?</strong>
          </h2>
          <p>
            Join 500+ local businesses already sourcing smarter through Chain
            Daan.
          </p>
          <div>
            <a className="button button-gold" href="/register">
              Register as a Business
            </a>
            <a className="button button-white-outline" href="#suppliers">
              Join as a Supplier
            </a>
          </div>
        </section>
      </main>
      <footer>
        <span>
          © 2024 Chain Daan. All rights reserved. Connecting Businesses in
          Ilocos Norte.
        </span>
        <div>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#contact">Contact</a>
        </div>
      </footer>
    </div>
  );
}

const ProtectedRoute = ({ children }) => localStorage.getItem("chaindaan_token") ? children : <Navigate to="/login" replace />;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Login />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/supplier-dashboard" element={<ProtectedRoute><SupplierDashboard /></ProtectedRoute>} />
        <Route path="/business-dashboard" element={<ProtectedRoute><BusinessDashboard /></ProtectedRoute>} />
        <Route path="/business-profile" element={<ProtectedRoute><BusinessProfile /></ProtectedRoute>} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
