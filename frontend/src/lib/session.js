export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("chaindaan_user") || "null");
  } catch {
    return null;
  }
}

export function getInitials(user) {
  const name = user?.name || user?.fullName || "User";
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function logout() {
  localStorage.removeItem("chaindaan_token");
  localStorage.removeItem("chaindaan_user");
  window.location.href = "/login";
}
