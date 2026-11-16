# Boussole citoyenne : notes de reprise

Site statique mobile first (HTML, CSS, JS sans dépendance, fonctionne en file://). Projet issu d'une conversation avec Claude. Ce fichier résume les décisions pour reprendre le développement en local.

## Intention
Un « gros lanceur » pour la politique suisse : prochaine votation, partis de gauche à droite (Confédération et cantons), outils d'aide à décider, sites officiels. Public GitHub sous VictorHueni, dépôt prévu `boussole-citoyenne` (pas encore créé), Pages via GitHub Actions.

## Décisions prises
- Nom : Boussole citoyenne. Design system de la Confédération (github.com/swiss/designsystem, MIT), site indépendant, sans logos ni armoiries.
- Mobile first. Territoire choisi sur une carte en cases (cartogramme des 26 cantons) dans une feuille modale, ou « Confédération ». Cantons couverts : GE, VD, VS, NE, JU, FR (les autres « bientôt »).
- Pages (hash `#page/territoire`, ex. `#partis/ge`) : votation (accueil), partis (hémicycle, un secteur par parti, gauche à droite), aides (Comprendre, Comparer, Décider), etat (sites officiels avec recherche).
- Menu hamburger sur téléphone, déplié sur ordinateur. Deux groupes : « Je veux... » (pages) et « Voir ce que fait l'État » (Fedlex, Parlement, Chancellerie, OFS, selon le territoire).
- Votation : liste numérotée des objets, une page par objet avec trois onglets (Comprendre : oui/non + liens ; Comparer : hémicycle coloré par mots d'ordre + smartvote, smartmonitor, Swissvotes ; Décider). Style éditorial, aéré, pas de cartes colorées « trop IA ».
- Préférence de rédaction : ne pas utiliser le tiret long dans les textes.

## Fichiers
- `index.html`, `css/boussole.css` (+ `css/designsystem.css` du DS), `js/data.js` (partis, outils, sites par canton), `js/votations.js` (scrutin du 29.11.2026), `js/app.js` (routage, menu, carte, partis), `js/scrutin.js` (page votation).
- `tools/boussole.py` : script local sans dépendance (Python 3.8+). `liens` teste toutes les URLs de `js/data.js` ; `sieges` télécharge les sièges du Conseil national 2023 (OFS) vers `data/sieges-cn-2023.json` (pas encore branché à l'interface).
- `.github/workflows/` : `links.yml` (lychee) et `pages.yml` (déploiement Pages).

## Données : état et limites
- Les URLs de partis cantonaux ne sont PAS validées (réseau bloqué dans la session). Certaines viennent d'adresses e-mail de pages officielles. À faire : `python3 tools/boussole.py liens`, puis corriger. Sans site connu, `url: null` (la fiche propose une recherche).
- Sans site retrouvé : LJS (GE), PCSI (JU), Centre (VS), Verts et POP (NE), UDC (FR).
- `js/votations.js` : mots d'ordre PARTIELS (PS, Verts oui et PLR, solidaritéS non sur l'AVS ; PLR non feux d'artifice ; Centre, UDC oui couples mariés), avec sources listées ; à confirmer sur les sites des partis. Résumés oui/non indicatifs, la brochure officielle fait foi.
- Sources de données publiques identifiées : OFS / opendata.swiss (résultats CN 2023 : https://ogd-static.voteinfo-app.ch/v4/ogd/sd-t-17.02-NRW2023-parteien.json et le CSV appendix), parlament.ch OData (ws.parlament.ch/odata.svc), OpenParlData (api.openparldata.ch), Swissvotes (CSV, CC BY 4.0), calendrier des votations de la Chancellerie, JSON élections de ge.ch sur opendata.swiss.

## Prochaines étapes suggérées
1. Créer le dépôt public, pousser, activer Pages (Settings > Pages > Source: GitHub Actions).
2. Lancer `tools/boussole.py liens` et corriger les URLs.
3. Lancer `sieges --show`, brancher les sièges dans la fiche parti.
4. Déplacer les faits (fondation, sièges, positions) en JSON avec source et date par fait.
5. Compléter les mots d'ordre à partir des sites des partis ; automatiser avec Swissvotes après le scrutin.
6. Résultats par canton sur le cartogramme après la votation (données OFS) ; cantons alémaniques (textes en allemand).
