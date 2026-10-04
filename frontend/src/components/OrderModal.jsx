import { useEffect, useRef, useState } from "react";
import { trackingNumberFor } from "../lib/tracking.js";
import { orderApi } from "../api/client.js";
import { GCashFields } from "./PaymentDetails.jsx";

export default function OrderModal({ product, supplier, currentUser = {}, onClose, onOrderPlaced, onTrackOrder }) {
  const [quantity, setQuantity] = useState(1);
  const [deliveryTown, setDeliveryTown] = useState(currentUser.town || "");
  const [deliveryAddress, setDeliveryAddress] = useState(currentUser.deliveryInfo || "");
  const [contactPhone, setContactPhone] = useState(currentUser.phone || "");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery (COD)");
  const [gcash, setGcash] = useState({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const dialogRef = useRef(null);
  const submittingRef = useRef(false);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!product) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape" && !submittingRef.current) closeRef.current();
      if (event.key !== "Tab") return;
      const elements = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')].filter((element) => element.getClientRects().length);
      const first = elements[0], last = elements.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handleKey); previousFocus?.focus(); };
  }, [product]);

  if (!product) return null;

  const unitPrice = Number(product.price || 0);
  const totalAmount = Math.round(unitPrice * quantity * 100) / 100;
  const supplierName = supplier?.name || product.supplier || "Supplier";
  const maxStock = Math.max(0, Math.floor(Number(product.stock) || 0));

  async function handleSubmit(event) {
    event.preventDefault();
    if (submittingRef.current) return;
    if (!deliveryAddress.trim()) {
      setError("Please provide a complete delivery address.");
      return;
    }
    if (!deliveryTown.trim()) {
      setError("Please specify the delivery municipality.");
      return;
    }
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > maxStock) {
      setError(maxStock < 1 ? "This product is out of stock." : `Choose a whole quantity between 1 and ${maxStock}.`);
      return;
    }

    setError("");
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const order = await orderApi.create({
        productId: product._id,
        quantity,
        deliveryTown: deliveryTown.trim(),
        deliveryAddress: deliveryAddress.trim(),
        contactPhone: contactPhone.trim(),
        paymentMethod,
        ...(paymentMethod === "GCash" ? gcash : {}),
        notes: notes.trim(),
      });
      setPlacedOrder(order);
      setSuccess(true);
      if (onOrderPlaced) onOrderPlaced(order);
    } catch (err) {
      setError(err.message || "Failed to place order. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => { if (!submittingRef.current) onClose(); }}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={success ? "Order submitted" : "Place an order"} className="product-modal order-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" disabled={submitting} onClick={onClose} type="button" aria-label="Close modal">
          ×
        </button>

        {success ? (
          <div className="order-success-view">
            <div className="order-success-icon">✓</div>
            <p className="dashboard-kicker">ORDER SUBMITTED</p>
            <h2>Inquiry & Order Sent!</h2>
            <p>
              Your order for <strong>{product.name}</strong> has been sent to <strong>{supplierName}</strong>.
            </p>

            <div className="order-summary-box">
              <div className="summary-row"><span>Tracking number:</span><b style={{ overflowWrap: "anywhere" }}>{placedOrder && trackingNumberFor(placedOrder)}</b></div>
              <div className="summary-row">
                <span>Quantity:</span>
                <b>{placedOrder?.quantity || quantity} units</b>
              </div>
              <div className="summary-row">
                <span>Total Amount:</span>
                <strong className="summary-total">₱{(placedOrder?.total || totalAmount).toLocaleString()}</strong>
              </div>
              <div className="summary-row">
                <span>Delivery to:</span>
                <span>{placedOrder?.deliveryAddress || deliveryAddress}, {placedOrder?.deliveryTown || deliveryTown}</span>
              </div>
              <div className="summary-row">
                <span>Status:</span>
                <span className="order-status-badge pending">⏳ Awaiting Supplier Confirmation</span>
              </div>
              <div className="summary-row"><span>Payment:</span><b>{placedOrder?.paymentMethod === "GCash" ? "GCash — awaiting supplier review" : "Cash on Delivery"}</b></div>
            </div>

            {onTrackOrder && <button className="primary-action" type="button" onClick={onTrackOrder}>Track this order</button>}
            <p className="order-notice">
              You will see real-time updates in your <strong>&quot;My Orders&quot;</strong> tab as soon as the supplier approves and confirms your order.
            </p>

            <button
              className="primary-action"
              style={{ width: "100%", marginTop: "12px" }}
              onClick={onClose}
              type="button"
            >
              Done & Continue Sourcing
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="dashboard-kicker">ORDER / INQUIRE</p>
            <h2>Buy from {supplierName}</h2>
            <p className="order-subtitle">
              Fill in your order requirements and delivery location for this product.
            </p>

            {/* Product Snapshot */}
            <div className="order-product-snapshot">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="snapshot-img" />
              ) : (
                <div className="snapshot-placeholder">📦</div>
              )}
              <div>
                <h4>{product.name}</h4>
                <span className="snapshot-category">{product.category || "General"}</span>
                <div className="snapshot-pricing">
                  <strong>₱{unitPrice.toLocaleString()}</strong> / unit
                  {product.stock !== undefined && (
                    <span className="snapshot-stock"> · {product.stock} available</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="modal-fields">
              <label>
                QUANTITY (PCS/UNITS) *
                <div className="quantity-control">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity" disabled={submitting || quantity <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={maxStock}
                    step="1"
                    aria-label="Quantity"
                    disabled={submitting || maxStock < 1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                  />
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={submitting || quantity >= maxStock}
                    onClick={() => setQuantity((q) => Math.min(maxStock, Number(q) + 1))}
                  >
                    +
                  </button>
                </div>
              </label>

              <label>
                PAYMENT METHOD
                <select value={paymentMethod} disabled={submitting} onChange={(e) => { setPaymentMethod(e.target.value); setGcash({}); setError(""); }}>
                  <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                  <option value="GCash" disabled={!product.gcashQrUrl}>GCash{!product.gcashQrUrl ? " (QR not available)" : ""}</option>
                </select>
              </label>
            </div>

            {paymentMethod === "GCash" && <GCashFields qrUrl={product.gcashQrUrl} values={gcash} onChange={setGcash} />}
            {/* Delivery Details */}
            <div className="modal-fields">
              <label>
                MUNICIPALITY *
                <input
                  value={deliveryTown}
                  onChange={(e) => setDeliveryTown(e.target.value)}
                  placeholder="e.g. Laoag City, San Nicolas"
                  required
                />
              </label>

              <label>
                CONTACT PHONE NUMBER
                <input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="09XX-XXX-XXXX"
                  type="tel"
                />
              </label>
            </div>

            <label>
              EXACT DELIVERY ADDRESS (STREET, BARANGAY, LANDMARK) *
              <input
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="e.g. Store #12, Rizal St., Brgy. 1, near Plaza"
                required
              />
            </label>

            <label className="full-field">
              SPECIAL INSTRUCTIONS / NOTES TO SUPPLIER
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Preferred delivery time, packaging instructions, bulk order discounts..."
                rows="2"
              />
            </label>

            {/* Total Calculation Card */}
            <div className="order-calc-card">
              <div className="calc-row">
                <span>Unit Price:</span>
                <span>₱{unitPrice.toLocaleString()} × {quantity}</span>
              </div>
              <div className="calc-row total-row">
                <b>Total Estimated Amount:</b>
                <strong>₱{totalAmount.toLocaleString()}</strong>
              </div>
            </div>

            {maxStock < 1 && <p className="form-error" role="alert">This product is out of stock.</p>}
            {error && <p className="form-error" role="alert">{error}</p>}

            <button className="primary-action modal-submit" type="submit" disabled={submitting || maxStock < 1}>
              {submitting ? "Submitting Order..." : `Confirm & Place Order (₱${totalAmount.toLocaleString()})`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
