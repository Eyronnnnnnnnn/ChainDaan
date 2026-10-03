import { useSyncExternalStore } from "react";
function snapshot() {
  const saved = localStorage.getItem("chaindaan_theme");
  return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function subscribe(callback) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", callback);
  window.addEventListener("chaindaan-theme", callback);
  media.addEventListener("change", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("chaindaan-theme", callback); media.removeEventListener("change", callback); };
}
export function useTheme() {
  const dark = useSyncExternalStore(subscribe, snapshot);
  return [dark, (value) => {
    const next = typeof value === "function" ? value(snapshot()) : value;
    localStorage.setItem("chaindaan_theme", next ? "dark" : "light");
    window.dispatchEvent(new Event("chaindaan-theme"));
  }];
}
