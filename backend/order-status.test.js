import test from "node:test";
import assert from "node:assert/strict";
import { changeOrderStatus } from "./order-status.js";

function setup(overrides = {}, stock = 5) {
  const session = {};
  const order = { _id: "order", productId: "product", supplierId: "supplier", buyerId: "buyer", quantity: 3, status: "pending", paymentMethod: "Cash on Delivery (COD)", ...overrides };
  let saves = 0;
  order.save = async (options) => { assert.equal(options.session, session); saves++; };
  const deps = {
    actorId: "supplier", orderId: "order",
    connection: { transaction: async (fn) => {
      const before = { stock, status: order.status };
      try { return await fn(session); } catch (error) { stock = before.stock; order.status = before.status; throw error; }
    } },
    Sale: { findById: () => ({ session: async (value) => { assert.equal(value, session); return order; } }) },
    Product: {
      findOneAndUpdate: async (filter, update, options) => {
        assert.equal(options.session, session);
        if (stock < filter.stock.$gte) return null;
        stock += update.$inc.stock;
        return { stock };
      },
      findByIdAndUpdate: async (_id, update, options) => { assert.equal(options.session, session); stock += update.$inc.stock; },
    },
  };
  return { run: (status, actorId = "supplier") => changeOrderStatus({ ...deps, status, actorId }), order, stock: () => stock, saves: () => saves };
}

test("confirmation deducts stock once; completing does not deduct again", async () => {
  const fixture = setup();
  await fixture.run("confirmed");
  await fixture.run("confirmed");
  assert.equal(fixture.stock(), 2);
  assert.equal(fixture.saves(), 1);
  await fixture.run("completed");
  assert.equal(fixture.stock(), 2);
  assert.equal(fixture.order.status, "completed");
});
test("insufficient stock leaves the order pending", async () => {
  const fixture = setup({}, 2);
  await assert.rejects(fixture.run("confirmed"), { status: 409 });
  assert.equal(fixture.stock(), 2);
  assert.equal(fixture.order.status, "pending");
  assert.equal(fixture.saves(), 0);
});
test("cancelling a confirmed order restores stock once", async () => {
  const fixture = setup();
  await fixture.run("confirmed");
  await fixture.run("cancelled", "buyer");
  await fixture.run("cancelled", "buyer");
  assert.equal(fixture.stock(), 5);
});
test("cancelling a pending order does not add stock", async () => {
  const fixture = setup();
  await fixture.run("cancelled", "buyer");
  assert.equal(fixture.stock(), 5);
});
test("closed orders cannot reopen and pending orders cannot skip confirmation", async () => {
  for (const status of ["completed", "cancelled"]) {
    const fixture = setup({ status });
    await assert.rejects(fixture.run("confirmed"), { status: 409 });
    assert.equal(fixture.stock(), 5);
  }
  await assert.rejects(setup().run("completed"), { status: 409 });
  await assert.rejects(setup({ status: "confirmed" }).run("pending"), { status: 400 });
});
test("buyers cannot confirm; outsiders cannot cancel", async () => {
  await assert.rejects(setup().run("confirmed", "buyer"), { status: 403 });
  await assert.rejects(setup().run("cancelled", "stranger"), { status: 403 });
});
test("GCash requires approval before confirmation", async () => {
  for (const status of ["pending", "rejected"]) {
    const fixture = setup({ paymentMethod: "GCash", payment: { status } });
    await assert.rejects(fixture.run("confirmed"), { status: 409 });
    assert.equal(fixture.stock(), 5);
  }
  const fixture = setup({ paymentMethod: "GCash", payment: { status: "approved" } });
  await fixture.run("confirmed");
  assert.equal(fixture.stock(), 2);
});
test("a failed order save rolls the stock change back", async () => {
  const fixture = setup();
  fixture.order.save = async () => { throw new Error("Database write failed"); };
  await assert.rejects(fixture.run("confirmed"), /Database write failed/);
  assert.equal(fixture.stock(), 5);
  assert.equal(fixture.order.status, "pending");
});
