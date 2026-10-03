Order tracking
==============

Every order exposes a stable, unique tracking number (CD- followed by its order ID), including existing orders. It is shown after checkout and on both order dashboards. The home page tracking form looks up real tracking data for the signed-in buyer or supplier.

After confirming an order, the supplier opens Incoming Orders and selects Share delivery location on the device travelling with the parcel. The browser must allow location access and use HTTPS (localhost works for development). Keep the page open and the device awake. Closing the page, navigating away, stopping sharing, or completing/cancelling the order ends GPS capture. This is browser foreground tracking, not a background courier app.

GPS uploads are throttled to at most one per ten seconds per open order. Positions are stored separately from sales and broadcast to the authenticated buyer/supplier Socket.IO rooms. The map also refreshes every thirty seconds and on reconnect. It shows the last reported timestamp, accuracy and a line connecting recorded positions; it does not infer roads, unrecorded travel or an ETA. Updates older than one minute are labelled paused. A stopped device may remain labelled recent until that interval expires.

Map tiles require internet access to tile.openstreetmap.org. Map rendering uses Leaflet 1.9.4 and retains OpenStreetMap attribution. No map API key is needed. GPS locations are supplied by the supplier's browser, not verified by a courier service.

Validation: run `node --test backend/tracking.test.js`, `npm.cmd --prefix frontend run lint`, and `npm.cmd --prefix frontend run build`. Handler tests use mocked storage. Real database persistence and device-to-device GPS should also be checked in the deployed environment.

References: https://leafletjs.com/reference.html and https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition
