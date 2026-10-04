import { useEffect, useRef, useState } from "react";
import { orderApi } from "../api/client.js";
import "./PaymentDetails.css";

export function ImagePreview({ file, savedUrl, alt }) {
  const preview = useRef(null);
  useEffect(() => {
    if (!file) {
      if (preview.current) preview.current.src = savedUrl || "";
      return;
    }
    const url = URL.createObjectURL(file);
    preview.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, savedUrl]);
  return file || savedUrl ? (
    <img
      ref={preview}
      className="payment-image"
      src={savedUrl || undefined}
      alt={alt}
    />
  ) : null;
}

export function GCashFields({ qrUrl, values, onChange }) {
  return (
    <section className="gcash-checkout">
      <div className="payment-heading">
        <img className="payment-brand" src="/images/gcash-logo.svg" alt="GCash" width="72" height="61" />
        <div>
          <h3>Pay with GCash</h3>
          <p>Scan the supplier's QR code, then submit your payment details.</p>
        </div>
      </div>
      {qrUrl ? (
        <a href={qrUrl} target="_blank" rel="noreferrer">
          <img
            className="payment-image gcash-qr"
            src={qrUrl}
            alt="Supplier GCash QR code for this product"
          />
        </a>
      ) : (
        <p role="alert">
          This supplier has not added a GCash QR code for this product.
        </p>
      )}
      <div className="modal-fields">
        <label>
          GCash account name
          <input
            required
            minLength={2}
            maxLength={100}
            value={values.gcashName || ""}
            onChange={(e) => onChange({ ...values, gcashName: e.target.value })}
            placeholder="Name used for payment"
          />
        </label>
        <label>
          GCash mobile number
          <input
            required
            type="tel"
            value={values.gcashPhone || ""}
            onChange={(e) =>
              onChange({ ...values, gcashPhone: e.target.value })
            }
            placeholder="09XXXXXXXXX"
          />
        </label>
      </div>
      <label>
        Reference number
        <input
          required
          inputMode="numeric"
          pattern="[0-9]{10,20}"
          title="Enter 10–20 digits from your GCash receipt"
          value={values.gcashReference || ""}
          onChange={(e) =>
            onChange({ ...values, gcashReference: e.target.value })
          }
          placeholder="Reference number from your receipt"
        />
      </label>
      <label>
        Payment proof
        <input
          required
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && file.size > 5 * 1024 * 1024) {
              e.target.setCustomValidity("Choose an image up to 5 MB.");
              e.target.reportValidity();
            } else e.target.setCustomValidity("");
            onChange({ ...values, paymentProof: file || null });
          }}
        />
        <small>
          Upload your receipt screenshot. JPG, PNG or WEBP, up to 5 MB.
        </small>
      </label>
      <ImagePreview file={values.paymentProof} alt="Selected payment proof" />
      <p className="payment-hint">
        Your supplier will review the receipt before confirming your order.
      </p>
    </section>
  );
}

function PaymentProof({ orderId }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let objectUrl;
    orderApi
      .proof(orderId)
      .then((blob) => {
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [orderId]);
  return error ? (
    <p role="alert">{error}</p>
  ) : url ? (
    <a href={url} target="_blank" rel="noreferrer">
      <img className="payment-image" src={url} alt="Buyer payment proof" />
    </a>
  ) : (
    <p>Loading receipt...</p>
  );
}

export default function PaymentDetails({ order, supplier = false, onUpdated }) {
  const [showProof, setShowProof] = useState(false);
  const [note, setNote] = useState("");
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (order.paymentMethod !== "GCash")
    return (
      <div className="payment-panel">
        <span className="payment-badge">Cash on Delivery</span>
        <p>Pay when your order arrives.</p>
      </div>
    );
  const payment = order.payment || {};
  const status = payment.status || "pending";
  const active = !["completed", "cancelled"].includes(order.status);
  async function submit(action) {
    setBusy(true);
    setError("");
    try {
      const updated = await action();
      onUpdated?.(updated);
      setShowProof(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="payment-panel">
      <div className="payment-heading">
        <h4>GCash payment</h4>
        <span className={`payment-badge ${status}`}>
          {status === "pending" ? "Awaiting review" : status}
        </span>
      </div>
      <dl className="payment-facts">
        <div>
          <dt>Account name</dt>
          <dd>{payment.gcashName}</dd>
        </div>
        <div>
          <dt>Mobile number</dt>
          <dd>{payment.gcashPhone}</dd>
        </div>
        <div>
          <dt>Reference number</dt>
          <dd>{payment.gcashReference}</dd>
        </div>
      </dl>
      <button
        type="button"
        className="secondary-action"
        onClick={() => setShowProof(!showProof)}
      >
        {showProof ? "Hide receipt" : "View payment proof"}
      </button>
      {showProof && (
        <PaymentProof key={payment.submittedAt} orderId={order._id} />
      )}
      {payment.reviewNote && (
        <p>
          <strong>Supplier note:</strong> {payment.reviewNote}
        </p>
      )}
      {supplier && status === "pending" && active && (
        <>
          <p>
            Check the payment in your GCash account before approving this
            receipt.
          </p>
          <label>
            Review note
            <textarea
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Required when rejecting a payment"
            />
          </label>
          <div className="payment-actions">
            <button
              type="button"
              className="primary-action"
              disabled={busy}
              onClick={() =>
                submit(() =>
                  orderApi.reviewPayment(order._id, "approved", note),
                )
              }
            >
              Approve payments
            </button>
            <button
              type="button"
              className="secondary-action"
              disabled={busy || !note.trim()}
              onClick={() =>
                submit(() =>
                  orderApi.reviewPayment(order._id, "rejected", note),
                )
              }
            >
              Reject payment
            </button>
          </div>
        </>
      )}
      {!supplier && status === "rejected" && order.status === "pending" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(() => orderApi.resubmitPayment(order._id, values));
          }}
        >
          <GCashFields
            qrUrl={payment.qrUrl}
            values={values}
            onChange={setValues}
          />
          <button className="primary-action" disabled={busy} type="submit">
            {busy ? "Submitting..." : "Resubmit payment proof"}
          </button>
        </form>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
