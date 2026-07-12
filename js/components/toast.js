/**
 * toast.js — Petites notifications non bloquantes (bas d'écran).
 */
export function showToast(message, { duration = 2400 } = {}) {
  const root = document.getElementById("toast-root");
  if (!root) return;

  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  root.appendChild(el);

  setTimeout(() => {
    el.style.transition = "opacity 200ms ease";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 200);
  }, duration);
}
