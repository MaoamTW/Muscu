import { registerRoute, setOnNavigate, startRouter, renderCurrentRoute, navigateTo } from "./router.js";
import { getProfile } from "./state.js";
import { seedDefaultExercisesIfNeeded } from "./seed.js";

import * as onboardingPage from "./pages/onboarding.js";
import * as homePage from "./pages/home.js";
import * as programPage from "./pages/program.js";
import * as sessionPage from "./pages/session.js";
import * as historyPage from "./pages/history.js";
import * as calendarPage from "./pages/calendar.js";
import * as historyDetailPage from "./pages/historyDetail.js";
import * as exercisesPage from "./pages/exercises.js";
import * as statsPage from "./pages/stats.js";
import * as recordsPage from "./pages/records.js";
import * as profilePage from "./pages/profile.js";

const ROUTE_META = {
  onboarding: { hideChrome: true }, // écran plein, pas de header ni de tabbar
  home: { eyebrow: "Forge", title: "Accueil" },
  program: { eyebrow: "Objectif", title: "Programme" },
  session: { eyebrow: "En cours", title: "Séance" },
  history: { eyebrow: "Suivi", title: "Historique", back: "home" },
  "history-detail": { eyebrow: "Historique", title: "Détail de la séance", back: "history" },
  calendar: { eyebrow: "Suivi", title: "Calendrier", back: "history" },
  exercises: { eyebrow: "Bibliothèque", title: "Exercices", back: "program" },
  stats: { eyebrow: "Suivi", title: "Statistiques" },
  records: { eyebrow: "Suivi", title: "Records personnels", back: "stats" },
  profile: { eyebrow: "Toi", title: "Profil" },
};

function renderHeader(routeName) {
  // Expose la route courante sur <body> pour permettre un léger accent de
  // couleur différent par section (voir css/base.css), sans logique JS.
  document.body.dataset.route = routeName || "home";

  const header = document.getElementById("app-header");
  const tabbar = document.getElementById("tabbar");
  const meta = ROUTE_META[routeName] || ROUTE_META.home;

  if (meta.hideChrome) {
    header.innerHTML = "";
    header.style.display = "none";
    tabbar.style.display = "none";
    return;
  }

  header.style.display = "";
  tabbar.style.display = "";
  tabbar.classList.remove("is-hidden"); // toujours visible en arrivant sur une nouvelle page

  header.innerHTML = `
    <div class="header-row">
      <div>
        <span class="page-eyebrow">${meta.eyebrow ?? ""}</span>
        <h1 class="page-title">${meta.title ?? ""}</h1>
      </div>
      ${
        meta.back
          ? `<a class="icon-btn" href="#/${meta.back}" aria-label="Retour" style="transform: rotate(180deg);">
               <span class="icon icon-chevron"></span>
             </a>`
          : ""
      }
    </div>
  `;
}

function updateActiveTab(routeName) {
  document.querySelectorAll(".tab-item").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.route === routeName);
  });
}

/**
 * Masque la barre de navigation flottante quand on défile vers le bas (pour
 * laisser plus de place au contenu), et la réaffiche dès qu'on remonte.
 * Purement visuel (classe CSS `.is-hidden`, voir css/components.css) — ne
 * touche à aucune donnée ni logique de navigation.
 */
function setupTabbarAutoHide() {
  const tabbar = document.getElementById("tabbar");
  let lastScrollY = window.scrollY;
  let ticking = false;
  const HIDE_THRESHOLD = 80; // évite de masquer dès les tout premiers pixels de scroll

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const scrollingDown = currentY > lastScrollY;

        if (scrollingDown && currentY > HIDE_THRESHOLD) {
          tabbar.classList.add("is-hidden");
        } else {
          tabbar.classList.remove("is-hidden");
        }

        lastScrollY = currentY;
        ticking = false;
      });
    },
    { passive: true }
  );
}

async function bootstrap() {
  // 1. Prépare les données locales (base IndexedDB + exercices par défaut)
  await seedDefaultExercisesIfNeeded();

  // 2. Enregistre toutes les routes
  registerRoute("onboarding", onboardingPage.render);
  registerRoute("home", homePage.render);
  registerRoute("program", programPage.render);
  registerRoute("session", sessionPage.render);
  registerRoute("exercises", exercisesPage.render);
  registerRoute("stats", statsPage.render);
  registerRoute("records", recordsPage.render);
  registerRoute("calendar", calendarPage.render);
  registerRoute("profile", profilePage.render);

  // "#/history/xyz" doit utiliser la vue "history-detail" tout en gardant l'URL lisible.
  registerRoute("history", async (view, param) => {
    if (param) {
      await historyDetailPage.render(view, param);
      renderHeader("history-detail");
      updateActiveTab("history");
    } else {
      await historyPage.render(view);
      renderHeader("history");
      updateActiveTab("history");
    }
  });

  setOnNavigate((name) => {
    sessionPage.cancelActiveWarmup();
    renderHeader(name || "home");
    updateActiveTab(name || "home");
  });

  // 3. Détermine l'écran de démarrage : onboarding si aucun objectif choisi
  const profile = await getProfile();
  const hasRoute = window.location.hash.length > 1;
  if (!hasRoute) {
    navigateTo(profile.objective ? "home" : "onboarding");
  }

  // 4. Démarre le routeur
  startRouter();
  setupTabbarAutoHide();
  await renderCurrentRoute();

  // 5. PWA : enregistrement du service worker (fonctionnement hors ligne)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch((err) => {
        console.warn("Service worker non enregistré :", err);
      });
    });
  }
}

bootstrap();
