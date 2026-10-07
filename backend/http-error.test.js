import test from "node:test";
import assert from "node:assert/strict";
import { handleHttpError } from "./http-error.js";

function response() {
  return { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
}
test("unexpected errors return 500 without exposing internal details", (t) => {
  t.mock.method(console, "error", () => {});
  const res = response();
  handleHttpError(new Error("private database connection string"), {}, res, () => {});
  assert.equal(res.code, 500);
  assert.equal(res.body.error.includes("private"), false);
});
test("database and upload errors have safe actionable responses", () => {
  for (const [error, status] of [[{ code: 11000 }, 409], [{ name: "CastError" }, 400], [{ name: "ValidationError" }, 400], [{ name: "MulterError" }, 400], [{ status: 403, message: "Forbidden" }, 403]]) {
    const res = response();
    handleHttpError(error, {}, res, () => {});
    assert.equal(res.code, status);
    assert.equal(typeof res.body.error, "string");
  }
});
test("errors after headers are sent delegate to Express", () => {
  const error = new Error("stream failed");
  let forwarded;
  handleHttpError(error, {}, { headersSent: true }, (value) => { forwarded = value; });
  assert.equal(forwarded, error);
});
