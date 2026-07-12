/**
 * objectives.js — Catalogue des objectifs proposés à l'onboarding.
 * Liste alignée sur les 16 catégories validées pour la gestion des programmes.
 * Chaque objectif a un programme correspondant défini dans
 * js/data/programTemplates.js et généré par js/engine/programGenerator.js.
 */
export const OBJECTIVE_GROUPS = [
  {
    title: "Objectifs physiologiques",
    items: [
      { id: "prise-masse", label: "Prise de masse", emoji: "💪" },
      { id: "force", label: "Force", emoji: "🏋️" },
      { id: "cardio", label: "Cardio", emoji: "❤️" },
      { id: "endurance", label: "Endurance", emoji: "⏱️" },
      { id: "seche", label: "Sèche", emoji: "⚡" },
      { id: "hypertrophie", label: "Hypertrophie", emoji: "🔥" },
      { id: "recomposition", label: "Recomposition corporelle", emoji: "🔁" },
      { id: "mobilite", label: "Mobilité", emoji: "🤸" },
      { id: "souplesse", label: "Souplesse", emoji: "🧘" },
      { id: "recuperation", label: "Récupération", emoji: "🌙" },
    ],
  },
  {
    title: "Objectifs par split",
    items: [
      { id: "full-body", label: "Full Body", emoji: "🧍" },
      { id: "haut-du-corps", label: "Haut du corps", emoji: "🎯" },
      { id: "bas-du-corps", label: "Bas du corps", emoji: "🦵" },
      { id: "push", label: "Push", emoji: "➡️" },
      { id: "pull", label: "Pull", emoji: "⬅️" },
      { id: "legs", label: "Legs", emoji: "🦿" },
    ],
  },
];

export function findObjectiveById(id) {
  for (const group of OBJECTIVE_GROUPS) {
    const found = group.items.find((item) => item.id === id);
    if (found) return found;
  }
  return null;
}
