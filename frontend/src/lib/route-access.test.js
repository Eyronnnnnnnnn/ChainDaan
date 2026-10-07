import test from "node:test";
import assert from "node:assert/strict";
import { routeRedirect } from "./route-access.js";

test("protected routes require a token and valid account", () => {
  for (const user of [null, {}, { _id: "1", role: "admin" }]) {
    assert.equal(routeRedirect("token", user, "supplier"), "/login");
  }
  assert.equal(routeRedirect(null, { _id: "1", role: "supplier" }, "supplier"), "/login");
});
test("account roles route to their own dashboard", () => {
  assert.equal(routeRedirect("token", { _id: "1", role: "business" }, "supplier"), "/business-dashboard");
  assert.equal(routeRedirect("token", { _id: "1", role: "supplier" }, "business"), "/supplier-dashboard");
  assert.equal(routeRedirect("token", { _id: "1", role: "supplier" }, "supplier"), null);
});
