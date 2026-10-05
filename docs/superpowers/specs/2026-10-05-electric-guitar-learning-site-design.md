# Site d'apprentissage de la guitare électrique — Spec de conception

Date : 2026-10-05

## Contexte & objectif

Site web personnel pour aider l'utilisateur (joueur **débutant**, orienté **metal**) à progresser
quotidiennement à la guitare électrique : exercices techniques, tablatures animées, tuner,
métronome, système de progression, tutoriels et ressources. Le site doit être **extrêmement
complet** et **beau** (thème sombre, esprit guitare noire/scène metal).

## Portée

**Dans le périmètre :**
- Exercices quotidiens techniques + objectif/streak configurable
- Bibliothèque de tablatures animées (focus metal), avec lecteur dédié par tab
- Métronome intégré au lecteur de tab (et utilisable seul)
- Tuner électrique multi-accordages
- Système de progression (XP, niveaux, compétences par catégorie, badges)
- Tutoriels/conseils + liens vers ressources externes (ex. YouTube)
- Import de tabs par l'utilisateur pour étendre la bibliothèque

**Hors périmètre (explicitement) :**
- Comptes multi-utilisateurs, hébergement cloud, paiement
- Détection automatique "tu as joué juste/faux" par analyse audio en temps réel (piste d'évolution future, pas construite maintenant)
- Éditeur visuel de tab from scratch (seulement import/collage au départ)

## Utilisation & architecture générale

- **Local uniquement** : lancé via `npm run dev` (Vite), ouvert dans le navigateur sur `localhost`.
  Pas de compte, pas de backend, pas de base de données.
- **Stack** : Vite + React + TypeScript, Tailwind CSS, React Router.
- **Audio** : Web Audio API native (pas de librairie tierce) pour le métronome et le tuner.
- **Stockage** :
  - Contenu "de base" (exercices, tabs fournies) : fichiers JSON versionnés dans le projet.
  - Données personnelles (progression, streak, tabs importées, préférences) : `localStorage`.

## Direction visuelle — "Violet Néon"

Thème sombre validé avec l'utilisateur (maquette comparée à 3 autres options) :

| Rôle | Couleur |
|---|---|
| Fond principal | `#0c0a10` |
| Fond panneaux/cartes | `#16131c` |
| Bordures | `#271f30` |
| Accent (actif/XP/surlignage) | `#a855f7` |
| Texte principal | `#f1edf5` |
| Texte atténué | `#948aa3` / `#766c85` |

Esthétique : coins arrondis modérés, accents néon violets réservés aux éléments actifs/interactifs
(barres de progression, note en cours, boutons principaux), ambiance scène/concert metal plutôt
que "corporate dark mode".

## Pages

1. **Dashboard** — XP/niveau global, streak du jour + objectif, exercice(s) + tab "du jour", accès rapide tuner/métronome.
2. **Exercices** — liste filtrable par catégorie/niveau, page détail par exercice (description, pattern jouable, BPM cible).
3. **Bibliothèque de tabs** — liste filtrable par sous-genre metal / difficulté / accordage.
4. **Tab individuelle** (`/tabs/:id`) — lecteur animé (voir section dédiée).
5. **Tuner** — accessible depuis n'importe quelle page (overlay ou page dédiée).
6. **Progression** — XP dans le temps, répartition par compétence, historique de streak, badges.
7. **Ressources / Tutoriels** — conseils écrits + liens externes classés par thème.

## Lecteur de tab animé (page `/tabs/:id`)

Décision validée avec l'utilisateur (maquette comparant 2 comportements) :

- **Curseur mobile sur tab fixe** (option retenue) : la portion de tab visible ne défile pas,
  seul le surlignage de la note/accord courant avance au fil du temps — façon karaoké. Permet de
  voir plusieurs mesures à l'avance avant de les jouer. Quand la lecture dépasse la portion
  visible, la vue pagine à la mesure/ligne suivante.
- **Barre supérieure fixe** : titre/artiste, BPM affiché, slider de vitesse (% du tempo original,
  ex. 50–150 %), play/pause, toggle métronome, toggle boucle sur une section sélectionnée.
- **Manche interactif optionnel** (activé par défaut, désactivable) : petit diagramme des 6
  cordes/frettes affichant la position exacte de la note en cours — utile pour relier la tab à la
  position réelle sur le manche quand on débute.
- Le curseur avance en synchronisation avec le **métronome** (même horloge audio que le clic),
  pas une simple animation CSS découplée du son.

## Métronome

- Web Audio API avec **scheduling look-ahead** : un minuteur court (ex. 25 ms) planifie les
  prochains clics dans le futur via `AudioContext.currentTime`, pour une précision rythmique sans
  dérive (contrairement à un simple `setInterval` qui joue le son directement).
- Signature rythmique configurable (4/4 par défaut), accent sur le premier temps, volume réglable.
- Deux modes d'usage : (a) piloté par la page tab (vitesse = celle du lecteur), (b) autonome
  (page/overlay dédié, tempo libre).

## Tuner

- Accès micro via `getUserMedia`, détection de la fréquence fondamentale par **autocorrélation**
  sur le signal (`AnalyserNode`).
- Affichage : note détectée, écart en cents, jauge/aiguille visuelle (vert = juste, rouge = à
  ajuster).
- Sélecteur d'accordage cible : Standard (E A D G B E), Drop D, Eb (demi-ton bas), Open G, Open D
  — liste extensible facilement (accordages stockés en données, pas en dur dans le code).
- Si l'accès micro est refusé : message explicite et instructions pour l'autoriser, le reste du
  site reste utilisable.

## Système de progression

- **XP** gagné en complétant des exercices, en pratiquant des tabs, et en atteignant l'objectif du
  jour.
- **Niveau global** du joueur basé sur l'XP cumulée (paliers nommés, ex. Débutant → Intermédiaire
  → Avancé → Expert → Virtuose), pensé pour accompagner une vraie progression dans le temps (pas
  seulement un tag statique).
- **Niveau par compétence/catégorie** (indépendant du niveau global) : gammes/modes, legato,
  alternate picking, bends/vibrato, palm muting, sweep picking, rythmique/riffs, arpèges. Chaque
  catégorie progresse selon les exercices/tabs pratiqués qui la travaillent.
- Rien n'est verrouillé : tout le contenu reste accessible, mais le contenu "recommandé" du
  Dashboard s'adapte au niveau par compétence.
- **Badges/achievements** (ex. streak de 7/30/100 jours, premier riff à X BPM, catégorie montée
  d'un niveau).
- **Streak** basé sur un **objectif quotidien configurable** par l'utilisateur (ex. X minutes de
  pratique ou X exercices complétés) ; le streak avance les jours où l'objectif est atteint.
- Page **Progression** : graphique XP dans le temps, répartition par compétence, historique de
  streak/objectif, liste des badges débloqués.

## Modèle de données

### Exercice (`content/exercises/*.json`, ~100 au total)

```
{
  id, title, category,        // gammes | legato | picking | bends | palmMuting | sweep | rhythm | arpeggios
  difficulty: 1-10,
  description: string,
  targetBpm: number,
  xpReward: number,
  pattern: TabEvent[]          // réutilise le même format que les tabs, pour le même lecteur
}
```

Répartition indicative (ajustable en construisant le contenu) : ~15 gammes/modes, ~15
rythmique/palm muting, ~15 alternate picking, ~10 legato, ~10 bends/vibrato, ~10 sweep picking,
~10 power chords/riffs, ~15 arpèges — répartis du niveau débutant à avancé.

### Tab (`content/tabs/*.json`)

```
{
  id, title, artist, subgenre, tuning, originalTempo, difficulty: 1-10,
  measures: [
    { events: [ { string: 1-6, fret: number, startBeat: number, duration: number, technique?: "bend"|"slide"|"palmMute"|"hammer"|"pull"|"vibrato" } ] }
  ]
}
```

Pas de paroles stockées (uniquement les données nécessaires à jouer l'instrument).

### Progression personnelle (`localStorage`)

```
{
  xpTotal, skillXp: { [category]: number },
  level, skillLevels: { [category]: number },
  dailyGoal: { type: "minutes" | "exercises", amount: number },
  streak: { current, longest, history: { [date]: boolean } },
  badges: string[],
  customTempoByTabId: { [tabId]: number },
  importedTabs: Tab[]
}
```

## Contenu de départ

- **~100 exercices** créés pour couvrir les catégories ci-dessus, du niveau débutant à avancé, afin
  que la progression par compétence ait du sens dès le départ.
- **Bibliothèque de tabs metal** : sélection ciblée et variée (plusieurs sous-genres : heavy
  classique, thrash, groove, metalcore, power metal...), avec une majorité de riffs/intros
  accessibles à un débutant et quelques morceaux plus difficiles pour la suite. Tags artiste /
  sous-genre / accordage / difficulté / tempo sur chaque tab. Pas de scraping automatique en masse :
  sélection faite manuellement pour la qualité/exactitude des données rythmiques.
- **Import utilisateur** : zone pour coller une tab ASCII standard (6 lignes), parsée en
  "best effort" vers le format interne (positionnement temporel approximatif basé sur les colonnes,
  ajustable ensuite via l'édition du tempo/timing) — pour continuer à faire grossir la
  bibliothèque après la mise en route du site.

## Gestion des erreurs

- Micro refusé/absent → tuner désactivé avec message explicite, reste du site fonctionnel.
- Tab importée mal formée → message d'erreur clair au moment de l'import, pas de crash, rien n'est
  sauvegardé tant que le parsing n'a pas produit un résultat valide.
- `localStorage` indisponible ou plein → dégradation silencieuse (perte de la sauvegarde de
  progression signalée une fois, sans bloquer l'usage du site).

## Tests

Projet personnel : pas de suite exhaustive, mais couverture pragmatique :
- Tests unitaires sur la logique pure : calcul XP/niveaux (global + par compétence), parsing
  tab ASCII → format interne, scheduler du métronome (précision simulée via horloge fake).
- Vérification manuelle en navigateur aux étapes clés : lecteur de tab (sync curseur/métronome),
  tuner avec micro réel, flux streak/objectif quotidien.

## Phases de construction (pour le plan d'implémentation)

1. Socle app : Vite/React/TS/Router/Tailwind, thème "Violet Néon", layout + navigation.
2. Moteur de tab : format de données, rendu statique, lecteur animé (curseur mobile), contrôle de
   vitesse.
3. Métronome (scheduler look-ahead) intégré au lecteur + mode autonome.
4. Tuner (micro + autocorrélation + sélecteur d'accordage).
5. Système de progression : XP/niveaux/compétences/streak/objectif + Dashboard + page Progression.
6. Contenu : ~100 exercices + bibliothèque de tabs metal de départ + import utilisateur ASCII.
7. Ressources/tutoriels + polish visuel final + tests.
