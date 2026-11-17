/* Entry point, bundled by `npm run build` into dist/js/site.js (classic script, works from file://). */
import { start as startApp } from "./app.ts";
import { start as startBallot } from "./ballot.ts";
import { start as startInstitutions } from "./institutions.ts";

startApp();
startBallot();
startInstitutions();
