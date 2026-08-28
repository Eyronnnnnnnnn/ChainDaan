import { useRef, useState } from "react";
import { profileApi } from "../api/client.js";
import Avatar from "./Avatar.jsx";

export default function ProfilePictureUpload({ user, onUpdated }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file || !user?._id) return;
    setError("");
    setUploading(true);
    try {
      const updated = await profileApi.uploadPhoto(user._id, file);
      localStorage.setItem("chaindaan_user", JSON.stringify(updated));
      if (onUpdated) onUpdated(updated);
    } catch (uploadError) {
      setError(uploadError.message || "Failed to upload photo.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="profile-photo-upload">
      <div className="profile-photo-wrapper">
        <button
          type="button"
          className="profile-photo-btn"
          onClick={() => inputRef.current?.click()}
          aria-label="Upload profile picture"
          title="Click to upload profile picture"
        >
          <Avatar user={user} size="large" />
          <div className="profile-photo-overlay" aria-hidden="true">
            <span className="profile-photo-overlay-icon">📷</span>
          </div>
        </button>
        <button
          type="button"
          className="profile-photo-badge"
          onClick={() => inputRef.current?.click()}
          aria-label="Change photo"
          title="Change photo"
        >
          📷
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={upload}
        hidden
      />
      {uploading && <small className="upload-status">Uploading photo...</small>}
      {error && <small className="form-error upload-error">{error}</small>}
    </div>
  );
}