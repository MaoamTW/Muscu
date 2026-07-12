/**
 * router.js — Routeur SPA minimaliste basé sur le hash.
 * -----------------------------------------------------------------------
 * Pas de dépendance externe : on écoute les changements de `location.hash`
 * et on délègue le rendu à la page correspondante. Fonctionne à l'identique
 * en ligne et hors ligne, et reste compatible avec un simple hébergement
 * de fichiers statiques (GitHub Pages, etc.).
 *
 * Format des routes : "#/nom" ou "#/nom/parametre" (ex: "#/history/abc123").
 */

const routes = new Map();
let notFoundHandler = null;
let onNavigate = null;

/** Enregistre une page pour un nom de route donné. */
export function registerRoute(name, handler) {
  routes.set(name, handler);
}

/** Définit le gestionnaire appelé si aucune route ne correspond. */
export function setNotFoundHandler(handler) {
  notFoundHandler = handler;
}

/** Définit un callback appelé à chaque navigation (route, param) — utile pour le header/tabbar. */
export function setOnNavigate(callback) {
  onNavigate = callback;
}

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [name, param] = raw.split("/");
  return { name: name || "", param: param || null };
}

/** Lance le rendu de la route actuelle. */
export async function renderCurrentRoute() {
  const { name, param } = parseHash();
  const handler = routes.get(name) || notFoundHandler;

  if (typeof onNavigate === "function") {
    onNavigate(name, param);
  }

  if (!handler) return;
  const view = document.getElementById("view");
  await handler(view, param);
  view.scrollTop = 0;
}

/** Change de route par programmation (équivalent à cliquer un lien). */
export function navigateTo(name, param) {
  window.location.hash = param ? `#/${name}/${param}` : `#/${name}`;
}

/** Démarre le routeur : écoute les changements de hash + rendu initial. */
export function startRouter() {
  window.addEventListener("hashchange", renderCurrentRoute);
}
