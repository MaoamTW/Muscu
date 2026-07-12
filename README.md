# Forge — PWA de suivi de musculation

Base technique de l'application (v1 du développement). Aucun compte, aucun
serveur : toutes les données vivent dans IndexedDB, sur l'appareil.

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
│   │   └── toast.js             → notifications discrètes
│   │
│   ├── /data
│   │   ├── objectives.js       → liste des 16 objectifs proposés à l'onboarding
│   │   └── programTemplates.js → règles "objectif -> programme" (16 programmes complets)
│   │
│   ├── /engine
│   │   ├── programGenerator.js   → ✅ génère/sauvegarde le programme selon l'objectif
│   │   ├── progressionEngine.js  → 🚧 suggestions de poids/répétitions (non implémenté)
│   │   └── recordsEngine.js       → 🚧 détection automatique des records (non implémenté)
│   │
│   └── /pages                  → une page = une fonction render(container)
│       ├── onboarding.js, home.js, program.js, session.js,
│       ├── history.js, historyDetail.js, exercises.js,
│       └── stats.js, records.js, profile.js
│
├── /data
│   ├── exercices-predefinis.json   → ~28 exercices de base, par groupe musculaire
│   └── regles-programmes.json       → réservé au futur moteur de programme
│
└── /icons                     → icônes PWA / iOS (générées, monogramme "F")
```

## Ce qui est fonctionnel dès maintenant

- Navigation complète entre les 10 pages prévues (tabbar + liens internes).
- Choix d'un objectif à l'onboarding, sauvegardé dans IndexedDB.
- **Génération automatique de programme** selon l'objectif choisi (16
  objectifs couverts), affiché sur la page Programme (jours, exercices,
  séries/répétitions/repos ou durée selon le type d'exercice), avec
  possibilité de régénérer et de changer d'objectif à tout moment.
- Bibliothèque d'exercices : lecture des exercices prédéfinis + ajout
  d'exercices personnalisés + recherche.
- Démarrage d'une séance **directement à partir du programme généré** :
  choix du type de séance si le programme en propose plusieurs (ex. Push /
  Pull / Legs), affichage des exercices, du nombre de séries et des
  répétitions cibles, saisie du poids utilisé et validation série par
  série. Toutes les données sont enregistrées localement à la fin.
- Consultation de l'historique et du détail d'une séance passée.
- Statistiques de base calculées à partir des séances réellement enregistrées
  (nombre de séances, minutes d'entraînement, volume total).
- Profil : prénom, unité kg/lb, export JSON des données, import JSON,
  réinitialisation complète.
- Fonctionne hors ligne après une première ouverture (Service Worker).

## Ce qui reste volontairement non développé (prochaines itérations)

Ces éléments ont leur "emplacement" prévu dans l'architecture
(`/js/engine/`) mais ne contiennent que des fonctions stub qui lèvent une
erreur explicite si on essaie de les appeler :

- Moteur de progression intelligente (suggestions de poids/répétitions).
- Détection automatique des records personnels + animations dédiées.
- Graphiques de statistiques avancés (courbes de progression, répartition
  musculaire, etc.) — actuellement seulement des chiffres bruts.
- Prise en compte de contraintes personnelles (jours disponibles, matériel)
  dans la génération de programme — pour l'instant, un seul programme fixe
  par objectif.
