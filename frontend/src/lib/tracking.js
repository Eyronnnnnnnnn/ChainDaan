export const trackingNumberFor = (order) => order.trackingNumber || `CD-${order._id.toUpperCase()}`;
