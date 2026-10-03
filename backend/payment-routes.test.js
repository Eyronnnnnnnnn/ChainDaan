import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import { validatePayment } from "./payment.js";
import mongoose from "mongoose";
const source = fs.readFileSync(new URL("./server.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const block = source.slice(source.indexOf("async function publishPaymentOrder"), source.indexOf('app.patch(\n  "/api/orders/:id/status"'));
function setup(order = null) {
  const routes = {}, calls = [], rooms = [];
  const context = {
    app: Object.fromEntries(["get", "post", "patch"].map((method) => [method, (path, ...handlers) => routes[path] = handlers.at(-1)])),
    requireAuth: () => {}, uploadLimiter: () => {}, upload: { single: () => () => {} }, asyncRoute: (fn) => fn,
    validatePayment,
    Sale: {
      findOne: (filter) => { calls.push(filter); return { select: async () => order, then: (resolve) => resolve(order) }; },
      findOneAndUpdate: async (filter, update) => { calls.push({ filter, update }); return order; },
      findById: () => ({ populate: async () => order }),
    },
    io: { to(room) { rooms.push(room); return this; }, emit() {} },
  };
  vm.runInNewContext(block, context);
  const response = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, set() { return this; }, type() { return this; }, send(body) { this.body = body; } };
  return { routes, calls, rooms, response };
}
test("review atomically restricts supplier and pending payment; rejects empty rejection reason", async () => {
  const { routes, calls, response } = setup();
  const review = routes["/api/orders/:id/payment-review"];
  await review({ body: { status: "rejected" } }, response);
  assert.equal(response.code, 400); assert.equal(calls.length, 0);
  await review({ params: { id: "order" }, auth: { sub: "supplier" }, body: { status: "approved" } }, response);
  assert.equal(response.code, 409);
  assert.equal(calls[0].filter.supplierId, "supplier");
  assert.equal(calls[0].filter["payment.status"], "pending");
  assert.equal(calls[0].update.$set["payment.status"], "approved");
});
test("review returns updated order and notifies both participants", async () => {
  const order = { _id: "order", buyerId: { _id: "buyer" }, supplierId: { _id: "supplier" } };
  const { routes, rooms, response } = setup(order);
  await routes["/api/orders/:id/payment-review"]({ params: { id: "order" }, auth: { sub: "supplier" }, body: { status: "rejected", note: "Reference does not match." } }, response);
  assert.equal(response.body, order); assert.deepEqual(rooms, ["buyer", "supplier"]);
});
test("proof lookup is private and resubmission is restricted to rejected buyer orders", async () => {
  const { routes, calls, response } = setup();
  const request = { params: { id: "order" }, auth: { sub: "buyer" }, body: {} };
  await routes["/api/orders/:id/payment-proof"](request, response);
  assert.equal(response.code, 404);
  assert.equal(calls[0].$or[0].buyerId, "buyer");
  assert.equal(calls[0].$or[1].supplierId, "buyer");
  await routes["/api/orders/:id/payment"](request, response);
  assert.equal(response.code, 409);
  assert.equal(calls[1].buyerId, "buyer"); assert.equal(calls[1]["payment.status"], "rejected");
});
test("receipt buffers are stored but excluded from order JSON", async () => {
  const isolated = new mongoose.Mongoose();
  const schemaCode = source.slice(source.indexOf("const saleSchema ="), source.indexOf("const feedbackSchema ="));
  const transformCode = source.slice(source.indexOf("const trackingNumberFor ="), source.indexOf('const Sale = mongoose.model'));
  const context = { mongoose: isolated, Buffer };
  vm.runInNewContext(`${schemaCode}\n${transformCode}\nglobalThis.schema = saleSchema;`, context);
  const Sale = isolated.model("ReceiptTest", context.schema);
  const id = "111111111111111111111111";
  const order = new Sale({ supplierId: id, buyerId: id, productId: id, quantity: 1, total: 100, payment: { status: "pending", proof: Buffer.from("test"), proofType: "image/png" } });
  await order.validate();
  assert.ok(Buffer.isBuffer(order.payment.proof));
  assert.equal(order.toJSON().payment.proof, undefined);
  assert.equal(context.schema.path("payment.proof").options.select, false);
});
test("product create saves its uploaded QR; editing without a QR preserves it", async () => {
  const routes = {}, writes = [];
  const product = { _id: "product", gcashQrUrl: "existing-qr" };
  const block = source.slice(source.indexOf('app.post(\n  "/api/products"'), source.indexOf('app.delete(\n  "/api/products/:id"'));
  vm.runInNewContext(block, {
    app: { post: (path, ...handlers) => routes.post = handlers.at(-1), patch: (path, ...handlers) => routes.patch = handlers.at(-1) },
    requireAuth: () => {}, uploadLimiter: () => {}, upload: { fields: () => () => {} }, asyncRoute: (fn) => fn,
    validImage: () => true, uploadToCloudinary: async () => "saved-qr",
    Product: { create: async (data) => { writes.push(data); return data; }, findOne: async () => product,
      findByIdAndUpdate: async (_id, data) => { writes.push(data); return { ...product, ...data }; } },
  });
  const response = { status() { return this; }, json(data) { this.body = data; } };
  const request = { auth: { sub: "supplier", role: "supplier" }, params: { id: "product" }, body: { name: "Rice", category: "Food", price: 100, stock: 10 }, files: { gcashQr: [{}] } };
  await routes.post(request, response);
  assert.equal(writes[0].gcashQrUrl, "saved-qr");
  assert.equal(writes[0].supplierId, "supplier");
  await routes.patch({ ...request, files: {} }, response);
  assert.equal(Object.hasOwn(writes[1], "gcashQrUrl"), false);
  assert.equal(response.body.gcashQrUrl, "existing-qr");
});
