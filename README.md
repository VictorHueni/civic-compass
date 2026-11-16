# Boussole citoyenne

Un lanceur pour la politique suisse et genevoise : les sites des partis classés **de gauche à droite**, les outils qui aident à décider lors des votations, et les sites de l'État.

Site statique écrit en TypeScript. Une fois construit, il tient en un dossier `dist/` : ouvrez `dist/index.html`, par double clic (file://) ou depuis n'importe quel hébergement statique.

## Contenu

- **Partis** : navigation de gauche à droite, au niveau suisse et genevois. Le classement est indicatif (usage courant des médias et de la recherche).
- **Aider à décider** : smartvote, smartmonitor, PolitPro, Vimentis, easyvote, Swissvotes, Année politique suisse.
- **Sites de l'État** : Confédération, Parlement, Chancellerie, canton et Grand Conseil de Genève.

## Construire et ouvrir le site

Il faut Node 26 (il exécute directement les fichiers `.ts`, sans compilation).

```
npm ci              # installe typescript, esbuild et @types/node (versions épinglées)
npm run build       # construit dist/ : index.html, css/, js/boussole.js
```

`dist/js/boussole.js` est un script classique (pas un module, qu'un navigateur refuse en file://) qui contient aussi les données de `data/*.json` : le site ne télécharge rien au chargement.

## Organisation

```
data/*.json        référentiel : partis, sites officiels, outils, territoires, votation
src/types.ts       types du référentiel, partagés par le site et l'outil
src/site/*.ts      le site (modules TypeScript)
tools/boussole.ts  outil local : check, links, seats
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

Le site ne contient aucune URL en dur : il retrouve Fedlex, le Parlement, ch.ch, smartvote et les autres dans le référentiel par leur `id` (liste dans `src/site/links.ts`).

Après une modification :

```
npm run check       # types TypeScript + contrôle de data/*.json
npm run links       # teste les URL actuelles
```

Le workflow **Contrôle des liens** lance les deux à chaque push et chaque lundi.

## Outil local

`tools/boussole.ts` tourne sur votre machine avec Node 26, sans étape de compilation :

```
npm run check                    # contrôle data/*.json : champs, types, id uniques, territoires, statuts, dates, mots d'ordre
npm run links                    # teste les URL actuelles de data/*.json (--all : affiche aussi les liens OK)
npm run seats -- --show          # montre les colonnes du fichier de l'OFS
npm run seats                    # écrit data/seats-national-council-2023.json
```

`links` ne teste pas les `previous_urls`. Un lien est cassé s'il répond par une erreur, ou s'il redirige vers un autre domaine (par exemple un ancien domaine de parti renvoyé vers une page de recherche) : la commande échoue alors. Les erreurs passagères (réseau, délai dépassé, erreur 5xx) sont retentées avant d'être signalées. Les réponses 403 et 429 (sites qui bloquent les robots) sont à vérifier à la main et ne font pas échouer.

Le fichier des sièges vient de l'OFS (opendata.swiss, élections au Conseil national 2023). Si l'outil ne reconnaît pas les colonnes, relancez avec `--col-name N --col-seats N`. Contrôlez que le total fait 200 sièges. Pour les votations et le Parlement : voir Swissvotes (CSV) et api.openparldata.ch.

## Design

Apparence basée sur le [Design System de la Confédération](https://swiss.github.io/designsystem/) (licence MIT, voir `css/DESIGNSYSTEM-LICENSE.txt`). Ce site est indépendant et n'est pas un site officiel : il ne reprend ni les armoiries ni les logos de la Confédération.

## Publication

Le workflow `pages.yml` construit le site (`npm run build`) et publie `dist/` sur GitHub Pages. Dans le dépôt : Settings, Pages, Source : GitHub Actions.

## Licence

Code du site : MIT. Fichiers `css/designsystem.css` et `css/fonts` : voir la licence du Design System de la Confédération.
