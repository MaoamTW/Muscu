/**
 * state.js — Petit état applicatif partagé.
 * -----------------------------------------------------------------------
 * Ce module ne remplace pas IndexedDB (qui reste la source de vérité) :
 * il garde simplement en mémoire les données consultées souvent (le profil)
 * pour éviter des lectures répétées et faciliter l'accès depuis n'importe
 * quelle page (ex: prénom affiché dans le header).
 */
import { dbGet, dbPut, generateId } from "./db.js";

const PROFILE_ID = "user";

let profileCache = null;

/** Récupère le profil local (le crée avec des valeurs par défaut s'il n'existe pas encore). */
export async function getProfile() {
  if (profileCache) return profileCache;

  let profile = await dbGet("profile", PROFILE_ID);
  if (!profile) {
    profile = {
      id: PROFILE_ID,
      firstName: "",
      unit: "kg", // "kg" | "lb"
      objective: null, // ex: "hypertrophie", "force", "push-pull-legs"...
      objectiveLabel: null,
      bodyWeightKg: null, // utilisé pour recommander une charge de départ (voir progressionEngine.js)
      constraints: { daysPerWeek: null, equipment: null },
      createdAt: new Date().toISOString(),
    };
    await dbPut("profile", profile);
  } else if (profile.bodyWeightKg === undefined) {
    // Migration douce : profil créé avant l'ajout du poids corporel.
    profile.bodyWeightKg = null;
    await dbPut("profile", profile);
  }
  profileCache = profile;
  return profileCache;
}

/** Met à jour partiellement le profil et persiste le changement. */
export async function updateProfile(partial) {
  const current = await getProfile();
  const next = { ...current, ...partial, id: PROFILE_ID };
  await dbPut("profile", next);
  profileCache = next;
  return next;
}

/** Invalide le cache mémoire (utile après un import/reset de données). */
export function clearProfileCache() {
  profileCache = null;
}

export { generateId };
