import { useRef, useState } from "react";
import { profileApi } from "../api/client.js";
import Avatar from "./Avatar.jsx";
import { CameraIcon, CheckIcon, XIcon } from "./Icons.jsx";

export default function ProfilePictureUpload({ user, onUpdated }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [cropSource, setCropSource] = useState(null);
  const [cropImage, setCropImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  function chooseFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user?._id) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("Choose a JPG, PNG, or WebP image up to 5 MB.");
      return;
    }
    setError("");
    const source = URL.createObjectURL(file);
    setCropSource(source);
    setCropImage(null);
    setZoom(1);
    setCropPosition({ x: 0, y: 0 });
  }

  function closeCrop() {
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource(null);
    setCropImage(null);
  }

  async function upload(file) {
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
    }
  }

  function uploadCrop() {
    if (!cropImage) return;
    const previewSize = 320;
    const guideSize = previewSize * 0.76;
    const imageScale = Math.max(
      previewSize / cropImage.naturalWidth,
      previewSize / cropImage.naturalHeight,
    );
    const sourceScale = imageScale * zoom;
    const cropSize = guideSize / sourceScale;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    canvas.getContext("2d").drawImage(
      cropImage,
      (cropImage.naturalWidth - cropSize) / 2 - cropPosition.x / sourceScale,
      (cropImage.naturalHeight - cropSize) / 2 - cropPosition.y / sourceScale,
      cropSize,
      cropSize,
      0,
      0,
      512,
      512,
    );
    canvas.toBlob((blob) => {
      if (!blob) return;
      closeCrop();
      upload(new File([blob], "profile-picture.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.9);
  }

  function startDrag(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: cropPosition.x,
      offsetY: cropPosition.y,
    };
  }

  function moveDrag(event) {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    setCropPosition({
      x: dragRef.current.offsetX + event.clientX - dragRef.current.startX,
      y: dragRef.current.offsetY + event.clientY - dragRef.current.startY,
    });
  }

  function stopDrag() {
    dragRef.current = null;
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
            <CameraIcon size={22} />
          </div>
        </button>
        <button
          type="button"
          className="profile-photo-badge"
          onClick={() => inputRef.current?.click()}
          aria-label="Change photo"
          title="Change photo"
        >
          <CameraIcon size={14} />
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={chooseFile}
        hidden
      />
      {cropSource && (
        <div className="crop-modal-backdrop" role="dialog" aria-modal="true" aria-label="Crop profile picture">
          <div className="crop-modal">
            <div className="crop-modal-head">
              <div>
                <p className="dashboard-kicker">PROFILE PHOTO</p>
                <h3>Adjust your picture</h3>
              </div>
              <button type="button" className="crop-close" onClick={closeCrop} aria-label="Cancel crop">
                <XIcon size={18} />
              </button>
            </div>
            <div
              className="crop-stage"
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
              title="Drag the image to adjust the crop"
            >
              <img
                src={cropSource}
                alt="Crop preview"
                style={{ transform: `translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${zoom})` }}
                onLoad={(event) => setCropImage(event.currentTarget)}
                onError={() => {
                  closeCrop();
                  setError("That image could not be opened.");
                }}
              />
              <div className="crop-guide" aria-hidden="true" />
            </div>
            <label className="crop-zoom">
              <span>Zoom</span>
              <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
            </label>
            <div className="crop-actions">
              <button type="button" className="crop-cancel" onClick={closeCrop}>Cancel</button>
              <button type="button" className="crop-confirm" onClick={uploadCrop} disabled={!cropImage || uploading}>
                <CheckIcon size={15} /> {uploading ? "Uploading..." : "Use photo"}
              </button>
            </div>
          </div>
        </div>
      )}
      {uploading && <small className="upload-status">Uploading photo...</small>}
      {error && <small className="form-error upload-error">{error}</small>}
    </div>
  );
}