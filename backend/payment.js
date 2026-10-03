export const COD = "Cash on Delivery (COD)";
export function validatePayment(body, file, qrUrl) {
  const method = body.paymentMethod || COD;
  if (![COD, "GCash"].includes(method)) throw new Error("Choose Cash on Delivery or GCash.");
  if (method === COD) return { status: "cod" };
  if (!qrUrl) throw new Error("This product does not have a GCash QR code. Choose Cash on Delivery.");
  const name = String(body.gcashName || "").trim();
  const phone = String(body.gcashPhone || "").replace(/[\s()-]/g, "");
  const reference = String(body.gcashReference || "").trim();
  if (name.length < 2 || name.length > 100) throw new Error("Enter the GCash account name (2–100 characters).");
  if (!/^(09\d{9}|\+639\d{9})$/.test(phone)) throw new Error("Enter a valid Philippine GCash mobile number.");
  if (!/^\d{10,20}$/.test(reference)) throw new Error("Enter the numeric GCash reference number (10–20 digits).");
  if (!validImage(file)) throw new Error("Upload payment proof as JPG, PNG or WEBP, up to 5 MB.");
  return { status: "pending", gcashName: name, gcashPhone: phone, gcashReference: reference,
    qrUrl, proof: file.buffer, proofType: file.mimetype, submittedAt: new Date() };
}
export function validImage(file) {
  if (!file?.buffer || file.buffer.length > 5 * 1024 * 1024) return false;
  const b = file.buffer;
  return (file.mimetype === "image/png" && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) ||
    (file.mimetype === "image/jpeg" && b[0] === 255 && b[1] === 216 && b[2] === 255) ||
    (file.mimetype === "image/webp" && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP");
}
