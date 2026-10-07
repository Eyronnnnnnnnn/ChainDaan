const fields = {
  "/register": ["role", "fullName", "name", "email", "phone", "town", "password", "confirmPassword"],
  "/login": ["email", "password"],
  "/forgot-password": ["email"],
  "/reset-password": ["token", "password", "confirmPassword"],
};

export function validateAuthInput(request, response, next) {
  const required = fields[request.path];
  if (request.method !== "POST" || !required) return next();
  const body = request.body;
  if (!body || Array.isArray(body) || required.some((field) => typeof body[field] !== "string" || !body[field].trim()) ||
      ["role", "category"].some((field) => body[field] !== undefined && typeof body[field] !== "string") ||
      (body.role !== undefined && !["business", "supplier"].includes(body.role))) {
    return response.status(400).json({ error: "Provide valid text for all required account fields." });
  }
  return next();
}
