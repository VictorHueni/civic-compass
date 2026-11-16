# Boussole citoyenne

Lire HANDOFF.md en premier : décisions, structure, limites des données et prochaines étapes.

- Site statique en TypeScript, construit par esbuild : `npm ci` une fois, puis `npm run build` et ouvrir `dist/index.html` (double clic, fonctionne en file://).
- Répondre en français. Ne pas utiliser le tiret long dans les textes.
- Code en anglais (noms de fichiers, identifiants, types, clés et valeurs d'énumération JSON) ; textes affichés sur le site et messages de l'outil en français.
- Ne jamais inventer d URL ni de mot d ordre : source obligatoire, sinon `null` ou "à confirmer".
- Les données sont dans `data/*.json` (voir README), décrites par `src/types.ts`. Après tout changement : `npm run check` puis `npm run links`. Ne jamais mettre d'URL en dur dans `src/site` : la chercher dans le référentiel par son id (`src/site/links.ts`).
- Node 26 exécute les `.ts` sans compilation : n'utiliser que de la syntaxe TypeScript effaçable (pas d'enum, de namespace ni de propriétés de paramètre).
