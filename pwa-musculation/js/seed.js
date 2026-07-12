/**
 * seed.js — Alimente IndexedDB avec les données de départ au premier lancement.
 * Ne fait rien si des exercices existent déjà (pour ne jamais écraser les
 * exercices personnalisés ajoutés par l'utilisateur).
 */
import { dbGetAll, dbPut, generateId } from "./db.js";

export async function seedDefaultExercisesIfNeeded() {
  const existing = await dbGetAll("exercises");
  if (existing.length > 0) return;

  try {
    const response = await fetch("data/exercices-predefinis.json");
    const list = await response.json();
    for (const item of list) {
      await dbPut("exercises", {
        id: generateId("ex"),
        name: item.name,
        muscleGroup: item.muscleGroup,
        isCustom: false,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    // Hors-ligne au tout premier lancement sans cache : pas bloquant,
    // l'utilisateur pourra ajouter ses exercices manuellement.
    console.warn("Impossible de charger les exercices prédéfinis pour le moment.", err);
  }
}
