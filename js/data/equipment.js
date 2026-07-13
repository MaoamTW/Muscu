/**
 * equipment.js — Équipement associé à chaque exercice + exercices de
 * remplacement possibles (utilisé par le bouton "Machine indisponible").
 * -----------------------------------------------------------------------
 * Pour rester 100% hors ligne et ne reproduire aucune photo protégée par des
 * droits d'auteur, l'équipement est représenté par une illustration générique
 * par catégorie (barre libre, haltères, machine guidée, barre de traction,
 * poids du corps, machine cardio) plutôt qu'une photo réelle de salle de
 * sport — voir le cahier des charges pour le détail de ce choix.
 *
 * Chaque exercice référencé dans js/data/programTemplates.js a une entrée
 * ici avec : sa catégorie d'équipement, son groupe musculaire, et une liste
 * d'exercices de remplacement (même groupe musculaire, équipement différent
 * si possible) proposés quand la machine n'est pas disponible.
 */
export const EQUIPMENT_LABELS = {
  barbell: "Barre libre",
  dumbbell: "Haltères",
  machine: "Machine guidée / poulie",
  "pull-up-bar": "Barre de traction",
  bodyweight: "Poids du corps",
  "cardio-machine": "Machine cardio",
  mobility: "Tapis de sol / étirement",
};

export const EXERCISE_EQUIPMENT = {
  // Pectoraux
  "Développé couché": { equipment: "barbell", muscleGroup: "Pectoraux", alternatives: ["Développé incliné haltères", "Dips", "Écarté couché"] },
  "Développé incliné haltères": { equipment: "dumbbell", muscleGroup: "Pectoraux", alternatives: ["Développé couché", "Écarté couché", "Dips"] },
  "Écarté couché": { equipment: "dumbbell", muscleGroup: "Pectoraux", alternatives: ["Développé incliné haltères", "Dips"] },
  "Dips": { equipment: "bodyweight", muscleGroup: "Pectoraux", alternatives: ["Développé couché", "Développé incliné haltères"] },

  // Dos
  "Rowing barre": { equipment: "barbell", muscleGroup: "Dos", alternatives: ["Tirage horizontal", "Tractions", "Tirage vertical"] },
  "Tirage vertical": { equipment: "machine", muscleGroup: "Dos", alternatives: ["Tractions", "Rowing barre", "Tirage horizontal"] },
  "Tirage horizontal": { equipment: "machine", muscleGroup: "Dos", alternatives: ["Rowing barre", "Tractions"] },
  "Tractions": { equipment: "pull-up-bar", muscleGroup: "Dos", alternatives: ["Tirage vertical", "Rowing barre", "Tirage horizontal"] },
  "Soulevé de terre": { equipment: "barbell", muscleGroup: "Dos", alternatives: ["Rowing barre", "Tirage horizontal"] },

  // Jambes
  "Squat": { equipment: "barbell", muscleGroup: "Jambes", alternatives: ["Presse à cuisses", "Fentes"] },
  "Presse à cuisses": { equipment: "machine", muscleGroup: "Jambes", alternatives: ["Squat", "Fentes", "Leg extension"] },
  "Fentes": { equipment: "bodyweight", muscleGroup: "Jambes", alternatives: ["Squat", "Presse à cuisses"] },
  "Leg extension": { equipment: "machine", muscleGroup: "Jambes", alternatives: ["Presse à cuisses", "Squat"] },
  "Leg curl": { equipment: "machine", muscleGroup: "Jambes", alternatives: ["Soulevé de terre", "Fentes"] },
  "Mollets debout": { equipment: "machine", muscleGroup: "Jambes", alternatives: ["Fentes"] },

  // Épaules
  "Développé militaire": { equipment: "barbell", muscleGroup: "Épaules", alternatives: ["Élévations latérales", "Oiseau haltères"] },
  "Élévations latérales": { equipment: "dumbbell", muscleGroup: "Épaules", alternatives: ["Développé militaire", "Oiseau haltères"] },
  "Oiseau haltères": { equipment: "dumbbell", muscleGroup: "Épaules", alternatives: ["Élévations latérales", "Développé militaire"] },

  // Bras
  "Curl biceps barre": { equipment: "barbell", muscleGroup: "Bras", alternatives: ["Tractions"] },
  "Extension triceps poulie": { equipment: "machine", muscleGroup: "Bras", alternatives: ["Dips", "Développé couché"] },

  // Abdominaux
  "Gainement (planche)": { equipment: "bodyweight", muscleGroup: "Abdominaux", alternatives: [] },

  // Cardio
  "Course à pied": { equipment: "cardio-machine", muscleGroup: "Cardio", alternatives: ["Rameur", "Vélo elliptique"] },
  "Vélo elliptique": { equipment: "cardio-machine", muscleGroup: "Cardio", alternatives: ["Rameur", "Course à pied"] },
  "Rameur": { equipment: "cardio-machine", muscleGroup: "Cardio", alternatives: ["Vélo elliptique", "Course à pied"] },

  // Mobilité / Souplesse (étirements — pas de bouton de remplacement, mais illustration fournie)
  "Rotations de hanches": { equipment: "mobility", muscleGroup: "Mobilité", alternatives: [] },
  "Étirement du fessier (pigeon)": { equipment: "mobility", muscleGroup: "Mobilité", alternatives: [] },
  "Mobilité chevilles (genou au mur)": { equipment: "mobility", muscleGroup: "Mobilité", alternatives: [] },
  "Rotations d'épaules au bâton": { equipment: "mobility", muscleGroup: "Mobilité", alternatives: [] },
  "Étirement pectoraux (cadre de porte)": { equipment: "mobility", muscleGroup: "Mobilité", alternatives: [] },
  "Chat-vache (colonne vertébrale)": { equipment: "mobility", muscleGroup: "Mobilité", alternatives: [] },
  "Chat-vache (dos)": { equipment: "mobility", muscleGroup: "Mobilité", alternatives: [] },
  "Étirement ischio-jambiers": { equipment: "mobility", muscleGroup: "Souplesse", alternatives: [] },
  "Étirement quadriceps": { equipment: "mobility", muscleGroup: "Souplesse", alternatives: [] },
  "Étirement mollets": { equipment: "mobility", muscleGroup: "Souplesse", alternatives: [] },
  "Étirement épaule croisée": { equipment: "mobility", muscleGroup: "Souplesse", alternatives: [] },
  "Étirement triceps": { equipment: "mobility", muscleGroup: "Souplesse", alternatives: [] },
};

/** Retourne les infos d'équipement d'un exercice (avec une valeur par défaut si absent). */
export function getEquipmentInfo(exerciseName) {
  return (
    EXERCISE_EQUIPMENT[exerciseName] || {
      equipment: "bodyweight",
      muscleGroup: "Autre",
      alternatives: [],
    }
  );
}
