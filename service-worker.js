/**
 * service-worker.js — Cache l'intégralité de l'app shell pour permettre
 * un fonctionnement complet hors ligne après la première visite.
 *
 * Stratégie : "cache first, fallback network" pour les fichiers de l'app,
 * avec mise à jour du cache en arrière-plan (stale-while-revalidate léger).
 * Incrémenter CACHE_NAME force le renouvellement du cache lors d'un déploiement.
 */

const CACHE_NAME = "forge-cache-v14";

const APP_SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",

  "./css/tokens.css",
  "./css/base.css",
  "./css/icons.css",
  "./css/components.css",
  "./css/pages.css",

  "./js/app.js",
  "./js/db.js",
  "./js/router.js",
  "./js/seed.js",
  "./js/state.js",
  "./js/data/objectives.js",
  "./js/data/programTemplates.js",
  "./js/data/exerciseWeightRatios.js",
  "./js/data/equipment.js",
  "./js/components/ring.js",
  "./js/components/toast.js",
  "./js/components/barChart.js",
  "./js/engine/programGenerator.js",
  "./js/engine/progressionEngine.js",
  "./js/engine/recordsEngine.js",
  "./js/engine/statsEngine.js",
  "./js/engine/substitutionEngine.js",
  "./js/engine/durationAdapter.js",
  "./js/pages/onboarding.js",
  "./js/pages/home.js",
  "./js/pages/program.js",
  "./js/pages/session.js",
  "./js/pages/history.js",
  "./js/pages/historyDetail.js",
  "./js/pages/exercises.js",
  "./js/pages/stats.js",
  "./js/pages/records.js",
  "./js/pages/profile.js",

  "./data/exercices-predefinis.json",
  "./data/regles-programmes.json",

  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./icons/favicon-16.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // hors ligne : on retombe sur le cache

      return cached || networkFetch;
    })
  );
});
