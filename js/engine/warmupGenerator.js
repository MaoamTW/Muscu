/**
 * warmupGenerator.js — Génère un échauffement (~10 minutes) adapté à
 * l'objectif du programme et aux muscles sollicités par la séance du jour.
 * -----------------------------------------------------------------------
 * Structure toujours composée des mêmes 4 briques, dont la répartition du
 * temps varie selon la famille d'objectif :
 *  - Cardio léger (montée progressive du rythme cardiaque)
 *  - Mobilité articulaire (choisie selon haut/bas du corps sollicité)
 *  - Étirements dynamiques (idem)
 *  - Séries d'activation à charge légère sur le premier exercice du jour
 *    (sauté si la séance ne comporte aucun exercice avec charge)
 *
 * Entièrement local, moteur de règles fixes — pas d'IA externe.
 */
import { getEquipmentInfo } from "../data/equipment.js";

const UPPER_GROUPS = ["Pectoraux", "Dos", "Épaules", "Bras"];
const LOWER_GROUPS = ["Jambes"];

const CARDIO_CATEGORY_OBJECTIVES = ["cardio", "endurance", "seche"];
const RECOVERY_CATEGORY_OBJECTIVES = ["recuperation", "mobilite", "souplesse"];

// Répartition du temps (en secondes) selon la famille d'objectif — 10 min dans chaque cas.
const ALLOCATIONS = {
  cardio: { cardio: 240, mobility: 160, dynamic: 120, activation: 80 },
  recovery: { cardio: 120, mobility: 280, dynamic: 200, activation: 0 },
  standard: { cardio: 200, mobility: 160, dynamic: 120, activation: 120 },
};

const DYNAMIC_STRETCHES_UPPER = ["Cercles de bras", "Balancements de bras croisés"];
const DYNAMIC_STRETCHES_LOWER = ["Balancements de jambes avant/arrière", "Fentes marchées dynamiques"];
const DYNAMIC_STRETCHES_GENERIC = ["Rotations du tronc", "Talons-fesses sur place"];

function warmupCategory(objectiveId) {
  if (CARDIO_CATEGORY_OBJECTIVES.includes(objectiveId)) return "cardio";
  if (RECOVERY_CATEGORY_OBJECTIVES.includes(objectiveId)) return "recovery";
  return "standard";
}

function cardioLabel(category) {
  if (category === "cardio") return "Vélo elliptique ou rameur — allure modérée, progressive";
  if (category === "recovery") return "Marche ou vélo très léger";
  return "Vélo elliptique ou corde à sauter — allure légère";
}

/** Groupes musculaires sollicités par les exercices du jour (via la bibliothèque équipement). */
function muscleGroupsInDay(day) {
  const groups = new Set();
  for (const ex of day.exercises) {
    const info = getEquipmentInfo(ex.name);
    if (info?.muscleGroup) groups.add(info.muscleGroup);
  }
  return groups;
}

function roundTo5(seconds) {
  return Math.max(15, Math.round(seconds / 5) * 5);
}

function splitAcross(names, totalSeconds) {
  const per = roundTo5(totalSeconds / names.length);
  return names.map((name) => ({ name, durationSeconds: per, kind: "mobility-or-dynamic" }));
}

function pickMobilityDrills(groups) {
  const hasUpper = [...groups].some((g) => UPPER_GROUPS.includes(g));
  const hasLower = [...groups].some((g) => LOWER_GROUPS.includes(g));
  const drills = [];
  if (hasLower) drills.push("Rotations de hanches", "Mobilité chevilles (genou au mur)");
  if (hasUpper) drills.push("Rotations d'épaules au bâton", "Chat-vache (colonne vertébrale)");
  if (drills.length === 0) drills.push("Chat-vache (colonne vertébrale)", "Rotations de hanches");
  return drills.slice(0, 2);
}

function pickDynamicStretches(groups) {
  const hasUpper = [...groups].some((g) => UPPER_GROUPS.includes(g));
  const hasLower = [...groups].some((g) => LOWER_GROUPS.includes(g));
  const drills = [];
  if (hasLower) drills.push(...DYNAMIC_STRETCHES_LOWER);
  if (hasUpper) drills.push(...DYNAMIC_STRETCHES_UPPER);
  if (drills.length === 0) drills.push(...DYNAMIC_STRETCHES_GENERIC);
  return drills.slice(0, 2);
}

/**
 * Génère l'échauffement pour un jour de programme donné.
 * @param {{objectiveId: string}} program
 * @param {object} day - le jour choisi (voir js/data/programTemplates.js)
 * @returns {{ totalSeconds: number, blocks: { name: string, durationSeconds: number, kind: string }[] }}
 */
export function generateWarmup(program, day) {
  const category = warmupCategory(program.objectiveId);
  const allocation = ALLOCATIONS[category];
  const groups = muscleGroupsInDay(day);

  const blocks = [];

  blocks.push({ name: cardioLabel(category), durationSeconds: allocation.cardio, kind: "cardio" });

  const mobilityDrills = pickMobilityDrills(groups);
  blocks.push(...splitAcross(mobilityDrills, allocation.mobility).map((b) => ({ ...b, kind: "mobility" })));

  const dynamicDrills = pickDynamicStretches(groups);
  blocks.push(...splitAcross(dynamicDrills, allocation.dynamic).map((b) => ({ ...b, kind: "dynamic" })));

  if (allocation.activation > 0) {
    const mainExercise = day.exercises.find((ex) => ex.reps != null);
    if (mainExercise) {
      blocks.push({
        name: `${mainExercise.name} — 2 séries légères d'activation (≈ 50% de ta charge habituelle)`,
        durationSeconds: allocation.activation,
        kind: "activation",
      });
    } else {
      // Pas d'exercice avec charge ce jour-là : le temps est redonné au cardio.
      blocks[0].durationSeconds += allocation.activation;
    }
  }

  const totalSeconds = blocks.reduce((sum, b) => sum + b.durationSeconds, 0);
  return { totalSeconds, blocks };
}
