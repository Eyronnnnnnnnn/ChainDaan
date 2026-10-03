import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

// Exercise the registered handlers without a production database or server.
const source = fs.readFileSync(new URL("./server.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const handlersSource = source.slice(source.indexOf('app.get("/api/tracking/'), source.indexOf('app.get(\n  "/api/orders"'));
function setup({ order = null, points = [] } = {}) {
  const handlers = {};
  const calls = [];
  const context = {
    app: { get: (path, ...args) => handlers[path] = args.at(-1), post: (path, ...args) => handlers[path] = args.at(-1) },
    requireAuth: () => {}, asyncRoute: (fn) => fn,
    trackingNumberFor: (id) => `CD-${id.toString().toUpperCase()}`,
    Sale: { findOne: async (filter) => { calls.push(filter); return order; } },
    TrackingPoint: {
      find: () => ({ sort: () => ({ lean: async () => points }) }),
      create: async (point) => { calls.push(point); return point; },
    },
    io: { to() { return this; }, emit: (...args) => calls.push(args) },
  };
  vm.runInNewContext(handlersSource, context);
  const response = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  return { handlers, calls, response };
}
const id = "0123456789abcdef01234567";
test("lookup validates tracking numbers and restricts access to order participants", async () => {
  const { handlers, calls, response } = setup();
  const lookup = handlers["/api/tracking/:number"];
  await lookup({ params: { number: "bad" } }, response);
  assert.equal(response.code, 400);
  assert.equal(calls.length, 0);
  await lookup({ params: { number: `CD-${id}` }, auth: { sub: "buyer" } }, response);
  assert.equal(response.code, 404);
  assert.equal(calls[0].$or[0].buyerId, "buyer");
  assert.equal(calls[0].$or[1].supplierId, "buyer");
});
test("location rejects invalid coordinates, unauthorized suppliers and closed orders", async () => {
  for (const [order, body, expected] of [
    [null, { latitude: 91, longitude: 120, accuracy: 4 }, 400],
    [null, { latitude: null, longitude: 120, accuracy: 4 }, 400],
    [null, { latitude: 18, longitude: 120, accuracy: 4 }, 404],
    [{ status: "completed" }, { latitude: 18, longitude: 120, accuracy: 4 }, 409],
    [{ status: "cancelled" }, { latitude: 18, longitude: 120, accuracy: 4 }, 409],
  ]) {
    const { handlers, calls, response } = setup({ order });
    await handlers["/api/orders/:id/location"]({ params: { id }, auth: { sub: "supplier" }, body }, response);
    assert.equal(response.code, expected);
    if (calls.length) assert.equal(calls[0].supplierId, "supplier");
  }
});
test("valid supplier positions are persisted and broadcast to buyer and supplier", async () => {
  const { handlers, calls, response } = setup({ order: { _id: id, status: "confirmed", buyerId: "buyer", supplierId: "supplier" } });
  await handlers["/api/orders/:id/location"]({ params: { id }, auth: { sub: "supplier" }, body: { latitude: 18, longitude: 120, accuracy: 4 } }, response);
  assert.equal(response.code, 201);
  assert.equal(calls[1].orderId, id);
  assert.equal(calls[2][0], "trackingUpdated");
  assert.equal(calls[2][1].trackingNumber, `CD-${id.toUpperCase()}`);
});
