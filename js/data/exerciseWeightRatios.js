/**
 * exerciseWeightRatios.js — Base de règles pour la recommandation de
 * charge de départ (première fois qu'un exercice est proposé, avant tout
 * historique de séance).
 * -----------------------------------------------------------------------
 * Principe : charge de départ ≈ poids du corps × ratio de l'exercice ×
 * multiplicateur de l'objectif, arrondi au 2,5 kg le plus proche.
 * Ce sont des repères de départ prudents (pas des maximums), écrits à la
 * main à partir de repères d'entraînement courants — pas une IA, pas de
 * personnalisation au-delà du poids et de l'objectif renseignés.
 *
 * Un ratio de 0 signifie "exercice au poids du corps" : aucune charge de
 * départ n'est recommandée, l'utilisateur commence sans charge ajoutée.
 */
export const EXERCISE_WEIGHT_RATIOS = {
  "Squat": 0.5,
  "Développé couché": 0.4,
  "Soulevé de terre": 0.6,
  "Rowing barre": 0.35,
  "Développé militaire": 0.25,
  "Presse à cuisses": 0.9,
  "Tirage vertical": 0.4,
  "Tirage horizontal": 0.35,
  "Leg extension": 0.2,
  "Leg curl": 0.15,
  "Mollets debout": 0.3,
  "Curl biceps barre": 0.15,
  "Extension triceps poulie": 0.15,
  "Développé incliné haltères": 0.12, // par haltère
  "Écarté couché": 0.08,              // par haltère
  "Élévations latérales": 0.04,       // par haltère
  "Oiseau haltères": 0.04,            // par haltère
  "Dips": 0,
  "Fentes": 0,
  "Tractions": 0,
};

/**
 * Multiplicateur appliqué selon l'objectif : plus élevé pour les objectifs
 * de force (charges lourdes, peu de répétitions), plus faible pour
 * l'endurance/la récupération (charges légères, plus de répétitions).
 */
export const OBJECTIVE_WEIGHT_MULTIPLIERS = {
  force: 1.15,
  "prise-masse": 1.0,
  hypertrophie: 0.95,
  recomposition: 0.9,
  seche: 0.85,
  endurance: 0.7,
  recuperation: 0.5,
  "full-body": 0.95,
  "haut-du-corps": 1.0,
  "bas-du-corps": 1.0,
  push: 1.0,
  pull: 1.0,
  legs: 1.0,
};

const DEFAULT_MULTIPLIER = 1.0;

/** Arrondit au 2,5 kg le plus proche (plus petit incrément réaliste en salle). */
function roundToQuarterStep(value) {
  return Math.round(value / 2.5) * 2.5;
}

/**
 * Calcule une charge de départ recommandée, ou null si l'exercice n'a pas
 * de ratio connu, si le poids du corps n'est pas renseigné, ou si
 * l'exercice se pratique au poids du corps (ratio = 0).
 */
export function estimateStartingWeight(exerciseName, bodyWeightKg, objectiveId) {
  const ratio = EXERCISE_WEIGHT_RATIOS[exerciseName];
  if (!ratio || !bodyWeightKg || bodyWeightKg <= 0) return null;

  const multiplier = OBJECTIVE_WEIGHT_MULTIPLIERS[objectiveId] ?? DEFAULT_MULTIPLIER;
  const raw = bodyWeightKg * ratio * multiplier;
  return Math.max(2.5, roundToQuarterStep(raw));
}
