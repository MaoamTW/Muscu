/**
 * programGenerator.js — Moteur de génération automatique de programme.
 * -----------------------------------------------------------------------
 * Prend un identifiant d'objectif, va chercher la règle correspondante dans
 * js/data/programTemplates.js, construit un objet "programme" complet et le
 * sauvegarde dans IndexedDB (store `templates`). Purement local : aucun
 * appel réseau, aucune IA externe — un simple moteur de règles.
 */
import { PROGRAM_TEMPLATES } from "../data/programTemplates.js";
import { findObjectiveById } from "../data/objectives.js";
import { dbGet, dbPut } from "../db.js";

function programId(objectiveId) {
  return `program_${objectiveId}`;
}

/**
 * Génère (ou régénère) le programme associé à un objectif, et le sauvegarde.
 * @param {string} objectiveId
 * @returns {Promise<object>} le programme généré
 */
export async function generateProgram(objectiveId) {
  const rule = PROGRAM_TEMPLATES[objectiveId];
  if (!rule) {
    throw new Error(`Aucune règle de programme trouvée pour l'objectif "${objectiveId}".`);
  }

  const objective = findObjectiveById(objectiveId);

  const program = {
    id: programId(objectiveId),
    objectiveId,
    objectiveLabel: objective?.label ?? objectiveId,
    frequencyLabel: rule.frequencyLabel,
    description: rule.description,
    note: rule.note ?? null,
    days: rule.days,
    generatedAt: new Date().toISOString(),
  };

  await dbPut("templates", program);
  return program;
}

/** Récupère le programme déjà généré pour un objectif, sans le régénérer. */
export async function getProgramForObjective(objectiveId) {
  if (!objectiveId) return null;
  return dbGet("templates", programId(objectiveId));
}

/** Récupère le programme d'un objectif, le génère automatiquement s'il n'existe pas encore. */
export async function ensureProgramForObjective(objectiveId) {
  if (!objectiveId) return null;
  const existing = await getProgramForObjective(objectiveId);
  if (existing) return existing;
  return generateProgram(objectiveId);
}

/** Liste les identifiants d'objectifs pour lesquels un programme est disponible. */
export function hasTemplateFor(objectiveId) {
  return Boolean(PROGRAM_TEMPLATES[objectiveId]);
}
