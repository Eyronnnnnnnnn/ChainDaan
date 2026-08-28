import { useState, useEffect } from "react";
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
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

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
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

