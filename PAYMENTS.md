Payment workflow
================

New orders accept Cash on Delivery or GCash only. Historical orders keep their original payment method.

Suppliers upload a product's GCash QR image through My Products → Add Product or Edit. QR images use the existing Cloudinary configuration. Editing without selecting a new QR keeps the saved one. A product without a QR accepts COD only.

Buyers choosing GCash see that product's QR and must submit an account name, Philippine mobile number, numeric reference number and receipt image. Images are limited to 5 MB and JPG/PNG/WEBP. This is manual supplier verification, not a GCash gateway integration. Suppliers should verify funds received before approving a receipt.

Incoming Orders shows payment details and authenticated receipt previews. Suppliers can approve or reject a pending payment; rejection requires a reason. The buyer sees the reason in My Orders and can submit corrected details and a replacement receipt. GCash orders cannot be confirmed or completed until payment is approved. Payment approval is separate from order confirmation.

Receipt buffers are stored in MongoDB and excluded from order JSON and normal database projections. Only the order buyer and supplier can retrieve a receipt. The QR used for an order is saved with the payment. Payment reviews notify both participants using their authenticated Socket.IO rooms. Legacy sales reads now require authentication and are scoped to the account; legacy direct sales creation is disabled to prevent bypassing payment validation.

Dark mode follows the system preference initially, remembers the user's choice across pages and reloads, and can be toggled from the dashboards or public pages. QR codes and receipts retain their original colors.

Validation: `node --test backend/payment.test.js backend/payment-routes.test.js backend/tracking.test.js`, `npm.cmd --prefix frontend run lint`, and `npm.cmd --prefix frontend run build`. Browser flow was checked with mocked API responses. Verify a real QR upload, order persistence, receipt retrieval, and supplier review against the configured Cloudinary/MongoDB environment before production use. Restart/redeploy the backend along with the frontend for these API changes.
