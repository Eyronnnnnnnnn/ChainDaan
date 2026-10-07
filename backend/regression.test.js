import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("./server.js", import.meta.url), "utf8").replace(/\r/g, "");
test("legacy profile creation cannot bypass registration", () => {
  let handler;
  const block = source.slice(source.indexOf('app.post(\n  "/api/profiles"'), source.indexOf('app.patch(\n  "/api/profiles/:id"'));
  vm.runInNewContext(block, { app: { post: (_path, ...handlers) => { handler = handlers.at(-1); } }, requireAuth() {} });
  const result = response();
  handler({ body: { role: "supplier", passwordHash: "injected" } }, result);
  assert.equal(result.code, 410);
});
function response() {
  return { code: 200, status(code) { this.code = code; return this; }, json(data) { this.body = data; return this; } };
}

test("order creation enforces buyer role and stock before writing", async () => {
  let handler, writes = 0;
  const product = { _id: "product", supplierId: "supplier", stock: 2, price: 0.1 };
  const query = { populate() { return this; }, then(resolve) { resolve({ _id: "order" }); } };
  const block = source.slice(source.indexOf('app.post(\n  "/api/orders"'), source.indexOf("async function publishPaymentOrder"));
  const context = {
    app: { post: (_path, ...handlers) => { handler = handlers.at(-1); } },
    requireAuth() {}, uploadLimiter() {}, upload: { single: () => () => {} }, asyncRoute: (fn) => fn,
    Product: { findById: async () => product },
    Sale: { create: async (data) => { writes++; return { ...data, _id: "order" }; }, findById: () => query },
    validatePayment: () => ({ status: "cod" }), io: { to() { return this; }, emit() {} },
  };
  vm.runInNewContext(block, context);
  const request = { auth: { sub: "buyer", role: "business" }, body: { productId: "product", quantity: 3, deliveryAddress: "Street 1", deliveryTown: "Laoag" } };
  let result = response();
  await handler(request, result);
  assert.equal(result.code, 409);
  assert.equal(writes, 0);
  result = response();
  await handler({ ...request, auth: { sub: "supplier", role: "supplier" } }, result);
  assert.equal(result.code, 403);
  assert.equal(writes, 0);
  request.body.quantity = 1.5;
  result = response();
  await handler(request, result);
  assert.equal(result.code, 400);
  request.body.quantity = 2;
  result = response();
  await handler(request, result);
  assert.equal(result.code, 201);
  assert.equal(writes, 1);
});

test("product searches treat regex characters as literal text", async () => {
  let handler, filter;
  const block = source.slice(source.indexOf('app.get(\n  "/api/products"'), source.indexOf('app.post(\n  "/api/products"'));
  vm.runInNewContext(block, {
    app: { get: (_path, fn) => { handler = fn; } }, asyncRoute: (fn) => fn,
    Product: { find: (value) => { filter = value; return { populate: async () => [] }; } },
  });
  await handler({ query: { search: "Rice (premium) [1]+" } }, response());
  assert.equal(filter.name.test("Rice (premium) [1]+"), true);
  assert.equal(filter.name.test("Rice premium 111"), false);
});

test("socket events tolerate empty payloads and reject non-member rooms", async () => {
  const handlers = {}, emitted = [];
  let writes = 0;
  const socket = { auth: { sub: "buyer" }, rooms: new Set(["buyer", "conversation"]),
    join() {}, leave() {}, emit() {}, on: (name, fn) => { handlers[name] = fn; },
    to: (room) => ({ emit: (event) => emitted.push({ room, event }) }),
  };
  const block = source.slice(source.indexOf('io.on("connection"'), source.indexOf("\nmongoose\n  .connect"));
  vm.runInNewContext(block, {
    io: { on: (_name, fn) => fn(socket), emit() {} }, onlineUsers: new Map(),
    mongoose: { isValidObjectId: (value) => typeof value === "string" },
    Conversation: { exists: async (filter) => filter._id === "conversation" && filter.participantIds === "buyer" },
    Message: { updateMany: async () => { writes++; } },
  });
  for (const event of ["typing", "stopTyping", "markSeen"]) {
    await handlers[event](null);
    await handlers[event]();
    await handlers[event]({ conversationId: "someone-else" });
    assert.equal(emitted.length, 0);
  }
  assert.equal(writes, 0);
  handlers.typing({ conversationId: "conversation" });
  assert.equal(emitted[0].event, "userTyping");
  socket.rooms.delete("conversation");
  await handlers.markSeen({ conversationId: "conversation" });
  assert.equal(writes, 1);
});

test("deleted accounts cannot reuse their old API tokens", async () => {
  let handler;
  const block = source.slice(source.indexOf("const requireAuth ="), source.indexOf('app.get("/api/health"'));
  const context = { asyncRoute: (fn) => { handler = fn; return fn; },
    getTokenProfile: () => ({ sub: "deleted", role: "business" }), Profile: { exists: async () => false },
  };
  vm.runInNewContext(block, context);
  const result = response();
  await handler({}, result, () => { throw new Error("Should not authenticate"); });
  assert.equal(result.code, 401);
});
