/**
 * ring.js — Anneau de progression SVG.
 * Élément signature de l'identité visuelle "Forge" : réutilisé pour
 * l'objectif hebdomadaire, l'avancement du programme, le streak, etc.
 *
 * @param {number} progress   valeur entre 0 et 1
 * @param {object} opts       { size, strokeWidth, value, label, gradient }
 * @returns {string} markup HTML de l'anneau
 */
export function renderRing(progress, opts = {}) {
  const size = opts.size ?? 88;
  const strokeWidth = opts.strokeWidth ?? 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);
  const gradientId = opts.gradientId ?? "ringGradient";
  const value = opts.value ?? `${Math.round(clamped * 100)}%`;
  const label = opts.label ?? "";

  return `
    <div class="ring-wrap" style="width:${size}px;height:${size}px;">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="var(--accent)" />
            <stop offset="100%" stop-color="#FF8F3D" />
          </linearGradient>
        </defs>
        <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke-width="${strokeWidth}" />
        <circle class="ring-value" cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke-width="${strokeWidth}"
          stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" />
      </svg>
      <div class="ring-center">
        <strong>${value}</strong>
        ${label ? `<span>${label}</span>` : ""}
      </div>
    </div>
  `;
}
