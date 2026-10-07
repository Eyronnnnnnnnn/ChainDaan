export function routeRedirect(token, user, requiredRole) {
  if (!token || !user?._id || !["business", "supplier"].includes(user.role)) return "/login";
  if (requiredRole && user.role !== requiredRole) return `/${user.role}-dashboard`;
  return null;
}
