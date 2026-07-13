/**
 * barChart.js — Mini graphique en barres SVG (sans dépendance externe).
 * Utilisé pour la progression hebdomadaire/annuelle du volume soulevé.
 */
export function renderBarChart(points, opts = {}) {
  const width = opts.width ?? 320;
  const height = opts.height ?? 120;
  const barGap = 4;
  const maxValue = Math.max(1, ...points.map((p) => p.value));
  const barWidth = (width - barGap * (points.length - 1)) / points.length;

  const bars = points
    .map((p, i) => {
      const barHeight = Math.max(2, (p.value / maxValue) * (height - 24));
      const x = i * (barWidth + barGap);
      const y = height - 20 - barHeight;
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="5"
          fill="${p.value > 0 ? "url(#barGradient)" : "rgba(255,255,255,0.08)"}" />
        <text x="${x + barWidth / 2}" y="${height - 6}" text-anchor="middle"
          font-size="9" fill="var(--text-tertiary)">${p.label}</text>
      `;
    })
    .join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" style="overflow:visible;">
      <defs>
        <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#8B5CF6" />
          <stop offset="100%" stop-color="var(--accent)" />
        </linearGradient>
      </defs>
      ${bars}
    </svg>
  `;
}
