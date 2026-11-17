# Boussole citoyenne : notes de reprise

Site statique mobile first en TypeScript, construit en un seul script classique qui fonctionne en file://. Ce fichier résume l'état au 2026-11-16 et les décisions, pour reprendre le développement. La spécification est le PRD-0001, la conception est la fiche de conception (voir « Documents »).

## Intention
Un « gros lanceur » pour la politique suisse : prochaine votation, partis de gauche à droite (Confédération et cantons), outils d'aide à décider, sites officiels. Dépôt public `VictorHueni/civic-compass`, publié sur https://victorhueni.github.io/civic-compass/ par GitHub Actions à chaque fusion sur `main`.

## Décisions prises
- Nom affiché : Boussole citoyenne ; dépôt et code : `civic-compass`. Design system de la Confédération (github.com/swiss/designsystem, MIT), site indépendant, sans logos ni armoiries.
- MVP en français uniquement. Allemand, italien et cantons alémaniques et tessinois viendront avec un PRD dédié (noms envisagés : Bürgerkompass ou Stimmkompass, Bussola civica).
- Aucune statistique de visite pour le MVP (ni compteur, ni script tiers) ; la mesure viendra avec un travail SEO dédié.
- Mobile first. Territoire choisi sur une carte en cases (26 cantons) dans une feuille modale, ou « Confédération ». Cantons couverts : GE, VD, VS, NE, JU, FR (les autres « bientôt »).
- Routes en anglais : `#<page>/<territoire>` avec ballot (accueil), parties, tools, state ; territoire `ch` ou code de canton en minuscules. Les anciennes routes françaises (`#votation`, `#partis`, `#aides`, `#etat`, `federal`) restent acceptées et sont réécrites.
- Le visiteur ne voit que des liens vérifiés et jamais leur statut : un parti sans lien vérifié propose une recherche web, un site officiel ou un outil non vérifié n'apparaît pas.
- Aucun fait sans source : un fait de parti (fondation, sièges au Conseil fédéral) n'est affiché qu'avec sa source et sa date ; les 18 faits actuels sont masqués faute de source.
- Classement gauche-droite indicatif et éditorial, tous les partis restent dans l'hémicycle. Pour les partis nationaux et leurs sections, il s'appuie sur la CHES 2024 (`lrgen`), gardée dans les données comme aide, jamais affichée, citée en pied de page. Étiquette du PS : « Gauche ».
- Mots d'ordre : uniquement depuis une source primaire du parti national (site, communiqué, assemblée des délégués), recoupés avec Swissvotes ; valeurs oui, non ou liberté de vote. Un sondage n'est jamais une source.
- Tout en TypeScript (site et outil), sans dépendance d'exécution. Dépendances de développement épinglées : typescript, esbuild, @types/node. Node 26 exécute directement `tools/*.ts`.
- Code en anglais (fichiers, identifiants, classes CSS, id, clés JSON, valeurs d'énumération) ; textes du site et messages de l'outil en français. Pas de tiret long dans les textes.
- Le site doit marcher par double clic sur `dist/index.html` : esbuild produit un script classique (iife, pas de `type="module"`) qui contient les données, sans aucun fetch. Les champs réservés aux mainteneurs (`left_right`, `_readme`) sont retirés du script.

## Fichiers
- `data/` : référentiel édité à la main (`territories`, `parties`, `state-sites`, `tools`, `ballot` du 29.11.2026), avec pour chaque lien `status`, `checked_on`, `evidence` et `previous_urls`. `parliament-current.json` est généré par `npm run parliament` (API du Parlement, clé hors du dépôt), `cantonal-parliaments.json` par `npm run cantonal-parliaments` (tableau OFS des élections cantonales) ; ni l'un ni l'autre ne se modifie à la main.
- `src/types.ts` : types et schémas du référentiel, partagés par le site et l'outil.
- `src/site/` : `main.ts` (entrée), `app.ts` (routage, menu, carte, partis, aides, sites officiels), `ballot.ts` (page votation), `institutions.ts` (page « Qui gouverne et qui siège », `#institutions/<territoire>`), `parliament.ts` (lecture de `parliament-current.json`, partagée avec l'outil), `party-colours.ts` (palette B2), `referential.ts` (lecture des données, liens vérifiés seulement), `links.ts` (ids des entrées liées par le site), `dom.ts`.
- `index.html`, `css/site.css` (+ `css/designsystem.css` et `css/fonts` du DS).
- `tools/cli.ts` : `check` (schémas, cohérences, avis sur l'ordre gauche-droite), `links` (URL actuelles ; redirection vers un autre domaine = erreur ; 403, 429, délai dépassé et exceptions de certificat `ACCEPTED_CERT_ISSUES` = à vérifier), `parliament` (composition actuelle depuis `ws.parl.ch` : réponse brute, correspondance des partis à part, 200 + 46 + 7 obligatoires), `cantonal-parliaments` (dernière élection des six Grands Conseils depuis le tableau OFS je-f-17.02.05.01.03, lu par `tools/xlsx.ts` ; règles dans `tools/cantonal-parliaments.ts`). `npm test` lance `tools/*.test.ts` (node:test, aussi en CI). `tools/build.ts` construit `dist/`.
- `.github/workflows/` : `links.yml` (`npm run check`, `npm run links`, à chaque push et chaque lundi) et `pages.yml` (`npm run build`, publie `dist/`).

## Documents
- `docs/product-specs/prds/prd-0001-swiss-politics-launcher.md` : spécification (18 stories dont 6 sur les institutions, décisions du 2026-11-16 en §8).
- `docs/plans/active/swiss-politics-launcher/` : fiche de conception (écrans, contrats, code, données). Page privée : https://claude.ai/artifact/Vn8oXEHZVTgLLxi3iAMoS1 ; reconstruire avec `./render.sh`, `capture-screens.ts` puis le rendu `com-artefact-viz` (voir son README). `out/` n'est pas commité.
- `docs/architecture/research/0001-left-right-placement-sources.md` : sources du classement gauche-droite.

## Données : état au 2026-11-16
- Partis : 51 sur 51 vérifiés. `popjura.ch` (CS-POP, JU) a un certificat HTTPS au nom de pst-pop.ch : avertissement du navigateur, exception dans `ACCEPTED_CERT_ISSUES` à retirer dès que le POP le corrige. `eag-ge.ch` (EàG, GE) n'a plus d'article depuis mars 2025.
- Sites de l'État : 15 sur 15 vérifiés ; outils : 7 sur 7 (`anneepolitique.swiss` refuse les robots, à revoir à la main).
- Votation du 29.11.2026 : 32 mots d'ordre sur 36 (solidaritéS sans position nationale trouvée sur les feux d'artifice et les couples mariés), recommandation du Conseil fédéral sur les 4 objets, objets cantonaux GE (Seymaz-Sud) et VS (aéroport, salaire minimum). Résumés oui/non indicatifs, la brochure officielle fait foi.
- Fiches des partis CH : membres du Conseil fédéral, sièges au Conseil national et au Conseil des États dans la composition actuelle (API du Parlement), partis régionaux nommés (« dont 1 PLD Bâle-Ville »), source et date sous la fiche. Le résultat OFS 2023 et sa commande `npm run seats`, ainsi que le fait `federal_council_seats` saisi à la main, ont été retirés le 17.11.2026.
- Institutions de la Confédération (`#institutions/ch`) : Conseil fédéral, Conseil national et Conseil des États dans leur composition actuelle (API du Parlement), couleurs de la palette B2, partis sans couleur regroupés sous « Autres ». Pour un canton, la page montre ses élus à Berne ; Conseil d'État et Grand Conseil viendront avec US-14 et US-17. Le menu « Qui gouverne et qui siège » remplace le lien externe « Trouver un élu ».
- Sources publiques identifiées : OFS / opendata.swiss, parlament.ch OData (ws.parlament.ch/odata.svc), OpenParlData (api.openparldata.ch), Swissvotes (CSV, CC BY 4.0), calendrier des votations de la Chancellerie, JSON élections de ge.ch.

## Prochaines étapes suggérées
1. Avant le 29.11.2026 : relancer `npm run links`, revérifier les mots d'ordre manquants de solidaritéS.
2. Sourcer les faits masqués : sièges au Conseil fédéral (admin.ch) et années de fondation.
3. Après le 29.11.2026 : résultats par canton sur la carte (données OFS), puis préparer `ballot.json` du scrutin suivant.
4. Travail SEO, avec la mesure des visites.
5. Institutions (PRD-0001 US-13 à US-18) : fédéral, puis Grands Conseils, Conseils d'État et présidences.
6. Plus tard : site trilingue et cantons alémaniques et tessinois, un canton à la fois.
