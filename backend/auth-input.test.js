import test from "node:test";
import assert from "node:assert/strict";
import { validateAuthInput } from "./auth-input.js";

test("malformed authentication bodies stop before queries and password hashing", () => {
  for (const body of [undefined, [], {}, { email: { $ne: null }, password: "password" }, { email: "a@b.com", password: 12345678 }, { email: "a@b.com", password: "password", role: { $ne: null } }]) {
    let status;
    validateAuthInput({ method: "POST", path: "/login", body }, { status(value) { status = value; return this; }, json() {} }, () => assert.fail("Invalid request reached handler"));
    assert.equal(status, 400);
  }
});
test("valid login and unrelated authentication routes continue", () => {
  for (const request of [{ method: "POST", path: "/login", body: { email: "a@b.com", password: "password", role: "business" } }, { method: "GET", path: "/google" }, { method: "DELETE", path: "/account" }]) {
    let continued = false;
    validateAuthInput(request, {}, () => { continued = true; });
    assert.equal(continued, true);
  }
});
