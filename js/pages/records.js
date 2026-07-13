import { computeStats } from "../engine/statsEngine.js";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export async function render(container) {
  const { records } = await computeStats();

  if (records.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="margin-top: var(--sp-6);">
        <div class="empty-icon"><span class="icon icon-trophy"></span></div>
        <h3>Aucun record pour l'instant</h3>
        <p>Tes records personnels (charge maximale par exercice) apparaîtront ici automatiquement dès ta première série réussie.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <ul>
      ${records
        .map(
          (r) => `
        <li class="record-row">
          <div class="record-medal"><span class="icon icon-trophy"></span></div>
          <div class="record-info">
            <div class="list-row-title">${r.exerciseName}</div>
            <div class="list-row-sub">Le ${formatDate(r.date)}</div>
          </div>
          <div class="record-value">${r.weight} kg</div>
        </li>
      `
        )
        .join("")}
    </ul>
  `;
}
