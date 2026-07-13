/**
 * statsEngine.js — Calcul des statistiques à partir des séances enregistrées.
 * -----------------------------------------------------------------------
 * Aucune donnée n'est stockée par ce module : tout est recalculé à la volée
 * à partir du store `sessions` à chaque affichage de la page Statistiques,
 * ce qui garantit une mise à jour automatique dès qu'une séance est ajoutée.
 * Entièrement local, aucun appel réseau.
 */
import { dbGetAll } from "../db.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / DAY_MS + 1) / 7);
  return `${d.getUTCFullYear()}-S${String(weekNo).padStart(2, "0")}`;
}

/** Volume soulevé (kg) sur les séries réussies d'un exercice "en répétitions". */
function exerciseVolume(ex) {
  if (!ex.sets) return 0;
  return ex.sets.reduce((sum, set) => {
    const counts = ex.type === "reps" ? set.status === "easy" || set.status === "hard" : Boolean(set.validated);
    return counts ? sum + (Number(set.weight) || 0) : sum;
  }, 0);
}

function sessionVolume(session) {
  return (session.exercises || []).reduce((sum, ex) => sum + exerciseVolume(ex), 0);
}

/** Calcule la série de séances consécutives (streak), en jours calendaires distincts. */
function computeStreak(sessions) {
  if (sessions.length === 0) return 0;

  const days = [...new Set(sessions.map((s) => startOfDay(s.startedAt).getTime()))].sort((a, b) => b - a);

  const today = startOfDay(new Date()).getTime();
  const mostRecent = days[0];
  // Le streak est rompu si la dernière séance remonte à plus d'un jour.
  if (today - mostRecent > DAY_MS) return 0;

  let streak = 1;
  for (let i = 0; i < days.length - 1; i++) {
    if (days[i] - days[i + 1] === DAY_MS) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

/** Regroupe un total (volume ou nombre de séances) par semaine ISO ou par mois. */
function groupByPeriod(sessions, periodKeyFn, valueFn) {
  const map = new Map();
  for (const s of sessions) {
    const key = periodKeyFn(new Date(s.startedAt));
    map.set(key, (map.get(key) || 0) + valueFn(s));
  }
  return map;
}

/** Les 8 dernières semaines de volume, dans l'ordre chronologique. */
function weeklyProgression(sessions) {
  const now = new Date();
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * DAY_MS);
    weeks.push(isoWeekKey(d));
  }
  const volumeByWeek = groupByPeriod(sessions, isoWeekKey, sessionVolume);
  return weeks.map((key) => ({ label: key.split("-S")[1] ? `S${key.split("-S")[1]}` : key, value: volumeByWeek.get(key) || 0 }));
}

/** Les 12 derniers mois de volume, dans l'ordre chronologique. */
function annualProgression(sessions) {
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("fr-FR", { month: "short" }) });
  }
  const volumeByMonth = groupByPeriod(
    sessions,
    (d) => `${d.getFullYear()}-${d.getMonth()}`,
    sessionVolume
  );
  return months.map((m) => ({ label: m.label, value: volumeByMonth.get(m.key) || 0 }));
}

/** Nombre de séances par exercice, trié décroissant. */
function topExercises(sessions, limit = 5) {
  const counts = new Map();
  for (const s of sessions) {
    for (const ex of s.exercises || []) {
      counts.set(ex.name, (counts.get(ex.name) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Volume soulevé par groupe musculaire, à partir de la bibliothèque d'exercices. */
async function muscleGroupBreakdown(sessions) {
  const exercises = await dbGetAll("exercises");
  const groupByName = new Map(exercises.map((e) => [e.name, e.muscleGroup]));

  const volumeByGroup = new Map();
  for (const s of sessions) {
    for (const ex of s.exercises || []) {
      const volume = exerciseVolume(ex);
      if (volume <= 0) continue;
      const group = groupByName.get(ex.name) || "Autre";
      volumeByGroup.set(group, (volumeByGroup.get(group) || 0) + volume);
    }
  }
  const total = [...volumeByGroup.values()].reduce((a, b) => a + b, 0);
  return [...volumeByGroup.entries()]
    .map(([group, volume]) => ({ group, volume, percent: total > 0 ? volume / total : 0 }))
    .sort((a, b) => b.volume - a.volume);
}

/**
 * Records personnels : la charge maximale jamais soulevée (série réussie),
 * par exercice, recalculée directement depuis l'historique des séances.
 */
function personalRecords(sessions) {
  const sorted = [...sessions].sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
  const bestByExercise = new Map();

  for (const s of sorted) {
    for (const ex of s.exercises || []) {
      if (ex.type !== "reps" || !ex.sets) continue;
      for (const set of ex.sets) {
        const success = set.status === "easy" || set.status === "hard";
        const weight = Number(set.weight) || 0;
        if (!success || weight <= 0) continue;

        const current = bestByExercise.get(ex.name);
        if (!current || weight > current.weight) {
          bestByExercise.set(ex.name, { weight, date: s.startedAt });
        }
      }
    }
  }

  return [...bestByExercise.entries()]
    .map(([exerciseName, { weight, date }]) => ({ exerciseName, weight, date }))
    .sort((a, b) => b.weight - a.weight);
}

/** Calcule l'ensemble des statistiques affichées par la page Statistiques. */
export async function computeStats() {
  const sessions = await dbGetAll("sessions");
  sessions.sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));

  return {
    totalSessions: sessions.length,
    totalMinutes: Math.round(sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / 60),
    totalVolume: sessions.reduce((sum, s) => sum + sessionVolume(s), 0),
    streak: computeStreak(sessions),
    weeklyProgression: weeklyProgression(sessions),
    annualProgression: annualProgression(sessions),
    topExercises: topExercises(sessions),
    muscleGroups: await muscleGroupBreakdown(sessions),
    records: personalRecords(sessions),
  };
}
