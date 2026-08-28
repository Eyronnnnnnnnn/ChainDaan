import { useState } from "react";
import { orderApi } from "../api/client.js";

export default function OrderModal({ product, supplier, currentUser = {}, onClose, onOrderPlaced }) {
  const [quantity, setQuantity] = useState(1);
  const [deliveryTown, setDeliveryTown] = useState(currentUser.town || supplier?.town || "Laoag City");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactPhone, setContactPhone] = useState(currentUser.phone || "");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery (COD)");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  if (!product) return null;

  const unitPrice = Number(product.price || 0);
  const totalAmount = unitPrice * quantity;
  const supplierName = supplier?.name || product.supplier || "Supplier";
  const maxStock = product.stock !== undefined ? product.stock : 9999;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!deliveryAddress.trim()) {
      setError("Please provide a complete delivery address.");
      return;
    }
    if (!deliveryTown.trim()) {
      setError("Please specify the delivery municipality.");
      return;
    }
    if (quantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const order = await orderApi.create({
        productId: product._id,
        quantity,
        deliveryTown: deliveryTown.trim(),
        deliveryAddress: deliveryAddress.trim(),
        contactPhone: contactPhone.trim(),
        paymentMethod,
        notes: notes.trim(),
      });
      setPlacedOrder(order);
      setSuccess(true);
      if (onOrderPlaced) onOrderPlaced(order);
    } catch (err) {
      setError(err.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="product-modal order-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} type="button" aria-label="Close modal">
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
            </div>

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
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={maxStock > 0 ? maxStock : undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => (maxStock > 0 ? Math.min(maxStock, q + 1) : q + 1))}
                  >
                    +
                  </button>
                </div>
              </label>

              <label>
                PAYMENT METHOD
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                  <option value="GCash / Maya upon Delivery">GCash / Maya upon Delivery</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Supplier Terms (Invoice)">Supplier Invoice Terms</option>
                </select>
              </label>
            </div>

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

            {error && <p className="form-error" role="alert">{error}</p>}

            <button className="primary-action modal-submit" type="submit" disabled={submitting}>
              {submitting ? "Submitting Order..." : `Confirm & Place Order (₱${totalAmount.toLocaleString()})`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

