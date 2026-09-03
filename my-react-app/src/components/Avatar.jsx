import { useState } from "react";
import { getInitials } from "../lib/session.js";

export default function Avatar({
  user,
  src,
  name,
  size = "normal", // "small" | "normal" | "large" | "chat"
  color = "blue",  // "blue" | "orange" | "green" | "gold"
  className = "",
  alt = "Profile avatar",
}) {
  const photoUrl = src || user?.profilePhotoUrl;
  const displayName = name || user?.name || user?.fullName || "User";
  const initials = getInitials(user || { name: displayName });
  const [failedPhotoUrl, setFailedPhotoUrl] = useState(null);
  const imgError = failedPhotoUrl === photoUrl;

  const sizeClass =
    size === "small"
      ? "small"
      : size === "large"
      ? "profile-large"
      : size === "chat"
      ? "chat-size"
      : "";

  const colorClass = color ? `chat-avatar ${color}` : "profile-avatar";

  return (
    <div
      className={`profile-avatar ${colorClass} ${sizeClass} ${className}`.trim()}
      title={displayName}
      aria-label={displayName}
    >
      {photoUrl && !imgError ? (
        <img
          src={photoUrl}
          alt={displayName || alt}
          onError={() => setFailedPhotoUrl(photoUrl)}
          loading="lazy"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

