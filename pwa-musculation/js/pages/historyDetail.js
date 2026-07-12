import { dbGet } from "../db.js";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}
function formatDuration(seconds = 0) {
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

export async function render(container, sessionId) {
  const session = await dbGet("sessions", sessionId);

  if (!session) {
    container.innerHTML = `
      <div class="empty-state" style="margin-top: var(--sp-6);">
        <h3>Séance introuvable</h3>
        <p>Cette séance n'existe plus ou a été supprimée.</p>
        <a class="btn btn-secondary" href="#/history">Retour à l'historique</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card">
      <span class="page-eyebrow">${formatDate(session.startedAt)}</span>
      <div class="card-title">Séance</div>
      <div class="card-sub">${formatDuration(session.durationSeconds)} · ${session.exercises?.length ?? 0} exercice(s)</div>
    </div>

    <div class="section">
      ${(session.exercises || [])
        .map(
          (ex) => `
        <div class="exercise-block">
          <div class="exercise-block-header">
            <span class="list-row-title">${ex.name}</span>
          </div>
          ${ex.sets
            .map(
              (set, i) => `
            <div class="set-row" style="grid-template-columns: 32px 1fr 1fr;">
              <span class="set-index">#${i + 1}</span>
              <span>${set.weight || "—"} kg</span>
              <span>${set.reps || "—"} reps</span>
            </div>
          `
            )
            .join("")}
        </div>
      `
        )
        .join("")}
    </div>
  `;
}
