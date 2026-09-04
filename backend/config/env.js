const defaultClientOrigin = "http://localhost:5173";
const clientOrigins = (process.env.CLIENT_ORIGIN || defaultClientOrigin)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

export const env = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI,
  // CLIENT_ORIGIN supports a comma-separated allowlist. The first origin is
  // also used for trusted OAuth and password-reset redirects.
  clientOrigin: clientOrigins[0],
  clientOrigins,
  // Set TRUST_PROXY=true only when the application is behind one trusted
  // reverse proxy (for example, a managed HTTPS platform).
  trustProxy: process.env.TRUST_PROXY === "true" ? 1 : false,
  authSecret: process.env.AUTH_SECRET || "development-only-change-this-secret",
  facebookAppId: process.env.FACEBOOK_APP_ID,
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET,
  facebookRedirectUri:
    process.env.FACEBOOK_REDIRECT_URI ||
    "http://localhost:4000/api/auth/facebook/callback",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:4000/api/auth/google/callback",
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  mailFrom: process.env.MAIL_FROM,
};
