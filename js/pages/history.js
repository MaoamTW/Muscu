import { dbGetAll } from "../db.js";
import { navigateTo } from "../router.js";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export async function render(container) {
  const sessions = await dbGetAll("sessions");
  sessions.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

  if (sessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="margin-top: var(--sp-6);">
        <div class="empty-icon"><span class="icon icon-history"></span></div>
        <h3>Aucune séance enregistrée</h3>
        <p>Ton historique apparaîtra ici après ta première séance.</p>
        <button class="btn btn-primary" id="go-session">Démarrer une séance</button>
      </div>
    `;
    container.querySelector("#go-session").addEventListener("click", () => navigateTo("session"));
    return;
  }

  container.innerHTML = `
    <div class="section" style="margin-top:0;">
      <a class="btn-ghost" href="#/calendar">📅 Voir le calendrier des séances</a>
    </div>
    <ul>
      ${sessions
        .map(
          (s) => `
        <li>
          <a class="list-row" href="#/history/${s.id}">
            <div>
              <div class="list-row-title">${formatDate(s.startedAt)}</div>
              <div class="list-row-sub">${s.exercises?.length ?? 0} exercice${
            (s.exercises?.length ?? 0) > 1 ? "s" : ""
          }</div>
            </div>
            <span class="icon icon-chevron list-row-chevron"></span>
          </a>
        </li>
      `
        )
        .join("")}
    </ul>
  `;
}
