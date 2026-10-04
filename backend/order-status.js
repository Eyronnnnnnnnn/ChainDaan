function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

// Stock and order status must commit together. Atlas supports these transactions.
export async function changeOrderStatus({ connection, Sale, Product, orderId, actorId, status }) {
  if (!["confirmed", "completed", "cancelled"].includes(status)) {
    fail(400, "Choose confirmed, completed, or cancelled.");
  }
  return connection.transaction(async (session) => {
    const order = await Sale.findById(orderId).session(session);
    if (!order) fail(404, "Order not found.");
    const isSupplier = order.supplierId.toString() === actorId;
    const isBuyer = order.buyerId.toString() === actorId;
    if (!isSupplier && !isBuyer) fail(403, "Unauthorized access to this order.");
    if (!isSupplier && status !== "cancelled") fail(403, "Only suppliers can confirm or complete orders.");
    if (order.status === status) return order;
    const allowed = { pending: ["confirmed", "cancelled"], confirmed: ["completed", "cancelled"] };
    if (!allowed[order.status]?.includes(status)) fail(409, "This order cannot move to that status. Refresh and try again.");
    if (["confirmed", "completed"].includes(status) && order.paymentMethod === "GCash" && order.payment?.status !== "approved") {
      fail(409, "Approve the GCash payment before confirming or completing this order.");
    }
    if (status === "confirmed") {
      const product = await Product.findOneAndUpdate(
        { _id: order.productId, stock: { $gte: order.quantity } },
        { $inc: { stock: -order.quantity } },
        { session, new: true },
      );
      if (!product) fail(409, "There is not enough stock to confirm this order.");
    } else if (order.status === "confirmed" && status === "cancelled") {
      await Product.findByIdAndUpdate(order.productId, { $inc: { stock: order.quantity } }, { session });
    }
    order.status = status;
    await order.save({ session });
    return order;
  });
}
