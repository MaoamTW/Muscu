import { dbGetAll } from "../db.js";

export async function render(container) {
  const records = await dbGetAll("records");

  if (records.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="margin-top: var(--sp-6);">
        <div class="empty-icon"><span class="icon icon-trophy"></span></div>
        <h3>Aucun record pour l'instant</h3>
        <p>Tes records personnels (poids max, meilleure série, meilleur volume) apparaîtront ici automatiquement dès que tu les battras.</p>
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
            <div class="list-row-sub">${r.type}</div>
          </div>
          <div class="record-value">${r.value}</div>
        </li>
      `
        )
        .join("")}
    </ul>
  `;
}
