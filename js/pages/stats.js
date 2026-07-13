import { computeStats } from "../engine/statsEngine.js";
import { renderBarChart } from "../components/barChart.js";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function renderRecords(records) {
  if (records.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon"><span class="icon icon-trophy"></span></div>
        <h3>Pas encore de records</h3>
        <p>Continue à t'entraîner pour voir apparaître tes premiers records.</p>
      </div>
    `;
  }
  return `
    <ul>
      ${records
        .slice(0, 5)
        .map(
          (r) => `
        <li class="record-row">
          <div class="record-medal"><span class="icon icon-trophy"></span></div>
          <div class="record-info">
            <div class="list-row-title">${r.exerciseName}</div>
            <div class="list-row-sub">${formatDate(r.date)}</div>
          </div>
          <div class="record-value">${r.weight} kg</div>
        </li>
      `
        )
        .join("")}
    </ul>
  `;
}

function renderTopExercises(topExercises) {
  if (topExercises.length === 0) {
    return `<div class="empty-state"><p style="margin-bottom:0;">Aucun exercice réalisé pour l'instant.</p></div>`;
  }
  const max = Math.max(...topExercises.map((e) => e.count));
  return `
    <ul>
      ${topExercises
        .map(
          (e) => `
        <li class="list-row">
          <div style="flex:1;">
            <div class="list-row-title">${e.name}</div>
            <div style="height:6px; background:var(--surface-alt); border-radius:3px; margin-top:6px; overflow:hidden;">
              <div style="height:100%; width:${(e.count / max) * 100}%; background:var(--gradient-forge); border-radius:3px;"></div>
            </div>
          </div>
          <span class="badge badge-accent">${e.count}×</span>
        </li>
      `
        )
        .join("")}
    </ul>
  `;
}

function renderMuscleGroups(groups) {
  if (groups.length === 0) {
    return `<div class="empty-state"><p style="margin-bottom:0;">Aucune donnée musculaire pour l'instant.</p></div>`;
  }
  return `
    <ul>
      ${groups
        .map(
          (g) => `
        <li class="list-row">
          <div style="flex:1;">
            <div class="header-row">
              <span class="list-row-title">${g.group}</span>
              <span class="card-sub">${Math.round(g.percent * 100)}%</span>
            </div>
            <div style="height:6px; background:var(--surface-alt); border-radius:3px; margin-top:6px; overflow:hidden;">
              <div style="height:100%; width:${g.percent * 100}%; background:var(--gradient-steel); border-radius:3px;"></div>
            </div>
          </div>
        </li>
      `
        )
        .join("")}
    </ul>
  `;
}

export async function render(container) {
  const stats = await computeStats();

  container.innerHTML = `
    <div class="stat-grid">
      <div class="stat-tile">
        <span class="stat-value">${stats.totalSessions}</span>
        <span class="stat-label">Séances au total</span>
      </div>
      <div class="stat-tile">
        <span class="stat-value">${stats.totalMinutes}</span>
        <span class="stat-label">Minutes d'entraînement</span>
      </div>
      <div class="stat-tile">
        <span class="stat-value">${stats.totalVolume.toLocaleString("fr-FR")}</span>
        <span class="stat-label">Volume total (kg)</span>
      </div>
      <div class="stat-tile">
        <span class="stat-value">${stats.streak}</span>
        <span class="stat-label">Jours de suite 🔥</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Progression hebdomadaire (volume, 8 dernières semaines)</div>
      <div class="card">${renderBarChart(stats.weeklyProgression)}</div>
    </div>

    <div class="section">
      <div class="section-title">Progression annuelle (volume, 12 derniers mois)</div>
      <div class="card">${renderBarChart(stats.annualProgression, { height: 130 })}</div>
    </div>

    <div class="section">
      <div class="header-row">
        <div class="section-title" style="margin-bottom:0;">Records personnels</div>
        <a href="#/records" class="btn-ghost">Tout voir</a>
      </div>
      ${renderRecords(stats.records)}
    </div>

    <div class="section">
      <div class="section-title">Exercices les plus réalisés</div>
      ${renderTopExercises(stats.topExercises)}
    </div>

    <div class="section">
      <div class="section-title">Muscles les plus travaillés</div>
      ${renderMuscleGroups(stats.muscleGroups)}
    </div>
  `;
}
