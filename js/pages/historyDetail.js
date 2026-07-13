import { dbGet } from "../db.js";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}
function formatDuration(seconds = 0) {
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

function renderExercise(ex) {
  const substitutionNote = ex.isSubstituted
    ? `<div class="exercise-sub">Remplace : ${ex.originalName}</div>`
    : "";

  if (ex.type === "duration") {
    return `
      <div class="exercise-block ${ex.validated ? "is-complete" : ""}">
        <div class="exercise-block-header">
          <div>
            <span class="list-row-title">${ex.name}</span>
            ${substitutionNote}
          </div>
          <span class="badge ${ex.validated ? "badge-success" : "badge-steel"}">
            ${ex.durationMinutes} min ${ex.validated ? "· terminé" : ""}
          </span>
        </div>
      </div>
    `;
  }

  if (ex.type === "hold") {
    return `
      <div class="exercise-block">
        <div class="exercise-block-header">
          <span class="list-row-title">${ex.name}</span>
        </div>
        ${(ex.sets || [])
          .map(
            (set) => `
          <div class="set-row ${set.validated ? "is-validated" : ""}" style="grid-template-columns: 28px 1fr 1fr 32px;">
            <span class="set-index">#${set.index + 1}</span>
            <span class="set-target">${set.targetLabel} maintien</span>
            <span></span>
            <span class="icon icon-check" style="opacity:${set.validated ? 1 : 0.2};"></span>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  const STATUS_LABEL = { easy: "Facile", hard: "Difficile", failed: "Ratée" };
  const STATUS_BADGE = { easy: "badge-success", hard: "badge-steel", failed: "badge-danger" };

  return `
    <div class="exercise-block">
      <div class="exercise-block-header">
        <div>
          <span class="list-row-title">${ex.name}</span>
          ${substitutionNote}
        </div>
      </div>
      ${(ex.sets || [])
        .map(
          (set) => `
        <div class="set-row" style="grid-template-columns: 28px 1fr 1fr 90px;">
          <span class="set-index">#${set.index + 1}</span>
          <span class="set-target">${set.targetLabel} reps</span>
          <span>${set.weight || "—"} kg</span>
          ${
            set.status
              ? `<span class="badge ${STATUS_BADGE[set.status]}">${STATUS_LABEL[set.status]}</span>`
              : `<span class="card-sub">Non renseignée</span>`
          }
        </div>
      `
        )
        .join("")}
    </div>
  `;
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
      <div class="card-title">${session.dayName || "Séance"}</div>
      <div class="card-sub">${formatDuration(session.durationSeconds)} · ${session.exercises?.length ?? 0} exercice(s)</div>
    </div>

    <div class="section">
      ${(session.exercises || []).map(renderExercise).join("")}
    </div>
  `;
}
