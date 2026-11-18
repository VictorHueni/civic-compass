---
type: Implementation Plan
title: "Implementation Plan: Campaign financing (Suivre l'argent)"
description: "Builds the first slice of phase 2 of the Transparence area, PRD-0001 US-26 to US-28: the campaign budgets and donations of each ballot item, generated from the Federal Audit Office by npm run campaign-financing, shown in a step « Suivre l'argent », donors who are persons named with an error report and removal by fingerprint. 11 increments, 3 milestones."
tags: [implementation-plan, civic-compass, lobbies, campaign-financing, transparency]
timestamp: 2026-11-19T10:00:00Z
status: draft
owner: Victor Hueni
last_reviewed: 2026-11-19
review_interval: 30d
prd: docs/product-specs/prds/prd-0001-swiss-politics-launcher.md
---

# Implementation Plan: Campaign financing (Suivre l'argent)

## Summary

This plan builds the first slice of phase 2 of [PRD-0001](../../product-specs/prds/prd-0001-swiss-politics-launcher.md), stories US-26 to US-28, with [Research-0004](../../architecture/research/0004-lobby-and-influence-sources.md) (§Q3, owner rulings 1 to 5) and the owner-approved [mockup](https://claude.ai/artifact/7KRYhRJiiwAGCxzKewia1g) (artboard 1). There is no slice design sheet for this slice: the mockup and this plan stand in for it, and the modules follow the media slice (`docs/plans/active/transparency-media/`, code tab).

The stories are delivered in this order, one pull request per milestone: US-28 (the generated data), US-26 (the step on the ballot page, with US-27's error report), US-27 (removal by fingerprint and the procedure). The data comes first because the page reads it. Pushing to `main` publishes the site, so the first page that names a donor ships with the error report (rule 8), as in the media slice.

Facts read on 2026-11-18 and 2026-11-19 that shape the increments:

- The CDF's documented download is one XLSX per ballot item, `https://politikfinanzierung.efk.admin.ch/api/frontend/latest/fr/downloads/financings/<id>?with_budget=true`; the four items of 29.11.2026 are ids 33 (AVS / TVA), 34 (feux d'artifice), 35 (imposition des couples), 36 (matériel de guerre). The ids come from the portal's tree (`/api/frontend/v1/fr/campaign_financings`, undocumented JSON, no key).
- Sheet 1 « Recettes totales »: A « Base de données » (an Excel serial date, 46336.56 = 10.11.2026), B « Période de déclaration » (the item's title), C « Date » (the ballot, serial), D « ID acteur », E « Acteur/trice », F « Type d'acteur », G « ID campagne », H « Campagne » (« Adoption de l'objet de la votation populaire » or « Rejet de l'objet… »), I « ID déclaration », J « Déclaration » (« Déclaration des recettes budgétées »), K « Montant total des recettes (en CHF) » and the parts L to P.
- Sheet 2 « Libéralités »: A to J as above (J « Déclaration de libéralités supérieures à 15 000 francs »), K « ID libéralité », L « Nom », M « Prénom », N « Commune de résidence », O « Suisse de l'étranger », P « Société », Q « Commune du siège social », R « Nature de la libéralité », S « Type de prestation », T « Description », U « Valeur (en CHF) », V « Date d'octroi » (serial).
- The workbook keeps every text inline (`t="inlineStr"`) and has **no `xl/sharedStrings.xml`**: the tool's reader (`tools/xlsx.ts`, US-17) refuses it today with « partie xl/sharedStrings.xml absente ».
- Actor names are published as the CDF holds them, some in German (« Sozialdemokratische Partei der Schweiz »); the mockup's « Parti socialiste suisse » was a translation. The page shows the CDF's names unchanged.
- 29 donations above CHF 15,000 across the four items, 2 of them by persons (one in item 33, one in item 35).

Principles:

1. One increment equals one coherent change set.
2. Every increment is test-driven: write-first tests observed red, then a green test gate.
3. **The pure modules carry the logic.** Reading the workbook (`tools/financing.ts`), the command (`tools/campaign-financing.ts`, with its network and disk passed in, as `tools/media-register.ts`) and what the step shows (`src/site/financing-model.ts`) are unit-tested with `node --test`; the code that writes HTML is exempt from red-first and checked on the built site, as elsewhere.
4. **Generated, never typed.** Every figure comes from the CDF through the command; `data/campaign-financing.json` is never edited by hand (`CLAUDE.md`), and a removal lives in a small hand-kept file the command applies.
5. **Keep only what is shown.** The generated file, public in the repository, keeps a person's first name and name, never the commune, the « Suisse de l'étranger » flag or anything else the CDF publishes about them (US-27, PRD-0001 §3).
6. **The site keeps working from disk.** The data is bundled at build time; `dist/index.html` works opened from disk with the network cut after every milestone (goal 4).

**Overall Status:** pending
**Current Increment:** --

## Increment Plan

### Increment 01: The XLSX reader accepts a workbook without shared strings

**Status:** pending

Scope:

1. **Write first, expect red:** extend `tools/xlsx.test.ts`: a new case « readWorkbook reads a workbook whose texts are all inline, with no shared strings part » builds, with the file's own `zip()` helper, a workbook whose rels list no `sharedStrings` and whose cells are `t="inlineStr"`, and reads its texts; adapt « readWorkbook fails clearly when a part is missing » so that a cell of type `s` without a shared strings part still fails, naming the cell.
2. `tools/xlsx.ts`: the shared strings part is optional; when absent, `shared` is empty and a `t="s"` cell fails as today with « texte partagé … absent ».

Primary files:

1. `tools/xlsx.ts`
2. `tools/xlsx.test.ts`

Test gate:

1. `npm test`
2. `npm run cantonal-parliaments` still reads the OFS table unchanged (`git diff --exit-code data/cantonal-parliaments.json` apart from `retrieved_on`)

Exit criteria:

1. The CDF export of item 33 reads into two sheets, « Recettes totales » and « Libéralités », with their rows.
2. Existing tests stay green.

### Increment 02: Types, schemas and the CDF id of each ballot item

**Status:** pending

Scope:

1. **Write first, expect red:** new `tools/financing.test.ts` (no test covers financing yet): a minimal valid `campaign-financing.json` passes `DATA_FILES.campaign_financing`; a campaign whose side is not `yes` or `no`, an amount given as text, a donation with both a company and a person, a person with a `commune` key (unknown key), and a `declared_on` that is not a real date each fail, naming the field. No test checks the ballot file's schema yet, so the same new file adds the case: `data/ballot.json` with `financing_id` as an integer or `null` passes `DATA_FILES.ballot`, as text it fails.
2. `src/types.ts`: `CampaignFinancing` (`source_page`, `disclaimer`, `retrieved_on`, `items`), `FinancedItem` (`ballot_item`, `financing_id`, `request`, `declared_on`, `campaigns`, `donations`), `Campaign` (`actor`, `actor_type`, `side: "yes" | "no"`, `total`, `from_donations`, `own_funds`), `Donation` (`to_actor`, `side`, `donor: { company } | { first_name, name } | { removed: true }`, `value`, `kind: "money" | "in_kind"`, `given_on`), `DonorRemoval` (`fingerprint`, `date`, `reason`) and their schemas; `BallotItem.financing_id: number | null`; `DATA_FILES.campaign_financing` (generated) and `DATA_FILES.donor_removals` (hand-kept); both in `Referential`.
3. `data/ballot.json`: `financing_id` 33, 34, 35, 36 on the four items, with the portal named in `_readme`; `data/donor-removals.json` with its `_readme` and an empty list; `data/campaign-financing.json` with its `_readme` and no items, so that `npm run check` passes.

Primary files:

1. `src/types.ts`
2. `data/ballot.json`, `data/donor-removals.json`, `data/campaign-financing.json`
3. `tools/financing.test.ts`

Test gate:

1. `npm test`
2. `npm run check`

Exit criteria:

1. The schemas reject a person's commune: it has no field to go in.
2. Every ballot item names its CDF id.

### Increment 03: Reading one CDF workbook

**Status:** pending

Scope:

1. **Write first, expect red:** extend `tools/financing.test.ts`, on two exports recorded on 2026-11-18 as fixtures (`tools/fixtures/cdf-financing-33.xlsx`, `tools/fixtures/cdf-financing-35.xlsx`, about 10 KB each): `readFinancing(sheets)` returns for item 33 six campaigns (USS and PS `yes`; PLR, UDC, Centre Patronal, SSP `no`), the PLR's total 889 590, and thirteen donations, the largest 250 000 from « Aktionskomitee für Freiheit und Verantwortung » to the PLR; the person of item 35 comes out as `{ first_name, name }` with no commune; `declared_on` is 2026-11-10 (from the serial 46336.56); a sheet with a renamed column, a missing sheet, or a « Campagne » other than adoption or rejection throws « réponse inattendue du CDF », naming it; a declaration other than the budget (final accounts, after the vote) is counted and left out.
2. `tools/financing.ts`: `readFinancing`, `excelDate` (serial to `YYYY-MM-DD`, UTC), the expected headers checked by name, not by position only.

Primary files:

1. `tools/financing.ts` (new)
2. `tools/financing.test.ts`
3. `tools/fixtures/cdf-financing-33.xlsx`, `tools/fixtures/cdf-financing-35.xlsx` (new)

Test gate:

1. `npm test`

Exit criteria:

1. The sums of item 33 match the mockup: 581 000 for, 1 128 811.27 against, 735 000 in donations.
2. No field of the fixtures' persons beyond first name and name reaches the result.

### Increment 04: The `campaign-financing` command and its generated file

**Status:** pending

Scope:

1. **Write first, expect red:** new `tools/campaign-financing.test.ts`, on the pattern of `tools/media-register.test.ts` (fake `fetch`, recording writer): a run with both fixtures answering writes only `data/campaign-financing.json`, valid against its schema, with the request of each item, `retrieved_on` and the disclaimer; a network error, an HTTP 5xx or an unreadable workbook writes nothing and exits 2, saying « Rien écrit »; a ballot item without `financing_id` is reported and the run exits 1; a removal whose fingerprint matches a donor turns that donation's donor into `{ removed: true }`, keeping its value and receiver, and the printed lines never hold the name.
2. `tools/campaign-financing.ts`: `runCampaignFinancing(ballot, removals, dataDir, deps)`; `tools/cli.ts`: the command `campaign-financing`, `HELP`; `package.json`: `"campaign-financing": "node tools/cli.ts campaign-financing"`. The CDF items of the ballot's date that no ballot item names are reported from the portal's tree, as a warning that never fails the run (the tree is undocumented).
3. Run it for real and commit the generated file.

Primary files:

1. `tools/campaign-financing.ts` (new), `tools/campaign-financing.test.ts` (new)
2. `tools/cli.ts`, `package.json`
3. `data/campaign-financing.json`

Test gate:

1. `npm test`
2. `npm run campaign-financing && npm run check`

Exit criteria:

1. The generated file holds the four items of 29.11.2026, with 29 donations, 2 of them by persons.
2. `data/ballot.json` and `data/donor-removals.json` are only read.

Prediction:

1. `data/campaign-financing.json`: created with 4 items (ids 33 to 36), `declared_on` and `retrieved_on` set; no other data file changes.

### Increment 05: The financing rules of `npm run check`

**Status:** pending

Scope:

1. **Write first, expect red:** extend `tools/financing.test.ts`: `checkFinancing(financing, ballot, removals)` fails when the generated file's items are not exactly the ballot's items with a `financing_id` (a past ballot's file, so that its donors leave the site with it, US-27), when a named donor matches a removal fingerprint (the message gives the start of the fingerprint, never the name, as `checkMedia`), and when a donation's receiver has no campaign in its item; it passes on the real file.
2. `tools/financing.ts`: `checkFinancing`; `tools/cli.ts`: called by `cmdCheck`, with a summary line (« financement des campagnes au 18.11.2026 : 4 objets, 17 comités, 29 dons »).

Primary files:

1. `tools/financing.ts`, `tools/financing.test.ts`
2. `tools/cli.ts`

Test gate:

1. `npm test`
2. `npm run check`

Exit criteria:

1. Changing the ballot in `data/ballot.json` without rerunning the command fails the check.

### Increment 06: What the step shows

**Status:** pending

Scope:

1. **Write first, expect red:** new `tools/financing-model.test.ts` (the site's pure modules are tested under `tools/`, as `media-model.test.ts`): `financingView(item)` gives for item 33 the sides with their totals (581 000 and 1 128 811) and committee counts (2 and 4), the committees sorted by amount with a bar width relative to the largest (PLR 100, UDC 14), the donations grouped by receiving committee with total and count (PLR 585 000, 10 donations; Swiss Life AG's two donations to the PLR on one line, 75 000, « 2 dons »), the committees without donations named (PS, Centre Patronal, SSP), and « une personne privée » for a removed donor; an item absent from the file gives the « Aucune déclaration publiée par le CDF » state with the retrieval date; `chf(889590)` is « 889 590 CHF » with a no-break space joining the figure and the unit (§8 « A figure stays with its word »).
2. `src/site/financing-model.ts` (new, no DOM, no data import).

Primary files:

1. `src/site/financing-model.ts` (new)
2. `tools/financing-model.test.ts` (new)

Test gate:

1. `npm test`
2. `npm run check` (both tsconfigs compile it)

Exit criteria:

1. Every figure of the mockup's artboard 1 comes out of the model for item 33.

### Increment 07: The CDF portal in the referential

**Status:** pending

Scope:

1. Exempt from red-first: one data entry and one id constant. The rule that fails on an id missing from the referential already exists (`linked(...)` in `cmdCheck`, `tools/cli.ts`, which no unit test can import because the file runs its command on import); its red run is `npm run check` failing after the id is added to `src/site/links.ts` and before the entry is added to `data/state-sites.json`, recorded in the commit.
2. `data/state-sites.json`: the entry `cdf-financement-politique` (« Contrôle fédéral des finances : financement de la politique »), URL `https://politikfinanzierung.efk.admin.ch/app/fr/`, `verified` with its evidence and date after a check in the browser; `src/site/links.ts`: `STATE_SITE_IDS.financing`.

Primary files:

1. `data/state-sites.json`
2. `src/site/links.ts`

Test gate:

1. `npm test && npm run check && npm run links`

Exit criteria:

1. The site can link to the CDF by id, with no URL in `src/site` (`CLAUDE.md`).

### Increment 08: The step « Suivre l'argent » and its error report

**Status:** pending

Scope:

1. Exempt from red-first: markup and styling; the figures come from increment 06's tested model.
2. `src/site/ballot.ts`: `STEPS` becomes Comprendre, Comparer, Suivre l'argent, Décider; the existing steps keep their content (step indexes adapted); the new step renders `financingView`: the two side totals, the committees per side with bars, the donations by receiving committee (« Reçu par », « de … »), the line of committees without donations, the source line (CDF, declaration and retrieval dates, disclaimer, link through `STATE_SITE_IDS.financing`), and « Signaler une erreur ou demander un retrait » with the address and procedure of US-24 (the media page's markup moved to a shared helper in `src/site/dom.ts` or a new `src/site/report.ts`, used by both pages).
3. `css/site.css`: the side boxes, bars and donation blocks, from the site's tokens (`--cc-yes`, `--cc-no`, `--cc-surface`), no new colour.
4. `src/site/referential.ts`: the generated file bundled like the others.

Primary files:

1. `src/site/ballot.ts`, `src/site/referential.ts`
2. `src/site/report.ts` (new) or `src/site/dom.ts`, `src/site/media.ts`
3. `css/site.css`

Test gate:

1. `npm test && npm run check && npm run build`
2. `dist/index.html` opened from disk with the network cut, at 360 px: the four steps of each item work, the step of item 33 matches the mockup's artboard 1 (names as the CDF publishes them), no sideways scroll; the media page's error report still works.

Exit criteria:

1. A donor who is a person is never shown without the error report on the same step.

### Increment 09: Removal on request, end to end

**Status:** pending

Scope:

1. **Write first, expect red:** extend `tools/campaign-financing.test.ts` and `tools/financing.test.ts`: a removal recorded in `data/donor-removals.json` for the fixture's person of item 35 (fingerprint of « Prénom Nom », as `media-fingerprint` computes it) is applied by the command and the check passes; the same person written back by hand in the generated file fails the check without printing the name.
2. Reuse `fingerprint` of `tools/media.ts` and the `media-fingerprint` command (stdin); no second hashing.

Primary files:

1. `tools/campaign-financing.test.ts`, `tools/financing.test.ts`
2. `tools/campaign-financing.ts`, `tools/financing.ts` (only if a test shows a gap)

Test gate:

1. `npm test`

Exit criteria:

1. A removed donor cannot come back, by a rerun or by hand.

### Increment 10: The procedure for the maintainer

**Status:** pending

Scope:

1. Exempt from red-first: documentation only.
2. `README.md`: `data/campaign-financing.json` and `data/donor-removals.json` in the data list; `npm run campaign-financing` in the tool commands (when to run it: once the CDF has published, about 30 days before the vote, and again before publishing; exit codes 0, 1, 2); a section « Financement des campagnes : corrections et retraits » that reuses the media procedure (30 days, fingerprint on stdin, nothing in commits, PRs or issues) for a donor; `CLAUDE.md`: never edit `data/campaign-financing.json` by hand, a removed donor never comes back.

Primary files:

1. `README.md`, `CLAUDE.md`

Test gate:

1. `npm run check && npm run links`

Exit criteria:

1. The procedure names every command and file a removal touches.

### Increment 11: Close the slice

**Status:** pending

Scope:

1. Exempt from red-first: documentation only.
2. PRD-0001: US-26, US-27, US-28 ticked and marked done, any criterion not met written with its reason; this plan marked done; Research-0004 left Active.

Primary files:

1. `docs/product-specs/prds/prd-0001-swiss-politics-launcher.md`
2. `docs/plans/active/0001_exec_campaign-financing.md`

Test gate:

1. `npm test && npm run check && npm run build && npm run links`

Exit criteria:

1. Every criterion of US-26 to US-28 is ticked or carries its reason.

## Delivery Rules

1. One increment per commit.
2. **Commit scope:** `financing`, the capability this slice delivers (the repository has no capability map; the media slice used `media` the same way). The increment goes in a `Refs: Plan-0001-financing increment NN` trailer, never in the scope.
3. Each increment must be independently runnable and reversible.
4. Tests named in Scope are written or extended first and observed failing before the implementation lands; the commit message records the red run (failing test names) and the green run. A write-first test that already passes is wrong or redundant: fix it, or log why. An increment whose tests were written after its code is not done. Exempt increments say `Exempt from red-first: <reason>` in Scope.
5. Every commit is gated with `npm run check && npm test` first; a failing check is never committed.
6. One pull request per milestone, merged on a green CI (`npm test`, `npm run check`, `npm run links`); the branch says what the story does (`feat/campaign-financing-data`, not `feat/us-28`).
7. Code, file names, keys and enum values in English; everything shown on the site, the tool's messages and the data values in French; no long dash in any text (`CLAUDE.md`).
8. **The error report ships with the first page that names a donor.** Pushing to `main` publishes the site (`pages.yml`), so increment 08 brings US-27's error report into the US-26 milestone; the removal mechanics stay in US-27.
9. No figure typed by hand: every amount comes from the CDF through the command; a name removed on request never appears in a commit message, a PR or an issue.

## Milestone Chunks (Standalone Delivery Groups)

| Milestone | Increments | Status | Coherent Outcome | Standalone Test Gate | Exit Criteria | Commit Guidance |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| M1: Generated data (US-28) | 01-05 | pending | `npm run campaign-financing` writes the budgets and donations of the four items of 29.11.2026 from the CDF; `npm run check` enforces their rules; no page yet | `npm test && npm run campaign-financing && npm run check && npm run links` | 4 items, 29 donations; a failed fetch writes nothing; a stale file fails the check | `feat(financing): …`, PR "feat(financing): generate campaign financing from the Federal Audit Office" |
| M2: The step (US-26) | 06-08 | pending | « Suivre l'argent » on each ballot item, with the error report | `npm test && npm run check && npm run build`, from disk at 360 px | Item 33 matches the mockup; works offline | PR "feat(financing): follow the money behind each ballot item" |
| M3: Donors' rights (US-27) | 09-11 | pending | Removal by fingerprint applied and enforced; the procedure written; the slice closed in the PRD | `npm test && npm run check` | A removed donor cannot come back; criteria ticked | PR "feat(financing): remove a named donor on request" |
