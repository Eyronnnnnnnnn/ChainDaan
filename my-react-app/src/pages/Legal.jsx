import { Link, useLocation } from "react-router-dom";
import "./Legal.css";

const privacySections = [
  ["Information we collect", "We collect the information you provide when creating an account, including your name, business or supplier name, email address, phone number, municipality, and password. We also store products, orders, messages, profile photos, and feedback that you submit through the platform."],
  ["How we use information", "We use this information to authenticate accounts, connect businesses and suppliers, process orders, provide live chat and notifications, improve the platform, and respond to feedback. We do not sell personal information."],
  ["Sharing and visibility", "Profile and catalog information may be visible to other platform users so they can discover and contact suppliers. Order and message details are shared only with the participants needed to complete that interaction. We may disclose information when required by law or to protect the platform."],
  ["Data security and retention", "We use access controls and authenticated requests to protect account data. Passwords are stored as secure hashes. We retain information while your account is active or as needed for transactions, safety, dispute handling, and legal obligations."],
  ["Your choices", "You may request corrections or deletion of your account information by contacting the developer. You can also stop using the platform at any time. Some transaction records may need to be retained for legitimate business or legal purposes."],
  ["Contact", "For privacy questions or requests, contact aaronguillermo.dev@gmail.com. We will review requests and respond within a reasonable period."],
];

const termsSections = [
  ["Using Chain Daan", "Chain Daan helps businesses discover suppliers and manage sourcing interactions. You must provide accurate information, keep your login details private, and use the platform only for lawful business purposes."],
  ["Accounts and conduct", "You are responsible for activity under your account. Do not impersonate another person, upload harmful or unlawful content, attempt unauthorized access, spam users, or interfere with the platform. We may suspend accounts that violate these rules."],
  ["Orders and transactions", "Orders, prices, stock, delivery terms, payment arrangements, and fulfillment are agreed between the participating business and supplier. Chain Daan provides the workflow and status tools but is not a party to the underlying transaction unless expressly stated."],
  ["User content", "You retain ownership of content you submit. By submitting profiles, product information, messages, photos, or feedback, you allow Chain Daan to store, display, and process that content as needed to operate and improve the service."],
  ["Availability and changes", "We aim to keep the platform reliable but do not guarantee uninterrupted availability or error-free operation. Features, policies, and these terms may change as the platform develops. Continued use after a change means you accept the updated terms."],
  ["Contact", "Questions about these terms can be sent to aaronguillermo.dev@gmail.com."],
];

export default function Legal() {
  const isTerms = useLocation().pathname === "/terms";
  const title = isTerms ? "Terms of Service" : "Privacy Policy";
  const sections = isTerms ? termsSections : privacySections;

  return (
    <div className="legal-shell">
      <header className="legal-header">
        <Link className="legal-brand" to="/" aria-label="Chain Daan home">
          <img src="/images/logo.png" alt="Chain Daan" />
          <span>Chain Daan</span>
        </Link>
        <nav aria-label="Legal navigation">
          <Link to="/">Home</Link>
          <Link to="/login">Sign in</Link>
          <Link className="legal-header-action" to="/register">Create account</Link>
        </nav>
      </header>
      <main className="legal-main">
        <Link className="legal-back" to="/">← Back to Chain Daan</Link>
        <p className="legal-kicker">CHAIN DAAN · EFFECTIVE SEPTEMBER 3, 2026</p>
        <h1>{title}</h1>
        <p className="legal-lead">Please read this {isTerms ? "agreement" : "notice"} carefully. It explains how Chain Daan operates and what you can expect when using the platform.</p>
        <div className="legal-sections">
          {sections.map(([heading, body]) => (
            <section key={heading}>
              <h2>{heading}</h2>
              <p>{body}</p>
            </section>
          ))}
        </div>
      </main>
      <footer className="legal-footer">
        <span>© 2026 Chain Daan</span>
        <span>Developer: aaronguillermo.dev</span>
        <a href="mailto:aaronguillermo.dev@gmail.com">Contact developer</a>
      </footer>
    </div>
  );
}
