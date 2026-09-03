const API_URL = import.meta.env.VITE_API_URL || "";

export async function readJsonResponse(response) {
  const body = await response.text();
  if (!body) return null;

  try {
    return JSON.parse(body);
  } catch {
    throw new Error("The server returned an invalid response. Please try again.");
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem("chaindaan_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(data?.error || "Request failed.");
  return data;
}

export const profileApi = {
  update: (id, data) =>
    request(`/api/profiles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  uploadPhoto: (id, file) => {
    const body = new FormData();
    body.append("photo", file);
    return request(`/api/profiles/${id}/photo`, { method: "POST", body });
  },
};

export const productApi = {
  list: () => request("/api/products"),
  create: (data) => {
    const body = new FormData();
    body.append("name", data.name);
    body.append("category", data.category);
    body.append("price", data.price);
    body.append("stock", data.stock);
    data.images.forEach((image) => body.append("images", image));
    return request("/api/products", { method: "POST", body });
  },
  remove: (id) => request(`/api/products/${id}`, { method: "DELETE" }),
};

export const chatApi = {
  conversations: () => request("/api/conversations"),
  createConversation: (participantId) =>
    request("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ participantId }),
    }),
  messages: (conversationId) =>
    request(`/api/messages?conversationId=${conversationId}`),
  sendMessage: (conversationId, recipientId, text) =>
    request("/api/messages", {
      method: "POST",
      body: JSON.stringify({ conversationId, recipientId, text }),
    }),
};

export const orderApi = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    const queryString = query.toString();
    return request(`/api/orders${queryString ? `?${queryString}` : ""}`);
  },
  create: (data) =>
    request("/api/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStatus: (id, status) =>
    request(`/api/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

export { request };
