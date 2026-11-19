# Mon École à la Maison – CI Sénégal

Application web progressive (PWA) pour renforcer à la maison les apprentissages du **CI** (Sénégal), pour un enfant de 6 ans accompagné d'un parent. Séances courtes (10 à 20 min), sans note, sans publicité, sans compte, et utilisable **hors ligne** après le premier chargement.

## Démarrer

```bash
npm install
npm run dev      # développement : http://localhost:5173
npm run build    # version de production dans dist/
npm run preview  # tester la version de production (PWA + hors ligne)
```

Déploiement : n'importe quel hébergement statique (Vercel, Netlify, GitHub Pages). Sur Vercel, importer le dépôt : la configuration est dans `vercel.json`.

## Ce que contient l'application

| Écran | Route |
|---|---|
| Accueil (bienvenue, 4 matières, Activité du jour, Mes étoiles, Espace parent) | `#/` |
| Choix de matière (activités par semaine) | `#/matiere/<id>` |
| Activité interactive (consigne audio, jeu, 3 essais, indices) | `#/activite/<id>` |
| Félicitations + idée hors écran | `#/bravo/<id>` |
| Mes étoiles | `#/etoiles` |
| Espace parent (opération + code à 4 chiffres) : suivi, profils, fiches, voix, réglages | `#/parent` |
| Administration : créer / modifier une activité sans coder | `#/admin` |
| Fiche imprimable (activité ou semaine entière) | `#/fiche/activite/<id>`, `#/fiche/semaine/<n>` |

**36 activités** réparties sur **12 semaines** (3 par semaine) : 10 Français, 10 Mathématiques, 8 Lecture-écriture, 8 Découverte et jeux.

Types de jeux (`src/engines/`) : questions à images (`choice`), comptage (`count`), tri (`sort`), association (`match`), mémoire (`memory`), histoire audio (`story`), tracé au doigt et copie (`trace`), coloriage (`coloring`), activité guidée par le parent (`parent`).

Règles pédagogiques appliquées partout : jamais de note ni de message d'échec ; après une erreur, un encouragement et un indice ; après 3 essais, la bonne réponse est montrée avec une explication ; chaque activité terminée rapporte 3 étoiles.

## Contenu pédagogique (séparé du code)

- `src/data/activities.json` : toutes les activités.
- `src/data/subjects.json`, `phrases.json` (messages FR/wolof), `languages.json`, `drawings.json` (dessins à colorier).

Ajouter une activité : copier un bloc dans `activities.json` (ou passer par l'écran Administration puis « Exporter mes activités »). Champs communs :

```json
{
  "id": "ma-11", "week": 12, "subject": "maths", "icon": "🥭", "notion": "Compter jusqu'à 10",
  "title": { "fr": "Titre court", "wo": "Titre en wolof" },
  "type": "choice",
  "instruction": { "fr": "Consigne lue à voix haute", "wo": "Consigne en wolof" },
  "items": [ { "say": "Touche la mangue.", "options": ["🥭", "🐟", "🍌"], "answer": 0, "hint": "…", "explain": "…" } ],
  "offscreen": { "fr": "Activité hors écran conseillée au parent" }
}
```

Le texte `{nom}` est remplacé par le prénom de l'enfant (il devient le héros des histoires), `{PRENOM}` par son prénom en majuscules.

Visuels sans image à télécharger (léger) : emojis et petits codes — `🥭x3` (3 mangues), `coin:100` / `bill:1000` (francs CFA), `shape:circle:#DC2626`, `color:#16A34A`, `big:ma` (grosses lettres), `scene:sous:⚽:🪑` (position), `t:Une phrase.` (texte).

## Audio

- **Français** : synthèse vocale du téléphone (aucun fichier, aucune donnée consommée).
- **Wolof** : voix humaine enregistrée (pas de voix wolof de synthèse dans les navigateurs).
  - **Studio** (Espace parent → Voix → « Ouvrir le studio ») : chaque phrase s'affiche en grand, on enregistre, on réécoute, on passe à la suivante. 47 phrases : accueil, bravo, encouragements, réponse montrée, et la consigne de chaque activité.
  - Les voix restent sur le téléphone. « Partager mes voix » crée un fichier `voix-wo-<date>.json` à importer sur un autre téléphone (« Importer des voix »).
  - Pour les mettre dans le site (tous les appareils, hors ligne compris) : `node scripts/importer-voix.mjs voix-wo-<date>.json`, puis publier. Les fichiers vont dans `public/audio/wo/` et sont déclarés dans `src/data/audio-manifest.json`.
  - Priorité : voix enregistrée sur le téléphone → fichier du site → texte wolof affiché (le parent le lit). Les bravos et encouragements sans voix wolof restent dits en français.
- **Autres langues nationales** (pulaar, sereer, joola, mandinka…) : déjà listées dans `languages.json` (`"enabled": false`). Les activer et ajouter les textes `"ff"`, `"srr"`… à côté de `"wo"`.

⚠️ Les textes wolof sont une première proposition : à faire relire par un locuteur ou un enseignant.

## Données et confidentialité

- Tout est stocké sur l'appareil : `localStorage` (profils, progrès, réglages, activités créées) et IndexedDB (voix enregistrées).
- Aucune publicité, aucun traceur, aucune requête vers un serveur tiers.
- Sauvegarde / restauration par fichier JSON dans Espace parent → Réglages.
- Synchronisation par compte : point d'extension prévu dans `src/lib/store.js` (`sync`), à brancher plus tard (par ex. Supabase).

## Technique

React 18 + Vite + Tailwind CSS + `vite-plugin-pwa` (Workbox). Toute l'application (≈ 90 Ko compressés) est mise en cache au premier chargement : elle fonctionne ensuite sans connexion.
