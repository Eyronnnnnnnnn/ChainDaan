import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { orderApi } from "../api/client.js";
import { trackingNumberFor } from "../lib/tracking.js";
import OrderTracking, { TrackingView } from "./OrderTracking.jsx";

export default function TrackingDashboard({ supplier = false, initialOrderId = "" }) {
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState(initialOrderId);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const refresh = () => orderApi.list().then((result) => {
      if (active) { setOrders(result); setError(""); }
    }).catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:4000", {
      auth: { token: localStorage.getItem("chaindaan_token") },
    });
    socket.on("connect", refresh);
    socket.on("newOrder", refresh);
    socket.on("orderUpdated", refresh);
    refresh();
    return () => { active = false; socket.disconnect(); };
  }, []);
  const matches = orders.filter((order) => `${trackingNumberFor(order)} ${order.productId?.name || ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = orders.find((order) => order._id === selectedId) || orders.find((order) => order.status === "confirmed") || orders[0];
  return <div className="dashboard-content">
    <div className="welcome-row"><div><h2>{supplier ? "Share delivery location" : "Track your orders"}</h2>
      <p>{supplier ? "Choose an order and send its live delivery location to the business owner." : "Choose your order to see the supplier's latest delivery location and recorded route."}</p></div></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {loading ? <p role="status">Loading orders...</p> : !orders.length ? <div className="empty-state"><h3>{supplier ? "No deliveries yet" : "No orders to track yet"}</h3><p>{supplier ? "Orders from business owners will appear here. Confirm an order to start sharing its delivery location." : "Place an order with a supplier. Its tracking number and delivery map will appear here."}</p></div> : <div className="tracking-workspace">
      <aside className="tracking-order-list" aria-label="Orders for tracking">
        <label htmlFor="tracking-order-search">Find your order</label>
        <input id="tracking-order-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tracking number or product" />
        {matches.map((order) => <button type="button" key={order._id} aria-pressed={selected?._id === order._id} onClick={() => setSelectedId(order._id)}>
          <strong>{order.productId?.name || "Order"}</strong><span>{trackingNumberFor(order)}</span><small>{order.status} · {supplier ? order.buyerId?.name : order.supplierId?.name}</small>
        </button>)}
        {!matches.length && <p>No matching orders.</p>}
      </aside>
      {selected && <section className="tracking-order-detail">
        <h3>{selected.productId?.name || "Order"}</h3>
        <p>{supplier ? "Buyer" : "Supplier"}: {supplier ? selected.buyerId?.name : selected.supplierId?.name}</p>
        <p>Delivery to: {selected.deliveryAddress}, {selected.deliveryTown}</p>
        {supplier ? <OrderTracking key={selected._id} order={selected} supplier /> : <TrackingView key={selected._id} number={trackingNumberFor(selected)} />}
      </section>}
    </div>}
  </div>;
}
