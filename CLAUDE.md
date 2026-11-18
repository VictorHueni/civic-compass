# Boussole citoyenne

Lire HANDOFF.md en premier : décisions, structure, limites des données et prochaines étapes.

- Site statique en TypeScript, construit par esbuild : `npm ci` une fois, puis `npm run build` et ouvrir `dist/index.html` (double clic, fonctionne en file://).
- Répondre en français. Ne pas utiliser le tiret long dans les textes.
- Code en anglais (noms de fichiers, identifiants, types, clés et valeurs d'énumération JSON) ; textes affichés sur le site et messages de l'outil en français.
- Ne jamais inventer d URL ni de mot d ordre : source obligatoire, sinon `null` ou "à confirmer".
- Le visiteur ne voit que des liens `verified`, jamais leur statut ; un fait n'est affiché qu'avec sa source. Ne jamais modifier `data/parliament-current.json`, `data/cantonal-parliaments.json` ni `data/media-register.json` à la main (relancer `npm run parliament`, `npm run cantonal-parliaments` ou `npm run media-register`). Ne jamais afficher ni écrire la clé de l'API du Parlement (`PARL_API_KEY`).
- Décisions et spécification : `docs/product-specs/prds/prd-0001-swiss-politics-launcher.md` (§8) ; conception : `docs/plans/active/swiss-politics-launcher/`.
- Les données sont dans `data/*.json` (voir README), décrites par `src/types.ts`. Après tout changement : `npm run check` puis `npm run links`. Ne jamais mettre d'URL en dur dans `src/site` : la chercher dans le référentiel par son id (`src/site/links.ts`).
- Médias (`data/media.json`) : une erreur ou une demande de retrait se traite dans les 30 jours selon la section « Médias : corrections et retraits » du README. Un nom retiré ne revient jamais : ni dans `data/`, ni dans un id, une note, une capture de la fiche de conception, un message de commit, une PR ou une issue.
- Node 26 exécute les `.ts` sans compilation : n'utiliser que de la syntaxe TypeScript effaçable (pas d'enum, de namespace ni de propriétés de paramètre).
