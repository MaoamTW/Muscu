/**
 * progressionEngine.js — Moteur de progression intelligente.
 * -----------------------------------------------------------------------
 * Analyse, à la fin de chaque séance, la difficulté de chaque série d'un
 * exercice (facile / difficile / ratée) et calcule une suggestion de charge
 * pour la prochaine fois que cet exercice sera proposé, selon des règles
 * simples et fixes :
 *   - toutes les séries "faciles"      -> charge légèrement augmentée
 *   - au moins une série "difficile"   -> charge conservée
 *   - au moins une série "ratée"       -> charge légèrement réduite
 *
 * Entièrement local (pas d'IA externe, pas d'appel réseau) : un moteur de
 * règles qui lit et écrit uniquement dans IndexedDB (store `suggestions`).
 */
import { dbGet, dbPut } from "../db.js";

const INCREASE_RATIO = 1.05; // +5%
const DECREASE_RATIO = 0.9; // -10%

function suggestionId(objectiveId, exerciseName) {
  return `sugg_${objectiveId}__${exerciseName}`.replace(/\s+/g, "-").toLowerCase();
}

/** Arrondit au demi-kilo le plus proche (pratique pour les charges en salle). */
function roundToHalf(value) {
  return Math.round(value * 2) / 2;
}

/**
 * Détermine l'issue globale d'un exercice à partir du statut de chaque série.
 * Une seule série ratée suffit à faire baisser la charge (principe de
 * prudence) ; il faut que toutes les séries soient faciles pour l'augmenter.
 */
export function determineOutcome(sets) {
  const statuses = sets.map((s) => s.status).filter(Boolean);
  if (statuses.length === 0) return null; // rien de renseigné, pas d'analyse possible
  if (statuses.includes("failed")) return "failed";
  if (statuses.every((s) => s === "easy")) return "easy";
  return "hard"; // au moins une série difficile, ou un mélange facile/difficile
}

/** Calcule la charge suggérée pour la prochaine séance selon l'issue observée. */
export function computeSuggestedWeight(baseWeight, outcome) {
  if (!baseWeight || baseWeight <= 0) return null;
  if (outcome === "easy") return roundToHalf(baseWeight * INCREASE_RATIO);
  if (outcome === "failed") return roundToHalf(baseWeight * DECREASE_RATIO);
  return baseWeight; // "hard" -> charge conservée à l'identique
}

/** Poids de référence d'un exercice pour une séance : moyenne des poids saisis. */
function averageWeight(sets) {
  const weights = sets.map((s) => Number(s.weight)).filter((w) => Number.isFinite(w) && w > 0);
  if (weights.length === 0) return null;
  return weights.reduce((sum, w) => sum + w, 0) / weights.length;
}

function outcomeRationale(outcome) {
  if (outcome === "easy") return "Toutes les séries précédentes étaient faciles : charge augmentée.";
  if (outcome === "failed") return "Au moins une série précédente a été ratée : charge réduite.";
  return "Au moins une série précédente était difficile : charge conservée.";
}

/**
 * Analyse une séance terminée et met à jour la suggestion de progression
 * pour chaque exercice "en répétitions" qui contient des données exploitables.
 * @param {object} session - la séance telle qu'enregistrée (voir js/pages/session.js)
 */
export async function analyzeSessionAndUpdateSuggestions(session) {
  if (!session?.objectiveId || !Array.isArray(session.exercises)) return;

  for (const exercise of session.exercises) {
    if (exercise.type !== "reps" || !Array.isArray(exercise.sets)) continue;

    const outcome = determineOutcome(exercise.sets);
    if (!outcome) continue; // aucune série évaluée, on ne touche pas à la suggestion existante

    const baseWeight = averageWeight(exercise.sets);
    const suggestedWeight = computeSuggestedWeight(baseWeight, outcome);
    if (suggestedWeight == null) continue; // pas de poids saisi, impossible de proposer une charge

    const suggestion = {
      id: suggestionId(session.objectiveId, exercise.name),
      objectiveId: session.objectiveId,
      exerciseName: exercise.name,
      lastWeight: roundToHalf(baseWeight),
      suggestedWeight,
      suggestedSets: exercise.sets.length,
      suggestedReps: exercise.sets[0]?.targetLabel ?? null,
      outcome,
      rationale: outcomeRationale(outcome),
      basedOnSessionId: session.id,
      computedAt: new Date().toISOString(),
    };

    await dbPut("suggestions", suggestion);
  }
}

/** Récupère la suggestion existante pour un exercice donné (ou null). */
export async function getSuggestionForExercise(objectiveId, exerciseName) {
  if (!objectiveId || !exerciseName) return null;
  const result = await dbGet("suggestions", suggestionId(objectiveId, exerciseName));
  return result || null;
}
