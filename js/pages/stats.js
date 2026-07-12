import { dbGetAll } from "../db.js";

export async function render(container) {
  const sessions = await dbGetAll("sessions");

  const totalSessions = sessions.length;
  const totalSeconds = sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  const totalVolume = sessions.reduce((sum, s) => {
    const sessionVolume = (s.exercises || []).reduce((exSum, ex) => {
      if (!ex.sets) return exSum; // exercices en durée (cardio) : pas de volume
      return (
        exSum +
        ex.sets.reduce((setSum, set) => (set.validated ? setSum + (Number(set.weight) || 0) : setSum), 0)
      );
    }, 0);
    return sum + sessionVolume;
  }, 0);

  container.innerHTML = `
    <div class="stat-grid">
      <div class="stat-tile">
        <span class="stat-value">${totalSessions}</span>
        <span class="stat-label">Séances au total</span>
      </div>
      <div class="stat-tile">
        <span class="stat-value">${Math.round(totalSeconds / 60)}</span>
        <span class="stat-label">Minutes d'entraînement</span>
      </div>
      <div class="stat-tile">
        <span class="stat-value">${totalVolume.toLocaleString("fr-FR")}</span>
        <span class="stat-label">Volume total (kg)</span>
      </div>
      <div class="stat-tile">
        <span class="stat-value">0</span>
        <span class="stat-label">Jours de suite</span>
      </div>
    </div>

    <div class="section">
      <div class="header-row">
        <div class="section-title" style="margin-bottom:0;">Records personnels</div>
        <a href="#/records" class="btn-ghost">Tout voir</a>
      </div>
      <div class="empty-state">
        <div class="empty-icon"><span class="icon icon-trophy"></span></div>
        <h3>Pas encore de records</h3>
        <p>Continue à t'entraîner pour voir apparaître tes premiers records.</p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Progression</div>
      <div class="empty-state">
        <p style="margin-bottom:0;">Les graphiques de progression (hebdo / mensuel / annuel, répartition musculaire, exercices favoris) arriveront dans une prochaine version, une fois plusieurs séances enregistrées.</p>
      </div>
    </div>
  `;
}
