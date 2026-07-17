/**
 * warmupGenerator.js — Génère un échauffement (15 minutes) adapté à
 * l'objectif du programme et aux muscles sollicités par la séance du jour.
 * -----------------------------------------------------------------------
 * Volontairement composé de seulement 2 blocs, longs et complets plutôt
 * que d'une multitude de petites étapes d'une minute (peu utile en
 * pratique) :
 *  - Cardio léger, 10 minutes — pour élever progressivement le rythme
 *    cardiaque et préparer le corps dans son ensemble.
 *  - Travail ciblé, 5 minutes — mobilité articulaire et étirements
 *    dynamiques sur la zone sollicitée par la séance du jour (haut du
 *    corps, bas du corps, ou les deux), suivis de quelques répétitions
 *    légères sur le premier exercice de la séance pour s'activer.
 *
 * Entièrement local, moteur de règles fixes — pas d'IA externe.
 */
import { getEquipmentInfo } from "../data/equipment.js";

const UPPER_GROUPS = ["Pectoraux", "Dos", "Épaules", "Bras"];
const LOWER_GROUPS = ["Jambes"];

const CARDIO_CATEGORY_OBJECTIVES = ["cardio", "endurance", "seche"];
const RECOVERY_CATEGORY_OBJECTIVES = ["recuperation", "mobilite", "souplesse"];

const CARDIO_MINUTES = 10;
const TARGETED_MINUTES = 5;

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

/** Nom du bloc ciblé (mobilité + activation), adapté à la zone sollicitée. */
function targetedBlockName(groups, category, day) {
  const hasUpper = [...groups].some((g) => UPPER_GROUPS.includes(g));
  const hasLower = [...groups].some((g) => LOWER_GROUPS.includes(g));

  let zone = "du haut et du bas du corps";
  if (hasLower && !hasUpper) zone = "du bas du corps (hanches, chevilles, quadriceps)";
  else if (hasUpper && !hasLower) zone = "du haut du corps (épaules, dos, poignets)";

  if (category === "recovery") {
    return `Mobilité et étirements dynamiques ${zone}`;
  }

  const mainExercise = day.exercises.find((ex) => ex.reps != null);
  const activation = mainExercise
    ? `, puis quelques répétitions légères sur ${mainExercise.name} (≈ 50% de ta charge habituelle) pour t'activer`
    : "";

  return `Mobilité et étirements dynamiques ${zone}${activation}`;
}

/**
 * Génère l'échauffement pour un jour de programme donné.
 * @param {{objectiveId: string}} program
 * @param {object} day - le jour choisi (voir js/data/programTemplates.js)
 * @returns {{ totalSeconds: number, blocks: { name: string, durationSeconds: number, kind: string }[] }}
 */
export function generateWarmup(program, day) {
  const category = warmupCategory(program.objectiveId);
  const groups = muscleGroupsInDay(day);

  const blocks = [
    { name: cardioLabel(category), durationSeconds: CARDIO_MINUTES * 60, kind: "cardio" },
    { name: targetedBlockName(groups, category, day), durationSeconds: TARGETED_MINUTES * 60, kind: "targeted" },
  ];

  const totalSeconds = blocks.reduce((sum, b) => sum + b.durationSeconds, 0);
  return { totalSeconds, blocks };
}
