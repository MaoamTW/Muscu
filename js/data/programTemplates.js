/**
 * programTemplates.js — Base de règles "objectif -> programme".
 * -----------------------------------------------------------------------
 * Chaque entrée décrit un programme complet et prêt à l'emploi pour un
 * objectif donné : fréquence conseillée, description courte, et le détail
 * de chaque type de séance (exercices, séries, répétitions, repos).
 *
 * Format d'un exercice dans une séance :
 *  - { name, sets, reps, restSeconds }        → travail classique en séries/reps
 *  - { name, durationMinutes }                → travail cardio en durée
 *  - { name, sets, holdSeconds, note }        → étirement/mobilité en maintien
 *
 * Ces données sont volontairement statiques (règles écrites à la main),
 * conformément au principe du cahier des charges : moteur de règles local,
 * sans IA externe ni appel réseau.
 */
export const PROGRAM_TEMPLATES = {
  "prise-masse": {
    frequencyLabel: "4 séances / semaine",
    description: "Alternance Haut du corps / Bas du corps, axée sur les mouvements polyarticulaires et un volume progressif pour soutenir la prise de masse.",
    days: [
      {
        name: "Jour A — Haut du corps",
        exercises: [
          { name: "Développé couché", sets: 4, reps: "8-10", restSeconds: 90 },
          { name: "Rowing barre", sets: 4, reps: "8-10", restSeconds: 90 },
          { name: "Développé militaire", sets: 3, reps: "8-10", restSeconds: 90 },
          { name: "Tirage vertical", sets: 3, reps: "10-12", restSeconds: 75 },
          { name: "Curl biceps barre", sets: 3, reps: "10-12", restSeconds: 60 },
        ],
      },
      {
        name: "Jour B — Bas du corps",
        exercises: [
          { name: "Squat", sets: 4, reps: "6-8", restSeconds: 120 },
          { name: "Soulevé de terre", sets: 3, reps: "8-10", restSeconds: 120 },
          { name: "Presse à cuisses", sets: 3, reps: "10-12", restSeconds: 90 },
          { name: "Leg curl", sets: 3, reps: "10-12", restSeconds: 75 },
          { name: "Mollets debout", sets: 4, reps: "12-15", restSeconds: 60 },
        ],
      },
    ],
    note: "Répète le cycle A → B → A → B dans la semaine, avec au moins un jour de repos entre deux séances consécutives sur les mêmes groupes musculaires.",
  },

  force: {
    frequencyLabel: "3 à 4 séances / semaine (rotation A → B → C)",
    description: "Programme centré sur les trois mouvements de force (squat, développé couché, soulevé de terre), charges lourdes et faibles répétitions.",
    days: [
      {
        name: "Jour A — Squat",
        exercises: [
          { name: "Squat", sets: 5, reps: "5", restSeconds: 180 },
          { name: "Presse à cuisses", sets: 3, reps: "8", restSeconds: 120 },
          { name: "Gainement (planche)", sets: 3, holdSeconds: 45 },
        ],
      },
      {
        name: "Jour B — Développé couché",
        exercises: [
          { name: "Développé couché", sets: 5, reps: "5", restSeconds: 180 },
          { name: "Développé militaire", sets: 3, reps: "6", restSeconds: 120 },
          { name: "Extension triceps poulie", sets: 3, reps: "10", restSeconds: 90 },
        ],
      },
      {
        name: "Jour C — Soulevé de terre",
        exercises: [
          { name: "Soulevé de terre", sets: 5, reps: "3", restSeconds: 180 },
          { name: "Rowing barre", sets: 3, reps: "6", restSeconds: 120 },
          { name: "Tractions", sets: 3, reps: "max", restSeconds: 120 },
        ],
      },
    ],
    note: "Privilégie une progression lente et régulière des charges (charge, technique, puis seulement ensuite volume).",
  },

  cardio: {
    frequencyLabel: "3 à 4 séances / semaine",
    description: "Alternance de cardio continu et de cardio fractionné pour développer la capacité cardiovasculaire.",
    days: [
      {
        name: "Jour A — Cardio continu",
        exercises: [
          { name: "Course à pied", durationMinutes: 30, note: "Allure modérée, conversation possible" },
          { name: "Vélo elliptique", durationMinutes: 15, note: "Récupération active" },
        ],
      },
      {
        name: "Jour B — Cardio fractionné",
        exercises: [
          { name: "Rameur", durationMinutes: 20, note: "Intervalles 1 min effort / 1 min récupération" },
          { name: "Course à pied", durationMinutes: 15, note: "Récupération active en fin de séance" },
        ],
      },
    ],
    note: "Alterne les deux types de séance dans la semaine ; laisse au moins une journée de récupération complète.",
  },

  endurance: {
    frequencyLabel: "3 séances / semaine",
    description: "Séances full body en répétitions hautes et repos courts pour développer l'endurance musculaire.",
    days: [
      {
        name: "Full Body — Endurance",
        exercises: [
          { name: "Squat", sets: 3, reps: "18-20", restSeconds: 45 },
          { name: "Développé couché", sets: 3, reps: "18-20", restSeconds: 45 },
          { name: "Rowing barre", sets: 3, reps: "18-20", restSeconds: 45 },
          { name: "Fentes", sets: 3, reps: "16 par jambe", restSeconds: 45 },
          { name: "Gainement (planche)", sets: 3, holdSeconds: 60 },
        ],
      },
    ],
    note: "Utilise des charges modérées : la priorité est de tenir le nombre de répétitions avec un temps de repos court.",
  },

  seche: {
    frequencyLabel: "5 séances / semaine (musculation + cardio)",
    description: "Musculation en répétitions modérées à hautes avec finisher cardio, pour préserver la masse musculaire en période de déficit calorique.",
    days: [
      {
        name: "Jour A — Haut du corps + cardio",
        exercises: [
          { name: "Développé couché", sets: 4, reps: "10-12", restSeconds: 75 },
          { name: "Tirage horizontal", sets: 4, reps: "10-12", restSeconds: 75 },
          { name: "Élévations latérales", sets: 3, reps: "12-15", restSeconds: 60 },
          { name: "Rameur", durationMinutes: 10, note: "Finisher cardio" },
        ],
      },
      {
        name: "Jour B — Bas du corps + cardio",
        exercises: [
          { name: "Squat", sets: 4, reps: "10-12", restSeconds: 75 },
          { name: "Fentes", sets: 3, reps: "12 par jambe", restSeconds: 60 },
          { name: "Mollets debout", sets: 3, reps: "15", restSeconds: 45 },
          { name: "Course à pied", durationMinutes: 15, note: "Finisher cardio" },
        ],
      },
      {
        name: "Jour C — Cardio dédié",
        exercises: [{ name: "Rameur", durationMinutes: 25, note: "Intervalles modérés" }],
      },
    ],
    note: "Répartition conseillée sur la semaine : A, B, A, B, C.",
  },

  hypertrophie: {
    frequencyLabel: "6 séances / semaine (cycle Push / Pull / Legs x2)",
    description: "Cycle Push / Pull / Legs répété deux fois par semaine, volume élevé et repos modérés pour maximiser l'hypertrophie.",
    days: [
      {
        name: "Push",
        exercises: [
          { name: "Développé couché", sets: 4, reps: "8-12", restSeconds: 75 },
          { name: "Développé incliné haltères", sets: 3, reps: "10-12", restSeconds: 75 },
          { name: "Élévations latérales", sets: 3, reps: "12-15", restSeconds: 60 },
          { name: "Extension triceps poulie", sets: 3, reps: "12-15", restSeconds: 60 },
        ],
      },
      {
        name: "Pull",
        exercises: [
          { name: "Tractions", sets: 4, reps: "8-10", restSeconds: 90 },
          { name: "Rowing barre", sets: 3, reps: "10-12", restSeconds: 75 },
          { name: "Tirage vertical", sets: 3, reps: "10-12", restSeconds: 75 },
          { name: "Curl biceps barre", sets: 3, reps: "12-15", restSeconds: 60 },
        ],
      },
      {
        name: "Legs",
        exercises: [
          { name: "Squat", sets: 4, reps: "8-10", restSeconds: 90 },
          { name: "Leg extension", sets: 3, reps: "12-15", restSeconds: 60 },
          { name: "Leg curl", sets: 3, reps: "12-15", restSeconds: 60 },
          { name: "Mollets debout", sets: 4, reps: "15", restSeconds: 45 },
        ],
      },
    ],
    note: "Cycle conseillé : Push, Pull, Legs, Push, Pull, Legs, puis un jour de repos complet.",
  },

  recomposition: {
    frequencyLabel: "4 séances / semaine (Full Body + cardio léger)",
    description: "Deux séances full body en alternance, complétées par un cardio léger, pour progresser en force tout en perdant du gras.",
    days: [
      {
        name: "Full Body A",
        exercises: [
          { name: "Squat", sets: 3, reps: "10", restSeconds: 75 },
          { name: "Développé couché", sets: 3, reps: "10", restSeconds: 75 },
          { name: "Rowing barre", sets: 3, reps: "10", restSeconds: 75 },
          { name: "Gainement (planche)", sets: 3, holdSeconds: 40 },
        ],
      },
      {
        name: "Full Body B",
        exercises: [
          { name: "Soulevé de terre", sets: 3, reps: "8", restSeconds: 90 },
          { name: "Développé militaire", sets: 3, reps: "10", restSeconds: 75 },
          { name: "Tirage horizontal", sets: 3, reps: "10", restSeconds: 75 },
          { name: "Vélo elliptique", durationMinutes: 10, note: "Finisher cardio" },
        ],
      },
    ],
    note: "Répartition conseillée : A, B, A, B, avec au moins un jour de repos dans la semaine.",
  },

  mobilite: {
    frequencyLabel: "3 séances / semaine",
    description: "Travail de mobilité articulaire (hanches, chevilles, épaules, colonne) pour améliorer l'amplitude de mouvement.",
    days: [
      {
        name: "Jour A — Mobilité hanches & chevilles",
        exercises: [
          { name: "Rotations de hanches", sets: 3, reps: "10 répétitions", restSeconds: 30 },
          { name: "Étirement du fessier (pigeon)", sets: 3, holdSeconds: 30, note: "Par côté" },
          { name: "Mobilité chevilles (genou au mur)", sets: 3, reps: "10 répétitions", restSeconds: 30 },
        ],
      },
      {
        name: "Jour B — Mobilité haut du corps",
        exercises: [
          { name: "Rotations d'épaules au bâton", sets: 3, reps: "10 répétitions", restSeconds: 30 },
          { name: "Étirement pectoraux (cadre de porte)", sets: 3, holdSeconds: 30 },
          { name: "Chat-vache (colonne vertébrale)", sets: 3, reps: "10 répétitions", restSeconds: 20 },
        ],
      },
    ],
    note: "Idéal en complément d'un autre programme, ou en séance à part entière les jours de repos.",
  },

  souplesse: {
    frequencyLabel: "4 séances / semaine (étirements statiques)",
    description: "Étirements statiques maintenus, pour gagner en amplitude musculaire sur le long terme.",
    days: [
      {
        name: "Jour A — Étirements bas du corps",
        exercises: [
          { name: "Étirement ischio-jambiers", sets: 3, holdSeconds: 30, note: "Par jambe" },
          { name: "Étirement quadriceps", sets: 3, holdSeconds: 30, note: "Par jambe" },
          { name: "Étirement mollets", sets: 3, holdSeconds: 30, note: "Par jambe" },
        ],
      },
      {
        name: "Jour B — Étirements haut du corps",
        exercises: [
          { name: "Étirement épaule croisée", sets: 3, holdSeconds: 30, note: "Par bras" },
          { name: "Étirement triceps", sets: 3, holdSeconds: 30, note: "Par bras" },
          { name: "Chat-vache (dos)", sets: 3, reps: "10 répétitions", restSeconds: 20 },
        ],
      },
    ],
    note: "Étire à chaud, jamais en douleur : la sensation doit rester une tension confortable.",
  },

  recuperation: {
    frequencyLabel: "2 à 3 séances / semaine (charge très légère)",
    description: "Semaine de décharge : mêmes mouvements de base, charges très réduites, pour favoriser la récupération sans tout arrêter.",
    days: [
      {
        name: "Full Body léger",
        exercises: [
          { name: "Squat", sets: 2, reps: "12", restSeconds: 90 },
          { name: "Développé couché", sets: 2, reps: "12", restSeconds: 90 },
          { name: "Tirage vertical", sets: 2, reps: "12", restSeconds: 90 },
          { name: "Gainement (planche)", sets: 2, holdSeconds: 30 },
        ],
      },
    ],
    note: "Utilise environ 50% de tes charges habituelles. L'objectif est de bouger, pas de progresser cette semaine.",
  },

  "full-body": {
    frequencyLabel: "3 séances / semaine",
    description: "Chaque séance sollicite l'ensemble du corps, idéal pour un volume d'entraînement limité mais régulier.",
    days: [
      {
        name: "Full Body",
        exercises: [
          { name: "Squat", sets: 3, reps: "10", restSeconds: 75 },
          { name: "Développé couché", sets: 3, reps: "10", restSeconds: 75 },
          { name: "Rowing barre", sets: 3, reps: "10", restSeconds: 75 },
          { name: "Développé militaire", sets: 3, reps: "10", restSeconds: 75 },
          { name: "Gainement (planche)", sets: 3, holdSeconds: 40 },
        ],
      },
    ],
    note: "Répète cette séance 3 fois par semaine, avec au moins un jour de repos entre deux séances.",
  },

  "haut-du-corps": {
    frequencyLabel: "2 à 3 séances / semaine",
    description: "Séance complète centrée sur le haut du corps (pectoraux, dos, épaules, bras).",
    days: [
      {
        name: "Haut du corps",
        exercises: [
          { name: "Développé couché", sets: 4, reps: "8-10", restSeconds: 90 },
          { name: "Rowing barre", sets: 4, reps: "8-10", restSeconds: 90 },
          { name: "Développé militaire", sets: 3, reps: "10-12", restSeconds: 75 },
          { name: "Tirage vertical", sets: 3, reps: "10-12", restSeconds: 75 },
          { name: "Curl biceps barre", sets: 3, reps: "12", restSeconds: 60 },
          { name: "Extension triceps poulie", sets: 3, reps: "12", restSeconds: 60 },
        ],
      },
    ],
    note: "Répète cette séance 2 à 3 fois par semaine, avec au moins 48h de repos entre deux séances.",
  },

  "bas-du-corps": {
    frequencyLabel: "2 à 3 séances / semaine",
    description: "Séance complète centrée sur le bas du corps (quadriceps, ischio-jambiers, fessiers, mollets).",
    days: [
      {
        name: "Bas du corps",
        exercises: [
          { name: "Squat", sets: 4, reps: "8-10", restSeconds: 120 },
          { name: "Soulevé de terre", sets: 3, reps: "8-10", restSeconds: 120 },
          { name: "Presse à cuisses", sets: 3, reps: "10-12", restSeconds: 90 },
          { name: "Leg curl", sets: 3, reps: "12", restSeconds: 75 },
          { name: "Mollets debout", sets: 4, reps: "15", restSeconds: 60 },
        ],
      },
    ],
    note: "Répète cette séance 2 à 3 fois par semaine, avec au moins 48h de repos entre deux séances.",
  },

  push: {
    frequencyLabel: "2 à 3 séances / semaine",
    description: "Séance centrée sur les mouvements de poussée : pectoraux, épaules, triceps.",
    days: [
      {
        name: "Push",
        exercises: [
          { name: "Développé couché", sets: 4, reps: "8-10", restSeconds: 90 },
          { name: "Développé incliné haltères", sets: 3, reps: "10-12", restSeconds: 75 },
          { name: "Développé militaire", sets: 3, reps: "10-12", restSeconds: 75 },
          { name: "Élévations latérales", sets: 3, reps: "12-15", restSeconds: 60 },
          { name: "Extension triceps poulie", sets: 3, reps: "12-15", restSeconds: 60 },
        ],
      },
    ],
    note: "Répète cette séance 2 à 3 fois par semaine, avec au moins 48h de repos entre deux séances.",
  },

  pull: {
    frequencyLabel: "2 à 3 séances / semaine",
    description: "Séance centrée sur les mouvements de tirage : dos, biceps.",
    days: [
      {
        name: "Pull",
        exercises: [
          { name: "Tractions", sets: 4, reps: "8-10", restSeconds: 90 },
          { name: "Rowing barre", sets: 3, reps: "10-12", restSeconds: 75 },
          { name: "Tirage vertical", sets: 3, reps: "10-12", restSeconds: 75 },
          { name: "Oiseau haltères", sets: 3, reps: "12-15", restSeconds: 60 },
          { name: "Curl biceps barre", sets: 3, reps: "12-15", restSeconds: 60 },
        ],
      },
    ],
    note: "Répète cette séance 2 à 3 fois par semaine, avec au moins 48h de repos entre deux séances.",
  },

  legs: {
    frequencyLabel: "2 à 3 séances / semaine",
    description: "Séance centrée sur les jambes : quadriceps, ischio-jambiers, mollets.",
    days: [
      {
        name: "Legs",
        exercises: [
          { name: "Squat", sets: 4, reps: "8-10", restSeconds: 90 },
          { name: "Presse à cuisses", sets: 3, reps: "10-12", restSeconds: 90 },
          { name: "Fentes", sets: 3, reps: "12 par jambe", restSeconds: 75 },
          { name: "Leg extension", sets: 3, reps: "12-15", restSeconds: 60 },
          { name: "Leg curl", sets: 3, reps: "12-15", restSeconds: 60 },
          { name: "Mollets debout", sets: 4, reps: "15", restSeconds: 45 },
        ],
      },
    ],
    note: "Répète cette séance 2 à 3 fois par semaine, avec au moins 48h de repos entre deux séances.",
  },
};
