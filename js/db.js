/**
 * db.js — Couche de stockage local (IndexedDB)
 * -----------------------------------------------------------------------
 * Toutes les données de l'application vivent exclusivement sur l'appareil.
 * Aucun appel réseau n'est effectué par ce module.
 *
 * Stores créés :
 *  - profile    : un seul enregistrement (id="user") — prénom, unité, objectif actuel
 *  - exercises  : bibliothèque d'exercices (prédéfinis + personnalisés)
 *  - sessions   : séances effectuées (historique), chaque séance contient
 *                 directement ses exercices/séries (pas de store séparé pour
 *                 les séries : plus simple à lire/écrire pour ce volume de données)
 *  - templates  : modèles de séance / programmes générés
 *  - records    : records personnels, un enregistrement par exercice
 *
 * Ce module expose une API générique (get/getAll/put/remove/clear) utilisée
 * par toutes les pages, plus quelques raccourcis pratiques.
 */

const DB_NAME = "forge-db";
const DB_VERSION = 2;

const STORES = ["profile", "exercises", "sessions", "templates", "records", "suggestions"];

let dbPromise = null;

/** Ouvre (ou crée) la base IndexedDB. Retourne une promesse résolue avec l'objet IDBDatabase. */
function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      for (const storeName of STORES) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id" });
        }
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });

  return dbPromise;
}

/** Génère un identifiant unique local (suffisant pour un usage mono-appareil). */
export function generateId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Lit un enregistrement par sa clé. Retourne `undefined` si absent. */
export async function dbGet(storeName, key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Lit tous les enregistrements d'un store. */
export async function dbGetAll(storeName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/** Crée ou remplace un enregistrement (l'objet doit avoir un champ `id`). */
export async function dbPut(storeName, value) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve(value);
    tx.onerror = () => reject(tx.error);
  });
}

/** Supprime un enregistrement par sa clé. */
export async function dbDelete(storeName, key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Vide entièrement un store. */
export async function dbClear(storeName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Réinitialise complètement les données locales (tous les stores). */
export async function dbResetAll() {
  for (const storeName of STORES) {
    await dbClear(storeName);
  }
}

/** Exporte toutes les données de l'application sous forme d'un objet JSON sérialisable. */
export async function exportAllData() {
  const data = { exportedAt: new Date().toISOString(), version: DB_VERSION };
  for (const storeName of STORES) {
    data[storeName] = await dbGetAll(storeName);
  }
  return data;
}

/** Importe un objet JSON précédemment exporté (remplace les données existantes). */
export async function importAllData(data) {
  for (const storeName of STORES) {
    if (Array.isArray(data[storeName])) {
      await dbClear(storeName);
      for (const record of data[storeName]) {
        await dbPut(storeName, record);
      }
    }
  }
}

export { STORES };
