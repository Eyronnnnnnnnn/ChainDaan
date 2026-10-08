import { Link } from "react-router-dom";
import "./Home.css";

function DeliveryTruck() {
  return <span className="home-truck" aria-hidden="true">
    <svg viewBox="0 0 100 64" fill="none" focusable="false">
      <path className="home-truck-road" d="M4 59H96" stroke="#a9bfdf" strokeWidth="2" strokeDasharray="9 7" />
      <g className="home-truck-body">
        <path className="home-truck-speed" d="M3 25H15M7 33H19M3 41H13" stroke="#78a2ea" strokeWidth="3" strokeLinecap="round" />
        <rect x="21" y="12" width="43" height="35" rx="5" fill="#2459d3" />
        <path d="M64 25H77L91 39V47H64V25Z" fill="#5685e1" />
        <path d="M69 29H76L85 38H69V29Z" fill="#eaf3ff" />
        <path d="M36 29L41 34L51 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 47H93" stroke="#18385f" strokeWidth="4" strokeLinecap="round" />
      </g>
      {[33, 78].map((x) => <g className="home-truck-wheel" key={x} style={{ transformOrigin: `${x}px 49px` }}>
        <circle cx={x} cy="49" r="8" fill="#18385f" />
        <circle cx={x} cy="49" r="3.5" fill="#eaf3ff" />
        <path d={`M${x} 42V45M${x} 53V56`} stroke="#91b2e9" strokeWidth="2" />
      </g>)}
    </svg>
  </span>;
}

export default function Home() {
  return <div className="home-page">

    <a className="home-skip" href="#main">Skip to content</a>
    <header className="home-header">
      <Link className="home-brand" to="/" aria-label="Chain Daan home"><img src="/images/logo.png" alt="" /><span className="home-wordmark">Chain<span>Daan</span><i aria-hidden="true" /></span></Link>
      <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><Link to="/login">Log in</Link><Link className="home-button" to="/register">Get started</Link></nav>
    </header>
    <main id="main">
      <div className="home-intro">
    <div className="home-grid" aria-hidden="true"><div className="home-grid-lines" /><span className="home-grid-trace home-grid-trace-horizontal" /><span className="home-grid-trace home-grid-trace-vertical" /></div>
      <section className="home-hero">
        <div><p className="home-eyebrow">LOCAL CONNECTIONS. SHARED GROWTH.</p><h1>Your next business partner is <em>closer than you <span className="home-headline-finish">think.<DeliveryTruck /></span></em></h1><p className="home-description">Connect with suppliers across Ilocos Norte. Find products for your business, manage orders, and keep everything in one place.</p><div className="home-actions"><Link className="home-button" to="/register">Create an account <span aria-hidden="true">&rarr;</span></Link><a className="home-secondary" href="#how-it-works">See how it works</a></div><p className="home-note">For local businesses and suppliers. Free to join.</p></div>
        <div className="home-art"><div className="home-art-scene"><img className="home-map" src="/images/hero-map.png" alt="Illustration of local connections across Ilocos Norte" /><img className="home-mascot" src="/images/mascot.png" alt="Chain Daan mascot welcoming local businesses" /></div><span>Built for the local business community</span></div>
      </section>
      <section className="home-audience" aria-labelledby="audience-title"><div className="home-section-heading"><p className="home-eyebrow">GROW TOGETHER</p><h2 id="audience-title">A place for both sides of business.</h2></div><div className="home-cards">
        <article><span className="home-card-icon" aria-hidden="true">01</span><h3>I run a business</h3><p>Discover local suppliers and products, place orders, and follow their progress from your dashboard.</p><Link to="/register?role=business">Join as a business <span aria-hidden="true">&rarr;</span></Link></article>
        <article><span className="home-card-icon" aria-hidden="true">02</span><h3>I am a supplier</h3><p>Showcase your products, connect with local buyers, and manage incoming orders in one place.</p><Link to="/register?role=supplier">Join as a supplier <span aria-hidden="true">&rarr;</span></Link></article>
      </div></section>
      </div>
      <section className="home-how" id="how-it-works"><div className="home-section-heading"><p className="home-eyebrow">HOW IT WORKS</p><h2>A simpler way to work locally.</h2></div><ol><li><span>01</span><h3>Create your account</h3><p>Choose business or supplier and add your details.</p></li><li><span>02</span><h3>Make a connection</h3><p>Explore products as a buyer, or add your listings as a supplier.</p></li><li><span>03</span><h3>Manage your orders</h3><p>View updates and stay in touch through your dashboard.</p></li></ol></section>
      <section className="home-start"><div><h2>Let’s grow local, together.</h2><p>Your next connection starts here.</p></div><Link className="home-button" to="/register">Get started for free <span aria-hidden="true">&rarr;</span></Link></section>
    </main>
    <footer className="home-footer"><span>&copy; 2026 Chain Daan</span><nav aria-label="Footer navigation"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><a href="mailto:aaronguillermo.dev@gmail.com">Contact us</a></nav></footer>
  </div>;
}
