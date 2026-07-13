/**
 * substitutionEngine.js — Choix d'un exercice de remplacement.
 * -----------------------------------------------------------------------
 * Utilisé par le bouton "Machine indisponible" pendant une séance. Propose
 * un exercice alternatif qui travaille le même groupe musculaire (donc
 * cohérent avec l'objectif du programme en cours), en évitant de reproposer
 * un exercice déjà essayé plus tôt dans la même séance.
 * Entièrement local : la liste d'alternatives vient de js/data/equipment.js,
 * pas d'IA externe ni d'appel réseau.
 */
import { getEquipmentInfo } from "../data/equipment.js";

/**
 * @param {string} currentExerciseName
 * @param {string[]} alreadyTried - noms déjà utilisés dans cette séance pour cet exercice
 * @returns {string|null} le nom du prochain exercice de remplacement, ou null si aucun disponible
 */
export function pickReplacement(currentExerciseName, alreadyTried = []) {
  const info = getEquipmentInfo(currentExerciseName);
  const candidate = info.alternatives.find((name) => !alreadyTried.includes(name));
  return candidate || null;
}
