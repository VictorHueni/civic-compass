# Boussole citoyenne : notes de reprise

Site statique mobile first en TypeScript, construit en un seul script classique qui fonctionne en file://. Projet issu d'une conversation avec Claude. Ce fichier résume les décisions pour reprendre le développement en local.

## Intention
Un « gros lanceur » pour la politique suisse : prochaine votation, partis de gauche à droite (Confédération et cantons), outils d'aide à décider, sites officiels. Public GitHub sous VictorHueni, dépôt `civic-compass`, Pages via GitHub Actions.

## Décisions prises
- Nom : Boussole citoyenne. Design system de la Confédération (github.com/swiss/designsystem, MIT), site indépendant, sans logos ni armoiries.
- Mobile first. Territoire choisi sur une carte en cases (cartogramme des 26 cantons) dans une feuille modale, ou « Confédération ». Cantons couverts : GE, VD, VS, NE, JU, FR (les autres « bientôt »).
- Pages (hash `#page/territoire`, ex. `#partis/ge`) : votation (accueil), partis (hémicycle, un secteur par parti, gauche à droite), aides (Comprendre, Comparer, Décider), etat (sites officiels avec recherche).
- Menu hamburger sur téléphone, déplié sur ordinateur. Deux groupes : « Je veux... » (pages) et « Voir ce que fait l'État » (Fedlex, Parlement, Chancellerie, OFS, selon le territoire).
- Votation : liste numérotée des objets, une page par objet avec trois onglets (Comprendre : oui/non + liens ; Comparer : hémicycle coloré par mots d'ordre + smartvote, smartmonitor, Swissvotes ; Décider). Style éditorial, aéré, pas de cartes colorées « trop IA ».
- Préférence de rédaction : ne pas utiliser le tiret long dans les textes.
- Tout en TypeScript (site et outil), sans dépendance d'exécution. Dépendances de développement épinglées : typescript, esbuild, @types/node. Node 26 exécute directement `tools/*.ts`.
- Le code est en anglais (fichiers, identifiants, clés JSON, valeurs d'énumération) ; les textes du site et les messages de l'outil restent en français.
- Le site doit marcher par double clic sur `dist/index.html` : esbuild produit un script classique (format iife, pas de `type="module"`, bloqué en file://) et les données JSON sont incluses dans ce script, sans aucun fetch.

## Fichiers
- `data/*.json` : référentiel (territories, parties, state-sites, tools, ballot du 29.11.2026), avec statut, date et preuve pour chaque lien, et anciennes URL (`previous_urls`).
- `src/types.ts` : types du référentiel, partagés par le site et l'outil. Chaque type a un schéma voisin que `tsc` force à rester aligné ; `npm run check` contrôle les JSON avec ces schémas.
- `src/site/` : le site en modules (`main.ts` point d'entrée, `app.ts` routage, menu, carte, partis, aides et sites officiels, `ballot.ts` page votation, `referential.ts` lecture des JSON, `links.ts` ids des entrées du référentiel vers lesquelles le site renvoie, `dom.ts` utilitaires).
- `index.html`, `css/site.css` (+ `css/designsystem.css` et `css/fonts` du DS).
- `tools/cli.ts` : outil local. `check` contrôle `data/*.json` ; `links` teste les URL actuelles ; `seats` télécharge les sièges du Conseil national 2023 (OFS) vers `data/seats-national-council-2023.json` (pas encore branché à l'interface). `tools/build.ts` construit `dist/`.
- `.github/workflows/` : `links.yml` (`npm run check` et `npm run links`) et `pages.yml` (`npm run build`, publie `dist/`).

## Données : état et limites
- Les URL ont été contrôlées à la main le 2026-11-16 (`status`, `checked_on`, `evidence`) ; les entrées `to_confirm` restent à confirmer. Relancer `npm run links` régulièrement : une redirection vers un autre domaine (domaine abandonné, page de recherche) compte comme une erreur. Sans site connu, `url: null` et `status: not_found` (la fiche propose une recherche).
- Sans site retrouvé : LJS (GE), PCSI (JU), Centre (VS), Verts et POP (NE), UDC (FR) et les autres entrées en `not_found` de `data/parties.json`.
- `data/ballot.json` : mots d'ordre PARTIELS (PS, Verts oui et PLR, solidaritéS non sur l'AVS ; PLR non feux d'artifice ; Centre, UDC oui couples mariés), avec sources listées ; à confirmer sur les sites des partis. Résumés oui/non indicatifs, la brochure officielle fait foi.
- Sources de données publiques identifiées : OFS / opendata.swiss (résultats CN 2023 : https://ogd-static.voteinfo-app.ch/v4/ogd/sd-t-17.02-NRW2023-parteien.json et le CSV appendix), parlament.ch OData (ws.parlament.ch/odata.svc), OpenParlData (api.openparldata.ch), Swissvotes (CSV, CC BY 4.0), calendrier des votations de la Chancellerie, JSON élections de ge.ch sur opendata.swiss.

## Prochaines étapes suggérées
1. Créer le dépôt public, pousser, activer Pages (Settings > Pages > Source: GitHub Actions).
2. Lancer `npm run links` et corriger les URL signalées.
3. Lancer `npm run seats -- --show` puis `npm run seats`, compléter les alias, brancher les sièges dans la fiche parti.
4. Déplacer les faits (fondation, sièges, positions) en JSON avec source et date par fait.
5. Compléter les mots d'ordre à partir des sites des partis ; automatiser avec Swissvotes après le scrutin.
6. Résultats par canton sur le cartogramme après la votation (données OFS) ; cantons alémaniques (textes en allemand).
