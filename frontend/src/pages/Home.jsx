import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return <div className="home-page">
    <a className="home-skip" href="#main">Skip to content</a>
    <header className="home-header">
      <Link className="home-brand" to="/"><img src="/images/logo.png" alt="" />Chain Daan</Link>
      <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><Link to="/login">Log in</Link><Link className="home-button" to="/register">Get started</Link></nav>
    </header>
    <main id="main">
      <section className="home-hero">
        <div><p className="home-eyebrow">LOCAL CONNECTIONS. SHARED GROWTH.</p><h1>Your next business partner is <em>closer than you think.</em></h1><p className="home-description">Connect with suppliers across Ilocos Norte. Find products for your business, manage orders, and keep everything in one place.</p><div className="home-actions"><Link className="home-button" to="/register">Create an account <span aria-hidden="true">&rarr;</span></Link><a className="home-secondary" href="#how-it-works">See how it works</a></div><p className="home-note">For local businesses and suppliers. Free to join.</p></div>
        <div className="home-art"><div className="home-art-scene"><img className="home-map" src="/images/hero-map.png" alt="Illustration of local connections across Ilocos Norte" /><img className="home-mascot" src="/images/mascot.png" alt="Chain Daan mascot welcoming local businesses" /></div><span>Built for the local business community</span></div>
      </section>
      <section className="home-audience" aria-labelledby="audience-title"><div className="home-section-heading"><p className="home-eyebrow">GROW TOGETHER</p><h2 id="audience-title">A place for both sides of business.</h2></div><div className="home-cards">
        <article><span className="home-card-icon" aria-hidden="true">01</span><h3>I run a business</h3><p>Discover local suppliers and products, place orders, and follow their progress from your dashboard.</p><Link to="/register?role=business">Join as a business <span aria-hidden="true">&rarr;</span></Link></article>
        <article><span className="home-card-icon" aria-hidden="true">02</span><h3>I am a supplier</h3><p>Showcase your products, connect with local buyers, and manage incoming orders in one place.</p><Link to="/register?role=supplier">Join as a supplier <span aria-hidden="true">&rarr;</span></Link></article>
      </div></section>
      <section className="home-how" id="how-it-works"><div className="home-section-heading"><p className="home-eyebrow">HOW IT WORKS</p><h2>A simpler way to work locally.</h2></div><ol><li><span>01</span><h3>Create your account</h3><p>Choose business or supplier and add your details.</p></li><li><span>02</span><h3>Make a connection</h3><p>Explore products as a buyer, or add your listings as a supplier.</p></li><li><span>03</span><h3>Manage your orders</h3><p>View updates and stay in touch through your dashboard.</p></li></ol></section>
      <section className="home-start"><div><h2>Let’s grow local, together.</h2><p>Your next connection starts here.</p></div><Link className="home-button" to="/register">Get started for free <span aria-hidden="true">&rarr;</span></Link></section>
    </main>
    <footer className="home-footer"><span>&copy; 2026 Chain Daan</span><nav aria-label="Footer navigation"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><a href="mailto:aaronguillermo.dev@gmail.com">Contact us</a></nav></footer>
  </div>;
}
