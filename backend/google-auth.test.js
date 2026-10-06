import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("./server.js", import.meta.url), "utf8");
function setup(overrides = {}) {
  const routes = {};
  const context = {
    app: { get: (path, handler) => { routes[path] = handler; } },
    env: { clientOrigin: "https://example.com", clientOrigins: ["https://example.com", "http://localhost:5173"], googleClientId: "client", googleClientSecret: "secret", googleRedirectUri: "http://localhost:4000/api/auth/google/callback" },
    URL, URLSearchParams, Buffer, AbortSignal,
    asyncRoute: (fn) => fn,
    createOAuthState: (state) => JSON.stringify(state),
    readOAuthState: () => ({ origin: "http://localhost:5173", intent: "signin" }),
    oauthFailure: (res, error) => { res.error = error; },
    fetch: async () => { throw new Error("Network unavailable"); },
    ...overrides,
  };
  vm.runInNewContext(source.slice(source.indexOf('app.get("/api/auth/google",'), source.indexOf('app.get("/api/auth/facebook",')), context);
  return routes;
}
const response = () => ({ locals: {}, redirect(url) { this.url = url; } });

test("Google sign-in preserves allowlisted origin and rejects arbitrary redirects", () => {
  const routes = setup();
  for (const origin of ["http://localhost:5173", "https://untrusted.example"]) {
    const res = response();
    routes["/api/auth/google"]({ query: { role: "business", intent: "signin", origin } }, res);
    const state = JSON.parse(new URL(res.url).searchParams.get("state"));
    assert.equal(state.origin, origin === "http://localhost:5173" ? origin : "https://example.com");
  }
});
test("Google network failures return recoverable sign-in errors", async () => {
  const res = response();
  await setup()["/api/auth/google/callback"]({ query: { state: "valid", code: "code" } }, res);
  assert.match(res.error, /try again/);
  assert.equal(res.locals.oauthOrigin, "http://localhost:5173");
});
test("Google callback rejects profiles without verified email", async () => {
  let calls = 0;
  const routes = setup({ fetch: async () => ({ ok: true, json: async () => ++calls === 1 ? { access_token: "token" } : { sub: "123", email: "person@example.com" } }) });
  const res = response();
  await routes["/api/auth/google/callback"]({ query: { state: "valid", code: "code" } }, res);
  assert.match(res.error, /verified email/);
});
