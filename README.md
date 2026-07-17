# Forge — PWA de suivi de musculation

Base technique de l'application. Aucun compte, aucun serveur : toutes les
données vivent dans IndexedDB, sur l'appareil.

**Direction visuelle actuelle : Glassmorphism premium, dégradé violet →
magenta.** Fond sombre en dégradé avec halos discrets, cartes en verre
(flou, bordure fine, ombre douce, coins très arrondis), dégradé violet
(#8B5CF6) → magenta (#EC4899) comme identité de marque (logo FORGE),
barre de navigation flottante. Tous les tokens de couleur/espace sont
centralisés dans `css/tokens.css` — un futur changement de thème passe
uniquement par ce fichier.

## Lancer le projet en local

Comme toute PWA, elle doit être servie en HTTP (pas en `file://`) pour que
les modules JS et le Service Worker fonctionnent. Depuis ce dossier :

```bash
python3 -m http.server 8080
```

Puis ouvrir `http://localhost:8080` sur ton téléphone (même réseau Wi-Fi)
ou dans Safari sur ton Mac. Sur iPhone : bouton **Partager → Sur l'écran
d'accueil** pour l'installer comme une vraie app.

Pour l'utiliser en dehors du réseau local (et donc sur ton iPhone comme sur
celui de ta copine, chacun avec sa propre installation), le plus simple est
de la déployer sur **GitHub Pages** (comme MT Lavage Auto) — aucun backend
n'est nécessaire, ce sont uniquement des fichiers statiques.

## Structure du projet

```
/pwa-musculation
├── index.html              → coquille de l'app (SPA), un seul fichier HTML
├── manifest.json            → configuration PWA (icônes, nom, thème)
├── service-worker.js        → mise en cache pour le mode hors ligne
│
├── /css
│   ├── tokens.css            → palette, typographie, espacements (design system)
│   ├── base.css               → reset + structure générale
│   ├── icons.css               → icônes (SVG en mask CSS, sans dépendance externe)
│   ├── components.css           → boutons, cartes, tabbar, anneaux, formulaires…
│   └── pages.css                 → styles propres à certaines pages
│
├── /js
│   ├── app.js                → point d'entrée : routes, header, tabbar, service worker
│   ├── router.js              → routeur SPA basé sur le hash (#/page)
│   ├── db.js                   → couche IndexedDB (CRUD générique + export/import)
│   ├── state.js                 → cache mémoire du profil utilisateur
│   ├── seed.js                   → charge les exercices par défaut au 1er lancement
│   │
│   ├── /components
│   │   ├── ring.js             → anneau de progression SVG (élément signature)
│   │   ├── toast.js             → notifications discrètes
│   │   ├── sound.js               → bip sonore de fin de repos (Web Audio API)
│   │   └── barChart.js           → mini graphique en barres SVG (statistiques)
│   │
│   ├── /data
│   │   ├── objectives.js       → liste des 16 objectifs proposés à l'onboarding
│   │   ├── programTemplates.js → règles "objectif -> programme" (16 programmes complets)
│   │   ├── equipment.js         → équipement par exercice + alternatives (substitution)
│   │   └── exerciseWeightRatios.js → estimation de charge de départ (poids corporel × objectif)
│   │
│   ├── /engine
│   │   ├── programGenerator.js   → ✅ génère/sauvegarde le programme selon l'objectif
│   │   ├── progressionEngine.js  → ✅ analyse les séances et suggère la charge suivante
│   │   ├── statsEngine.js         → ✅ calcule toutes les statistiques à la volée
│   │   ├── substitutionEngine.js   → ✅ choisit un exercice de remplacement
│   │   ├── durationAdapter.js       → ✅ adapte une séance à la durée choisie
│   │   ├── warmupGenerator.js        → ✅ génère l'échauffement (~15 min) adapté
│   │   └── recordsEngine.js       → 🚧 non utilisé (les records sont désormais calculés par statsEngine.js)
│   │
│   └── /pages                  → une page = une fonction render(container)
│       ├── onboarding.js, home.js, program.js, session.js,
│       ├── history.js, historyDetail.js, calendar.js, exercises.js,
│       └── stats.js, records.js, profile.js
│
├── /data
│   ├── exercices-predefinis.json   → ~28 exercices de base, par groupe musculaire
│   └── regles-programmes.json       → obsolète, conservé pour mémoire (voir programTemplates.js)
│
└── /icons                     → icônes PWA / iOS (générées, monogramme "F")
```

## Ce qui est fonctionnel dès maintenant

- Navigation complète entre les 10 pages prévues (tabbar flottante qui se
  masque automatiquement au scroll vers le bas + liens internes).
- Choix d'un objectif à l'onboarding, sauvegardé dans IndexedDB.
- **Génération automatique de programme** selon l'objectif choisi (16
  objectifs couverts), affiché sur la page Programme (jours, exercices,
  séries/répétitions/repos ou durée selon le type d'exercice), avec
  possibilité de régénérer et de changer d'objectif à tout moment.
- Bibliothèque d'exercices : lecture des exercices prédéfinis + ajout
  d'exercices personnalisés + recherche.
- **Mode échauffement (15 min)**, indépendant du démarrage d'une séance
  — accessible librement depuis l'écran de choix du jour, à faire quand on
  veut. Composé de seulement 2 blocs longs (10 min de cardio léger, puis
  5 min de mobilité/étirements dynamiques + activation légère, adaptés à
  la zone sollicitée par le jour recommandé), plutôt qu'une multitude de
  petites étapes d'une minute. Décompte automatique qui enchaîne les
  blocs ; ne lance rien d'autre à la fin, simple retour au choix de la
  séance.
- Démarrage d'une séance **directement à partir du programme généré** :
  si le programme propose plusieurs types de séance, celui recommandé
  aujourd'hui (le suivant dans la rotation depuis la dernière séance faite)
  est mis en avant, tout en gardant le libre choix d'un autre type. **Choix
  de la durée disponible** (30 min / 45 min / 1h / 1h30 / programme complet)
  avant de démarrer : la séance est automatiquement adaptée (repos réduits,
  puis séries réduites, puis exercices retirés si besoin) pour tenir dans
  le temps choisi, en tenant compte du temps d'exécution des exercices et
  des repos. Affichage des exercices, du nombre de séries et des
  répétitions cibles, saisie du poids utilisé et validation série par
  série (facile / difficile / ratée) — **un chrono de repos démarre
  automatiquement** à chaque série ou maintien validé, affiché dans une
  barre persistante avec possibilité de le passer, et accompagné d'un
  **bip sonore** à la fin (en plus de la notification visuelle — la
  vibration n'étant pas supportée par Safari iOS). Chaque exercice avec
  charge ou cardio affiche une illustration de l'équipement nécessaire,
  deux liens externes pour voir une photo ou une vidéo de la machine, et
  un bouton **"Machine indisponible"** qui propose un exercice de
  remplacement cohérent (même groupe musculaire). Toutes les données sont
  enregistrées localement à la fin.
- **Système de progression intelligente** : à la fin de chaque séance,
  le moteur de règles local (`progressionEngine.js`) analyse la difficulté
  de chaque série et suggère une charge pour la prochaine fois (+5% si
  facile, charge conservée si difficile, -10% si ratée), affichée en
  bandeau au lancement de la séance suivante. Pour la toute première fois
  qu'un exercice est proposé (aucun historique), une **charge de départ
  est estimée à partir du poids du corps et de l'objectif** renseignés
  dans le profil (`exerciseWeightRatios.js`), plutôt que de laisser le
  champ vide.
- Consultation de l'historique et du détail d'une séance passée, ainsi
  qu'un **calendrier des séances** (vue mensuelle façon "contribution
  graph") pour visualiser sa régularité d'un coup d'œil.
- **Statistiques complètes**, recalculées automatiquement à partir des
  séances enregistrées : nombre de séances, minutes d'entraînement, volume
  total, série de jours consécutifs (streak), progression hebdomadaire et
  annuelle du volume (graphiques en barres), records personnels par
  exercice, exercices les plus réalisés, répartition du volume par groupe
  musculaire.
- Page Records personnels : liste des charges maximales par exercice,
  calculée automatiquement depuis l'historique.
- Profil : prénom, unité kg/lb, export JSON des données, import JSON,
  réinitialisation complète.
- Fonctionne hors ligne après une première ouverture (Service Worker).

## Ce qui reste volontairement non développé (prochaines itérations)

- Prise en compte de contraintes personnelles (jours disponibles, matériel)
  dans la génération de programme — pour l'instant, un seul programme fixe
  par objectif.
- Animations/mise en valeur dédiées lors d'un nouveau record (le record
  est bien calculé et affiché, mais rien ne signale "en direct" pendant la
  séance qu'un record vient d'être battu).
- Filtres de période sur les statistiques (7 jours / 30 jours / 1 an...) :
  les graphiques actuels montrent toujours 8 semaines / 12 mois fixes.
