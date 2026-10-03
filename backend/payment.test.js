import test from "node:test";
import assert from "node:assert/strict";
import { validatePayment, validImage, COD } from "./payment.js";
const file = { mimetype: "image/png", buffer: Buffer.from([137,80,78,71,13,10,26,10,0]) };
const fields = { paymentMethod: "GCash", gcashName: "Test Buyer", gcashPhone: "09123456789", gcashReference: "1234567890123" };
test("only COD and GCash are accepted", () => {
  assert.equal(validatePayment({ paymentMethod: COD }).status, "cod");
  for (const method of ["Bank Transfer", "Maya", "Supplier Terms"]) assert.throws(() => validatePayment({ paymentMethod: method }));
});
test("GCash requires product QR, sender details, reference and image proof", () => {
  assert.throws(() => validatePayment(fields, file, ""));
  assert.throws(() => validatePayment(fields, null, "qr"));
  for (const key of ["gcashName", "gcashPhone", "gcashReference"]) assert.throws(() => validatePayment({ ...fields, [key]: "" }, file, "qr"));
  assert.throws(() => validatePayment({ ...fields, gcashPhone: "123" }, file, "qr"));
  const payment = validatePayment(fields, file, "saved-qr");
  assert.equal(payment.status, "pending");
  assert.equal(payment.qrUrl, "saved-qr");
  assert.equal(payment.proof, file.buffer);
  assert.equal(payment.gcashReference, fields.gcashReference);
});
test("proof rejects forged image MIME types and oversized uploads", () => {
  assert.equal(validImage({ mimetype: "image/png", buffer: Buffer.from("<script>invalid</script>") }), false);
  assert.equal(validImage({ mimetype: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) }), false);
});
