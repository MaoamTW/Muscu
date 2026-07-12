import { getProfile } from "../state.js";
import { dbGetAll } from "../db.js";
import { renderRing } from "../components/ring.js";
import { navigateTo } from "../router.js";
import { ensureProgramForObjective } from "../engine/programGenerator.js";

export async function render(container) {
  const profile = await getProfile();
  const sessions = await dbGetAll("sessions");
  const sessionCount = sessions.length;
  const firstName = profile.firstName || "";

  const program = profile.objective ? await ensureProgramForObjective(profile.objective) : null;

  const programBlock = program
    ? `
      <div class="card" id="program-card" style="cursor:pointer;">
        <div class="header-row">
          <div>
            <span class="page-eyebrow">Programme actuel</span>
            <div class="card-title">${program.objectiveLabel}</div>
            <div class="card-sub">${program.frequencyLabel} · ${program.days.length} type${program.days.length > 1 ? "s" : ""} de séance</div>
          </div>
          <span class="icon icon-chevron list-row-chevron"></span>
        </div>
      </div>
    `
    : `
      <div class="empty-state">
        <div class="empty-icon"><span class="icon icon-dumbbell"></span></div>
        <h3>Pas encore de programme</h3>
        <p>Choisis un objectif pour recevoir automatiquement un programme adapté.</p>
        <button class="btn btn-secondary" id="go-program">Choisir un objectif</button>
      </div>
    `;

  container.innerHTML = `
    <div class="card hero-ring-card">
      ${renderRing(0, { value: "0", label: "séances", size: 84 })}
      <div class="hero-info">
        <h2>${firstName ? `Salut ${firstName} 👋` : "Bienvenue 👋"}</h2>
        <p>${
          profile.objectiveLabel
            ? `Objectif actuel : <strong>${profile.objectiveLabel}</strong>`
            : `Aucun objectif défini pour l'instant`
        }</p>
      </div>
    </div>

    <div class="quick-actions">
      <button class="btn btn-primary" id="start-session">Démarrer une séance</button>
    </div>

    <div class="section">
      <div class="section-title">Cette semaine</div>
      <div class="stat-grid">
        <div class="stat-tile">
          <span class="stat-value">${sessionCount}</span>
          <span class="stat-label">Séances au total</span>
        </div>
        <div class="stat-tile">
          <span class="stat-value">0</span>
          <span class="stat-label">Jours de suite</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="header-row">
        <div class="section-title" style="margin-bottom:0;">Programme</div>
        ${program ? `<a href="#/program" class="btn-ghost">Voir le détail</a>` : ""}
      </div>
      ${programBlock}
    </div>

    <div class="section">
      <div class="header-row">
        <div class="section-title" style="margin-bottom:0;">Derniers records</div>
        <a href="#/records" class="btn-ghost">Tout voir</a>
      </div>
      <div class="empty-state">
        <div class="empty-icon"><span class="icon icon-trophy"></span></div>
        <h3>Aucun record pour l'instant</h3>
        <p>Tes records personnels apparaîtront ici dès ta première séance.</p>
      </div>
    </div>
  `;

  container.querySelector("#start-session").addEventListener("click", () => navigateTo("session"));
  container.querySelector("#go-program")?.addEventListener("click", () => navigateTo("program"));
  container.querySelector("#program-card")?.addEventListener("click", () => navigateTo("program"));
}
