# Boussole citoyenne

Un lanceur pour la politique suisse et genevoise : les sites des partis classés **de gauche à droite**, les outils qui aident à décider lors des votations, et les sites de l'État.

Site statique écrit en TypeScript. Une fois construit, il tient en un dossier `dist/` : ouvrez `dist/index.html`, par double clic (file://) ou depuis n'importe quel hébergement statique.

## Contenu

- **Partis** : navigation de gauche à droite, au niveau suisse et genevois. Le classement est indicatif : pour les partis nationaux et leurs sections, il s'appuie sur l'enquête d'experts Chapel Hill (CHES 2024, variable `lrgen`), dont le score est gardé dans `data/parties.json` (`left_right`) comme aide et n'est pas affiché ; `npm run check` signale tout ordre qui le contredit, sans bloquer. Les partis sans score (PST-POP, solidaritéS, partis uniquement cantonaux) sont placés à la main. Voir `docs/architecture/research/0001-left-right-placement-sources.md`.
- **Aider à décider** : smartvote, smartmonitor, PolitPro, Vimentis, easyvote, Swissvotes, Année politique suisse.
- **Sites de l'État** : Confédération, Parlement, Chancellerie, canton et Grand Conseil de Genève.

## Construire et ouvrir le site

Il faut Node 26 (il exécute directement les fichiers `.ts`, sans compilation).

```
npm ci              # installe typescript, esbuild et @types/node (versions épinglées)
npm run build       # construit dist/ : index.html, css/, js/site.js
```

`dist/js/site.js` est un script classique (pas un module, qu'un navigateur refuse en file://) qui contient aussi les données de `data/*.json` : le site ne télécharge rien au chargement.

## Organisation

```
data/*.json        référentiel : partis, sites officiels, outils, territoires, votation
src/types.ts       types du référentiel, partagés par le site et l'outil
src/site/*.ts      le site (modules TypeScript)
tools/cli.ts       outil local : check, links, parliament
tools/build.ts     construction de dist/
index.html, css/   page et styles (Design System de la Confédération)
dist/              site construit (non versionné)
```

## Modifier les données

Les données sont des fichiers JSON dans `data/`, pas du code :

- `data/parties.json` : partis par territoire (`territory`, `CH` = Confédération), de gauche à droite (l'ordre du tableau compte).
- `data/state-sites.json` : sites officiels par territoire (le premier site d'un canton est son site officiel).
- `data/tools.json` : outils d'aide à la décision.
- `data/territories.json` : la Confédération et les 26 cantons.
- `data/ballot.json` : le prochain scrutin, ses objets (`items`) et les mots d'ordre sourcés (`parties`, valeurs `yes` ou `no`, clés = `abbr` des partis CH).

Chaque lien porte un `status` (`verified`, `to_confirm`, `not_found` avec `url: null`), une date `checked_on`, une preuve `evidence` (par exemple le titre de la page) et la liste `previous_urls` des adresses abandonnées (`url`, `seen_on`, `note`), gardées pour mémoire. La forme exacte de chaque fichier est décrite par `src/types.ts`.

Le site n'affiche que les liens `verified` et ne montre jamais le statut au visiteur : un parti dont le lien n'est pas vérifié propose une recherche, un site officiel ou un outil non vérifié n'apparaît pas. Pour publier un lien, vérifiez-le puis passez-le en `verified`.

Le site ne contient aucune URL en dur : il retrouve Fedlex, le Parlement, ch.ch, smartvote et les autres dans le référentiel par leur `id` (liste dans `src/site/links.ts`).

Après une modification :

```
npm run check       # types TypeScript + contrôle de data/*.json
npm run links       # teste les URL actuelles
```

Le workflow **Contrôle des liens** lance les deux à chaque push et chaque lundi.

## Outil local

`tools/cli.ts` tourne sur votre machine avec Node 26, sans étape de compilation :

```
npm run check                    # contrôle data/*.json : champs, types, id uniques, territoires, statuts, dates, mots d'ordre
npm run links                    # teste les URL actuelles de data/*.json (--all : affiche aussi les liens OK)
npm run parliament               # écrit data/parliament-current.json (clé de l'API du Parlement requise)
```

`links` ne teste pas les `previous_urls`. Un lien est cassé s'il répond par une erreur, ou s'il redirige vers un autre domaine (par exemple un ancien domaine de parti renvoyé vers une page de recherche) : la commande échoue alors. Les erreurs passagères (réseau, délai dépassé, erreur 5xx) sont retentées avant d'être signalées. Les réponses 403 et 429 (sites qui bloquent les robots) sont à vérifier à la main et ne font pas échouer.

Pour les votations : voir Swissvotes (CSV).

La composition actuelle des chambres fédérales et du Conseil fédéral vient de l'API du Parlement (`ws.parl.ch`, documentation publique sur https://ws.parl.ch/doc/v3/api-docs). L'API demande une clé personnelle : `npm run parliament` la lit dans la variable `PARL_API_KEY` ou dans `~/.config/civic-compass/env` (ligne `PARL_API_KEY=...`, droits 600), hors du dépôt ; elle n'est jamais écrite dans le dépôt, le fichier produit ni la console. La commande ne demande que le nom, le conseil, le parti, le canton et la fonction au Conseil fédéral, garde la réponse de l'API telle quelle (`persons`) et range à part la correspondance avec les partis CH (`party_mapping` : PLD compté avec le PLR, Al avec les Verts). Elle refuse d'écrire si le téléchargement échoue ou si la composition est inattendue ; `npm run check` vérifie ensuite 200 membres au Conseil national, 46 au Conseil des États, 7 au Conseil fédéral, un président, un vice-président et un chancelier de la Confédération, et des abréviations connues. Conditions d'utilisation : source « Services du Parlement de l'Assemblée fédérale, Berne » et date de téléchargement affichées avec chaque chiffre, données inchangées, site présenté comme non officiel. `data/parliament-current.json` est commité et ne se modifie jamais à la main.

## Design

Apparence basée sur le [Design System de la Confédération](https://swiss.github.io/designsystem/) (licence MIT, voir `css/DESIGNSYSTEM-LICENSE.txt`). Ce site est indépendant et n'est pas un site officiel : il ne reprend ni les armoiries ni les logos de la Confédération.

## Publication

Le workflow `pages.yml` construit le site (`npm run build`) et publie `dist/` sur GitHub Pages. Dans le dépôt : Settings, Pages, Source : GitHub Actions.

## Licence

Code du site : MIT. Fichiers `css/designsystem.css` et `css/fonts` : voir la licence du Design System de la Confédération.
