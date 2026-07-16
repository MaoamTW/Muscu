/**
 * sound.js — Petit bip sonore de fin de repos.
 * -----------------------------------------------------------------------
 * Généré directement avec la Web Audio API (aucun fichier audio à charger
 * ni à mettre en cache) : deux courtes tonalités ascendantes, discrètes.
 * Fonctionne sur Safari iOS (contrairement à la vibration, non supportée).
 * Ne fait rien silencieusement si l'API n'est pas disponible.
 */
let audioCtx = null;

function getContext() {
  if (audioCtx) return audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  audioCtx = new Ctx();
  return audioCtx;
}

function beep(ctx, freq, startTime, duration) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

/** Joue le bip de fin de repos (deux notes courtes et montantes). */
export function playRestEndSound() {
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    beep(ctx, 660, now, 0.14);
    beep(ctx, 880, now + 0.16, 0.18);
  } catch (err) {
    // Audio non disponible/bloqué — pas bloquant pour le reste de l'app.
  }
}
