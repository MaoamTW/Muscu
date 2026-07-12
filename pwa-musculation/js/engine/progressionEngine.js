/**
 * progressionEngine.js — Moteur de progression intelligente.
 * -----------------------------------------------------------------------
 * STATUT : non implémenté à ce stade (fonctionnalité avancée, prévue au
 * cahier des charges v2, section 2.3). Analysera l'historique des séries
 * stockées dans `sessions` pour suggérer poids/répétitions de la séance
 * suivante, entièrement en local (règles, pas d'IA externe).
 */

/**
 * @param {string} exerciseId
 * @returns {Promise<{ suggestedWeight: number, suggestedReps: number, rationale: string }>}
 */
export async function suggestNextPerformance(exerciseId) {
  throw new Error(
    "suggestNextPerformance() n'est pas encore implémenté — fonctionnalité prévue dans une prochaine itération."
  );
}
