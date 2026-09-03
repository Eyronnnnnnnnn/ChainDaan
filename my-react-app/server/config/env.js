const defaultClientOrigin = "http://localhost:5173";

export const env = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI,
  clientOrigin: process.env.CLIENT_ORIGIN || defaultClientOrigin,
  authSecret: process.env.AUTH_SECRET || "development-only-change-this-secret",
};
