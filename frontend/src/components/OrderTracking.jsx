import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { request } from "../api/client.js";
import { trackingNumberFor } from "../lib/tracking.js";
import "./OrderTracking.css";

function TrackingMap({ points }) {
  const [tileError, setTileError] = useState(false);
  const container = useRef(null);
  const map = useRef(null);
  const route = useRef(null);
  useEffect(() => {
    map.current = L.map(container.current).setView([18.198, 120.593], 12);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).on("tileerror", () => setTileError(true)).on("tileload", () => setTileError(false)).addTo(map.current);
    route.current = L.featureGroup().addTo(map.current);
    const observer = new ResizeObserver(() => {
      map.current?.invalidateSize();
      const bounds = route.current.getBounds();
      if (bounds.isValid()) map.current.fitBounds(bounds, { padding: [35, 35], maxZoom: 16, animate: false });
    });
    observer.observe(container.current);
    return () => { observer.disconnect(); map.current.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    route.current.clearLayers();
    if (!points.length) return;
    const coordinates = points.map((p) => [p.latitude, p.longitude]);
    L.polyline(coordinates, { color: "#168a83", weight: 5 }).addTo(route.current);
    L.circleMarker(coordinates[0], { radius: 6, color: "#42536b" }).bindTooltip("First recorded location").addTo(route.current);
    L.circleMarker(coordinates.at(-1), { radius: 10, color: "#fff", fillColor: "#168a83", fillOpacity: 1, weight: 3 })
      .bindTooltip("Last reported parcel location").addTo(route.current);
    map.current.fitBounds(L.latLngBounds(coordinates), { padding: [35, 35], maxZoom: 16, animate: false });
  }, [points]);
  return <>{tileError && <p role="status">Map tiles could not load. Check your connection; recorded GPS positions are still available.</p>}<div className="parcel-map" ref={container} aria-label="Parcel map showing recorded GPS route" /></>;
}

export function TrackingView({ number }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let active = true;
    let sequence = 0;
    const refresh = async () => {
      const version = ++sequence;
      try {
        const result = await request(`/api/tracking/${encodeURIComponent(number)}`);
        if (active && version === sequence) { setData(result); setError(""); }
      } catch (err) { if (active) setError(err.message); }
    };
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:4000", {
      auth: { token: localStorage.getItem("chaindaan_token") },
    });
    socket.on("connect", refresh);
    socket.on("trackingUpdated", (update) => {
      if (update.trackingNumber !== number) return;
      refresh();
    });
    socket.on("orderUpdated", refresh);
    refresh();
    const timer = setInterval(() => { setNow(Date.now()); refresh(); }, 30000);
    return () => { active = false; clearInterval(timer); socket.disconnect(); };
  }, [number]);
  const last = data?.points.at(-1);
  const recent = last && now - new Date(last.recordedAt).getTime() < 60000;
  return <section className="parcel-tracking">
    <strong>{number}</strong>
    {error && <p role="alert">{error}</p>}
    {!data && !error && <p>Loading tracking…</p>}
    {data && <>
      <p className="parcel-state">{data.status === "completed" ? "Delivered" : data.status === "cancelled" ? "Order cancelled" : last ? recent ? "Receiving location updates" : "Location updates paused" : "Waiting for supplier GPS"}</p>
      {last ? <><TrackingMap points={data.points} /><p>Last reported: {new Date(last.recordedAt).toLocaleString()} · GPS accuracy ±{Math.round(last.accuracy)} m</p><small>The line connects recorded GPS positions. Gaps between updates may not follow roads.</small></> : <div className="parcel-empty">The map will appear when the supplier shares the first delivery location.</div>}
    </>}
  </section>;
}

export default function OrderTracking({ order, supplier = false }) {
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [lastShared, setLastShared] = useState(null);
  const [error, setError] = useState("");
  const number = trackingNumberFor(order);
  useEffect(() => {
    if (!supplier || !sharing || order.status !== "confirmed") return;
    let active = true;
    let busy = false;
    let lastSent = 0;
    const watcher = navigator.geolocation.watchPosition(async ({ coords }) => {
      if (!active || busy || Date.now() - lastSent < 10000) return;
      busy = true;
      lastSent = Date.now();
      try {
        await request(`/api/orders/${order._id}/location`, { method: "POST", body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }) });
        if (active) { setError(""); setLastShared(new Date().toLocaleTimeString()); }
      } catch (err) { if (active) { setError(err.message); setSharing(false); } }
      finally { busy = false; }
    }, (err) => { if (active) { setError(err.message || "Location unavailable."); setSharing(false); } }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    return () => { active = false; navigator.geolocation.clearWatch(watcher); };
  }, [supplier, sharing, order._id, order.status]);
  return <div className="parcel-controls">
    <div className="parcel-actions"><span>Tracking number: <b>{number}</b></span>{!supplier && <button type="button" onClick={() => setOpen(!open)}>{open ? "Hide tracking" : "Track order"}</button>}</div>
    {!supplier && <p>View your supplier's delivery location and the recorded route of your order.</p>}
    {supplier && order.status === "pending" && <p>Confirm this order to share its delivery location with the business owner.</p>}
    {supplier && order.status === "confirmed" && <>
      <p>Send the delivery location to the business owner so they can track their order. Use the device travelling with the parcel and keep this page open.</p>
      {sharing && <p role="status">{lastShared ? `Location sent to the business owner at ${lastShared}. Sharing is on.` : "Waiting for your device's GPS location to send to the business owner..."}</p>}
      <button type="button" onClick={() => {
        if (!navigator.geolocation || !window.isSecureContext) { setError("GPS sharing requires HTTPS (or localhost) and browser location access."); return; }
        setSharing(!sharing); setLastShared(null); setError("");
      }}>{sharing ? "Stop sharing location" : "Share delivery location"}</button>
    </>}
    {error && <p role="alert">{error}</p>}
    {!supplier && open && <TrackingView key={number} number={number} />}
  </div>;
}
