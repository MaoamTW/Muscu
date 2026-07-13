/**
 * durationAdapter.js — Adapte une séance à une durée cible.
 * -----------------------------------------------------------------------
 * Calcule le temps estimé d'une séance (temps d'exécution des exercices +
 * temps de repos + transitions entre exercices), puis, si nécessaire,
 * réduit progressivement la séance pour qu'elle tienne dans le temps
 * disponible — en trois étapes, de la moins intrusive à la plus radicale :
 *   1. Compression des temps de repos (jamais en dessous d'un plancher).
 *   2. Réduction du nombre de séries (jamais en dessous de 2).
 *   3. Suppression des derniers exercices de la séance (jamais le dernier).
 *
 * Entièrement local, moteur de règles fixes (pas d'IA externe), cohérent
 * avec le reste de l'application.
 */

// Hypothèses de calcul (approximations raisonnables, pas des mesures individuelles) :
export const HOLD_REST_SECONDS = 15; // repos entre deux séries de maintien (étirement/mobilité)
const SET_TIME_REPS_SECONDS = 40; // temps d'exécution moyen d'une série "en répétitions"
const TRANSITION_BETWEEN_EXERCISES_SECONDS = 45; // changement de poste/machine
const MIN_REST_RATIO = 0.4; // les repos ne sont jamais compressés en dessous de 40% de leur valeur d'origine
const ABS_MIN_REST_SECONDS = 20; // plancher absolu, quel que soit le ratio
const MIN_SETS_FLOOR = 2; // jamais moins de 2 séries sur un exercice en répétitions

function isReps(ex) {
  return ex.reps != null;
}

/** Temps estimé d'un exercice (toutes ses séries + ses repos internes), en secondes. */
function exerciseTime(ex) {
  if (ex.durationMinutes != null) return ex.durationMinutes * 60;
  if (ex.holdSeconds != null) return ex.sets * ex.holdSeconds + Math.max(0, ex.sets - 1) * HOLD_REST_SECONDS;
  return ex.sets * SET_TIME_REPS_SECONDS + Math.max(0, ex.sets - 1) * (ex.restSeconds || 0);
}

/** Temps total estimé d'une liste d'exercices, transitions entre exercices incluses. */
function totalDuration(exercises) {
  const work = exercises.reduce((sum, ex) => sum + exerciseTime(ex), 0);
  const transitions = Math.max(0, exercises.length - 1) * TRANSITION_BETWEEN_EXERCISES_SECONDS;
  return work + transitions;
}

/** Estime la durée d'un jour de programme tel quel (sans adaptation), en secondes. */
export function estimateDayDuration(day) {
  return totalDuration(day.exercises);
}

function buildAdjustmentNotes(original, final) {
  const notes = [];
  const restReduced = final.some(
    (ex, i) => original[i] && ex.restSeconds != null && ex.restSeconds < original[i].restSeconds
  );
  if (restReduced) notes.push("temps de repos réduits");

  const setsReduced = final.some((ex, i) => original[i] && ex.sets != null && ex.sets < original[i].sets);
  if (setsReduced) notes.push("nombre de séries réduit");

  const dropped = original.length - final.length;
  if (dropped > 0) notes.push(`${dropped} exercice${dropped > 1 ? "s" : ""} retiré${dropped > 1 ? "s" : ""}`);

  return notes;
}

/**
 * Adapte un jour de programme à une durée cible.
 * @param {object} day - un jour du programme (voir js/data/programTemplates.js)
 * @param {number|null} targetMinutes - durée souhaitée en minutes, ou null pour "programme complet" (aucune adaptation)
 * @returns {{ name: string, exercises: object[], estimatedSeconds: number, adapted: boolean, adjustments: string[] }}
 */
export function adaptDayToDuration(day, targetMinutes) {
  const original = day.exercises.map((ex) => ({ ...ex }));

  if (!targetMinutes) {
    return {
      ...day,
      exercises: original,
      estimatedSeconds: totalDuration(original),
      adapted: false,
      adjustments: [],
    };
  }

  const targetSeconds = targetMinutes * 60;
  let exercises = original;
  let total = totalDuration(exercises);

  // Étape 1 : compresser les temps de repos des exercices "en répétitions".
  if (total > targetSeconds) {
    const restPart = exercises.reduce(
      (sum, ex) => (isReps(ex) ? sum + Math.max(0, ex.sets - 1) * (ex.restSeconds || 0) : sum),
      0
    );
    const fixedPart = total - restPart;

    if (restPart > 0) {
      const neededRatio = (targetSeconds - fixedPart) / restPart;
      const ratio = Math.max(MIN_REST_RATIO, Math.min(1, neededRatio));
      exercises = exercises.map((ex) => {
        if (!isReps(ex) || !ex.restSeconds) return ex;
        const compressed = Math.round((ex.restSeconds * ratio) / 5) * 5;
        return { ...ex, restSeconds: Math.max(ABS_MIN_REST_SECONDS, compressed) };
      });
      total = totalDuration(exercises);
    }
  }

  // Étape 2 : réduire le nombre de séries (jamais en dessous de 2), en retirant
  // d'abord une série à l'exercice qui en a le plus.
  let safety = 30;
  while (total > targetSeconds && safety-- > 0) {
    const candidates = exercises.filter((ex) => isReps(ex) && ex.sets > MIN_SETS_FLOOR);
    if (candidates.length === 0) break;
    const maxSets = Math.max(...candidates.map((ex) => ex.sets));
    const toReduce = candidates.find((ex) => ex.sets === maxSets);
    exercises = exercises.map((ex) => (ex === toReduce ? { ...ex, sets: ex.sets - 1 } : ex));
    total = totalDuration(exercises);
  }

  // Étape 3 : retirer les derniers exercices de la liste (jamais le seul restant).
  while (total > targetSeconds && exercises.length > 1) {
    exercises = exercises.slice(0, -1);
    total = totalDuration(exercises);
  }

  return {
    ...day,
    exercises,
    estimatedSeconds: total,
    adapted: true,
    adjustments: buildAdjustmentNotes(original, exercises),
  };
}

/** Options de durée proposées avant de démarrer une séance. */
export const DURATION_OPTIONS = [
  { minutes: null, label: "Programme complet" },
  { minutes: 30, label: "30 min" },
  { minutes: 45, label: "45 min" },
  { minutes: 60, label: "1 h" },
  { minutes: 90, label: "1 h 30" },
];
