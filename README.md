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
npm ci              # installe typescript, esbuild, @types/node, cytoscape et cytoscape-fcose (versions épinglées)
npm run build       # construit dist/ : index.html, css/, js/site.js, js/media-graph.js, licenses/
```

`dist/js/site.js` est un script classique (pas un module, qu'un navigateur refuse en file://) qui contient aussi les données de `data/*.json` : le site ne télécharge rien au chargement. `dist/js/media-graph.js`, un second script classique minifié, contient Cytoscape.js et sa disposition fcose pour les vues du graphe des médias ; la page Médias l'ajoute la première fois qu'on ouvre une de ces vues, si bien que le reste du site garde son poids.

## Organisation

```
data/*.json        référentiel : partis, sites officiels, outils, territoires, votation
src/types.ts       types du référentiel, partagés par le site et l'outil
src/site/*.ts      le site (modules TypeScript)
tools/cli.ts       outil local : check, links, parliament, cantonal-parliaments
tools/xlsx.ts      lecteur xlsx (zip et XML, modules intégrés de Node)
tools/*.test.ts    tests de l'outil (npm test)
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
- `data/cantonal-governments.json` : le gouvernement de chaque canton couvert, tenu à la main. Pour chaque membre : nom, parti (`id` d'un parti du canton), département et présidence comme la page officielle les écrit, la page officielle (`source`), la page qui nomme son parti (`party_source` : page officielle, résultat d'élection ou page du parti) et la date `checked_on`. Un canton absent n'affiche pas de gouvernement (Fribourg jusqu'à la publication du Conseil d'État élu au second tour du 29.11.2026). `npm run check` exige le bon nombre de membres et des partis du canton, et avertit sans échouer pour toute fiche vérifiée il y a plus de 180 jours.
- `data/media.json` : les médias de Suisse romande, leur éditeur, les sociétés et autres détenteurs, les participations et les valeurs du fög, tenus à la main. Chaque fait porte sa source et sa date `checked_on` ; le Medienmonitor se lit dans le navigateur, aucun script ne le lit. `npm run check` contrôle les références, la somme des parts (une part disputée comptée une fois), les éditeurs et les retraits. Voir « Médias : corrections et retraits » ci-dessous.

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
npm run cantonal-parliaments     # écrit data/cantonal-parliaments.json (tableau OFS des élections cantonales)
node tools/cli.ts media-fingerprint   # lit un nom sur l'entrée standard et affiche son empreinte (retrait d'un nom)
npm run media-register           # écrit data/media-register.json (registre du commerce) et liste les différences avec data/media.json
npm test                         # tests de l'outil (lecteur xlsx, parlements cantonaux)
```

`links` ne teste pas les `previous_urls`. Un lien est cassé s'il répond par une erreur, ou s'il redirige vers un autre domaine (par exemple un ancien domaine de parti renvoyé vers une page de recherche) : la commande échoue alors. Les erreurs passagères (réseau, délai dépassé, erreur 5xx) sont retentées avant d'être signalées. Les réponses 403 et 429 (sites qui bloquent les robots) sont à vérifier à la main et ne font pas échouer.

Pour les votations : voir Swissvotes (CSV).

La composition actuelle des chambres fédérales et du Conseil fédéral vient de l'API du Parlement (`ws.parl.ch`, documentation publique sur https://ws.parl.ch/doc/v3/api-docs). L'API demande une clé personnelle : `npm run parliament` la lit dans la variable `PARL_API_KEY` ou dans `~/.config/civic-compass/env` (ligne `PARL_API_KEY=...`, droits 600), hors du dépôt ; elle n'est jamais écrite dans le dépôt, le fichier produit ni la console. La commande ne demande que le nom, le conseil, le parti, le canton et la fonction au Conseil fédéral, garde la réponse de l'API telle quelle (`persons`) et range à part la correspondance avec les partis CH (`party_mapping` : PLD compté avec le PLR, Al avec les Verts). Elle refuse d'écrire si le téléchargement échoue ou si la composition est inattendue ; `npm run check` vérifie ensuite 200 membres au Conseil national, 46 au Conseil des États, 7 au Conseil fédéral, un président, un vice-président et un chancelier de la Confédération, et des abréviations connues. Conditions d'utilisation : source « Services du Parlement de l'Assemblée fédérale, Berne » et date de téléchargement affichées avec chaque chiffre, données inchangées, site présenté comme non officiel. `data/parliament-current.json` est commité et ne se modifie jamais à la main.

Les sièges des parlements cantonaux viennent du tableau OFS je-f-17.02.05.01.03 (« Élections des parlements cantonaux : répartition des mandats par parti et par canton »). `npm run cantonal-parliaments` trouve sa version courante par l'API DAM de l'OFS, vérifie que ses conditions sont toujours OPEN-BY (utilisation libre, source obligatoire), télécharge le xlsx et le lit avec `tools/xlsx.ts`, sans dépendance. Elle garde tels quels les libellés des colonnes, la ligne de chaque canton couvert et les notes du tableau, et range à part la correspondance entre les colonnes de l'OFS et les partis du canton (`party_mapping`, dans `tools/cantonal-parliaments.ts`) ; une colonne sans parti du canton sur le site (VD « Sol. », NE « Le Centre », les « Autres » de VD, VS et FR) garde le libellé de l'OFS. Ce sont des résultats au jour de l'élection : l'OFS ne compte pas les changements de groupe ultérieurs et ne donne que l'année de l'élection, pas sa date. La commande refuse d'écrire si le téléchargement échoue ou si le tableau est inattendu ; `npm run check` vérifie ensuite qu'il y a une ligne par canton couvert, que les sièges par parti s'additionnent au total et à la taille du parlement (GE 100, VD 150, VS 130, NE 100, JU 60, FR 110) et que chaque parti de la correspondance existe dans le canton. `data/cantonal-parliaments.json` est commité et ne se modifie jamais à la main.

## Médias : corrections et retraits

La fiche d'un média, d'une personne ou d'une famille propose « Signaler une erreur ou demander un retrait », qui écrit à l'adresse du mainteneur. Chaque demande est traitée dans les 30 jours.

**Répondre.** Accuser réception à l'expéditeur, sans recopier la demande dans une issue publique.

**Une erreur.** Vérifier la source donnée (ou en trouver une), corriger l'entrée de `data/media.json` avec sa `source` et la date du jour dans `checked_on`, puis `npm run check`. Sans source, ne rien changer et le dire à l'expéditeur.

**Le registre du commerce.** `npm run media-register` demande au registre (données liées de Zefix sur lindas.admin.ch, sans clé) le nom, la forme juridique et le siège de chaque société ou détenteur qui a un IDE dans `data/media.json`, écrit sa réponse dans `data/media-register.json` (généré, ne jamais le modifier à la main) et liste les différences : nom, forme ou siège différents, société en liquidation, IDE absent du registre (radiée ou erroné). Elle ne modifie jamais `data/media.json` : corriger à la main, source à l'appui. Code de sortie 0 sans différence, 1 avec des différences, 2 si le registre ne répond pas (rien n'est alors écrit).

**Les valeurs du fög.** Quand le fög publie une nouvelle édition, remplacer l'édition et les valeurs de `fog` dans `data/media.json`, avec la source et la date ; `npm run check` avertit quand l'édition a été vérifiée il y a plus de 180 jours.

**Le retrait d'un nom.** Une personne nommée comme détentrice (personne ou famille) peut demander que son nom soit retiré. La participation reste, avec sa part : le site affiche « actionnaire privé », sans fiche, sans nom.

1. Calculer l'empreinte du nom, tapé sur l'entrée standard pour qu'il ne reste pas dans l'historique du shell : `node tools/cli.ts media-fingerprint`, taper le nom tel que la source l'écrit, puis Entrée et Ctrl+D.
2. Dans `holders`, supprimer `name` et ajouter `"removal": { "fingerprint": "<empreinte>", "date": "<AAAA-MM-JJ>", "reason": "person_request" }`.
3. Remplacer son `id` par un id neutre, `removed_1`, `removed_2`... (un id comme `p_prenom_nom` garderait le nom), dans `holders` et dans chacune de ses participations. Retirer le nom de toute `note` qui le citerait.
4. `npm run check`, `npm test`, `npm run build`, puis ouvrir la page Médias : le nom ne doit apparaître nulle part. Le contrôle échoue si une mise à jour remet ce nom, sous n'importe quel id, et ses messages ne l'affichent jamais.
5. Ne pas écrire le nom dans le message de commit, la pull request ni une issue. Répondre à la personne une fois le site publié.

L'empreinte a deux limites (PRD-0001 §8), à dire à la personne dans la réponse : quelqu'un qui soupçonne déjà un nom peut le tester contre l'empreinte, et le nom reste dans l'historique git des versions publiées avant le retrait.

## Design

Apparence basée sur le [Design System de la Confédération](https://swiss.github.io/designsystem/) (licence MIT, voir `css/DESIGNSYSTEM-LICENSE.txt`). Ce site est indépendant et n'est pas un site officiel : il ne reprend ni les armoiries ni les logos de la Confédération.

## Publication

Le workflow `pages.yml` construit le site (`npm run build`) et publie `dist/` sur GitHub Pages. Dans le dépôt : Settings, Pages, Source : GitHub Actions.

## Licence

Code du site : MIT. Fichiers `css/designsystem.css` et `css/fonts` : voir la licence du Design System de la Confédération. Bibliothèques incluses dans `js/media-graph.js` ([Cytoscape.js](https://github.com/cytoscape/cytoscape.js), [cytoscape-fcose](https://github.com/iVis-at-Bilkent/cytoscape.js-fcose) et ses dépendances cose-base et layout-base) : MIT, licences copiées dans `dist/licenses/`.
