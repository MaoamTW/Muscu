/**
 * recordsEngine.js — Détection des records personnels.
 * -----------------------------------------------------------------------
 * STATUT : non implémenté à ce stade (cahier des charges v2, section 2.7).
 * Analysera chaque série validée pour détecter un nouveau record (poids
 * max, meilleure série, meilleur volume) et écrira le résultat dans le
 * store `records`. Le store est déjà prêt côté base de données (js/db.js).
 */

/**
 * @param {object} completedSet - une série qui vient d'être validée
 * @returns {Promise<null | { type: string, exerciseId: string, value: number }>}
 */
export async function checkForNewRecord(completedSet) {
  return null; // aucune détection tant que le moteur n'est pas implémenté
}
