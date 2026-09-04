import { useState } from "react";
import { profileApi } from "../api/client.js";
import { logout } from "../lib/session.js";

const confirmationPhrase = "Delete My Account";

export default function DeleteAccountModal({ onClose }) {
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isConfirmed = confirmation === confirmationPhrase;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isConfirmed || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      await profileApi.removeAccount(confirmation);
      logout();
    } catch (requestError) {
      setError(requestError.message || "Unable to delete your account.");
      setSubmitting(false);
    }
  }

  return (
    <div className="delete-account-backdrop" role="presentation" onMouseDown={onClose}>
      <form
        className="delete-account-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onSubmit={handleSubmit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="delete-account-title">Delete your account?</h2>
        <p>
          This permanently removes your profile and related products, orders, and messages. This action cannot be undone.
        </p>
        <label>
          Type <strong>{confirmationPhrase}</strong> to confirm
          <input
            autoFocus
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={confirmationPhrase}
            disabled={submitting}
          />
        </label>
        {error && <p className="delete-account-error">{error}</p>}
        <div className="delete-account-actions">
          <button className="secondary-action" onClick={onClose} disabled={submitting} type="button">
            Cancel
          </button>
          <button className="delete-account-button" disabled={!isConfirmed || submitting} type="submit">
            {submitting ? "Deleting..." : "Delete account"}
          </button>
        </div>
      </form>
    </div>
  );
}
