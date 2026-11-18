---
type: Implementation Plan
title: "Implementation Plan: Media ownership (Transparence)"
description: "Builds the Médias page of the Transparence area, PRD-0001 US-20 to US-25, in 22 increments and 6 milestones, one pull request per story: the checked data file first, then the list and card, the two graph views, the fög box, the removal mechanics and the register command."
tags: [implementation-plan, civic-compass, media, transparency]
timestamp: 2026-11-18T12:00:00Z
status: draft
owner: Victor Hueni
last_reviewed: 2026-11-18
review_interval: 30d
prd: docs/product-specs/prds/prd-0001-swiss-politics-launcher.md
---

# Implementation Plan: Media ownership (Transparence)

## Summary

This plan builds the media part of [PRD-0001](../../product-specs/prds/prd-0001-swiss-politics-launcher.md), stories US-20 to US-25, with [Research-0003](../../architecture/research/0003-media-ownership-and-leaning-sources.md) and its owner rulings. It follows the slice design sheet `docs/plans/active/transparency-media/`: its four tabs name the modules, contracts, data fields and checks used below, and every increment cites the tab it implements. Where the sheet and the PRD differ, the PRD decides and the sheet is corrected.

The stories are delivered in this order, one pull request per story (one milestone each): US-23, US-20, US-21, US-22, US-24, US-25. US-23 comes first because every other story reads its data file.

Principles:

1. One increment equals one coherent change set.
2. Every increment is test-driven: write-first tests observed red, then a green test gate.
3. **The pure modules carry the logic.** What a page shows is computed by modules with no DOM and no data import (`media-model.ts`, `sunburst.ts`, `tools/media.ts`), unit-tested with `node --test`; the code that writes HTML or drives a drawing is exempt from red-first and checked on the screens, as elsewhere in the site.
4. **Data is read by hand and sourced.** Medienmonitor is read in the browser, never scraped; every fact carries its source URL and `checked_on`; nothing is guessed (`CLAUDE.md`, US-23).
5. **The site keeps working from disk.** Both scripts stay classic scripts; `dist/index.html` must work opened from disk with the network cut after every milestone (goal 4).

**Overall Status:** in-progress
**Current Increment:** 13

## Increment Plan

### Increment 01: Media types, schemas and an empty data file

**Status:** done

Sheet: database tab (entities, field conventions), code tab (`src/types.ts`).

Scope:

1. **Write first, expect red:** new `tools/media.test.ts` (no test reads a media file yet): a minimal valid media file passes the schema of `DATA_FILES.media`; a file whose holding has an unknown key, a share given as text, a `checked_on` that is not a real date, or a genre outside the four fails, naming the field (the schema has no ranges: the 0 to 100 range of a share is a rule of increment 02). The test reuses the existing schema walker rather than writing a second one: `checkValue`, `checkObject`, `checkFile` and `Report` move unchanged from `tools/cli.ts` to a new `tools/schema.ts`, because `tools/cli.ts` runs its command as soon as it is imported.
2. In `src/types.ts`: the interfaces and schemas `Medium`, `Company`, `Holder`, `Holding` (with `dispute` as an optional string key and `note`), `Removal` (`fingerprint`, `date`, `reason`), `FogEdition`, `FogValue`, and `MediaFile`; `Holder.name` optional (absent after a removal); `DATA_FILES.media` pointing at `media.json`.
3. `DATA_FILES.media_ownership` (file `media.json`, content under `media_ownership`) and `data/media.json` with the `_readme` (Medienmonitor read by hand, HTML only, no download; the sources and their terms), the fög edition (label, 61 ballots, 2018 to 2025, scale −100 to +100, average −4, source, `checked_on`) and empty lists, so that `npm run check` keeps passing.

Primary files:

1. `src/types.ts`
2. `data/media.json`
3. `tools/schema.ts` (new, moved out of `tools/cli.ts`)
4. `tools/cli.ts`
5. `tools/media.test.ts`

Test gate:

1. `npm test`
2. `npm run check`

Exit criteria:

1. `npm run check` passes and loads `data/media.json` through `DATA_FILES`.
2. The new schema tests fail on the three broken shapes and pass on the valid one.

### Increment 02: The media rules of the check

**Status:** done

Sheet: api tab, decision table "what `npm run check` says about the media" (all rows but the fingerprint and the register rows).

Scope:

1. **Write first, expect red:** extend `tools/media.test.ts`, one case per row of the decision table, on small fixtures built by one shared builder: a holding names a missing holder or company; shares in one company sum above 100 %; Léman Bleu's case (50.75, 24.66 and 24.66 under one dispute key, 17.06) sums to 92.47 % and passes, the same shares without the key fail at 117.13 %; a dispute key on one holding only, or on holdings of two companies, or a disputed holding without a note; a medium, company, holder, holding or fög value without a source; a medium without a publisher, or whose publisher is a person, family or public body; a share below 0 or above 100; a region that is not a code of `territories.json`; an id used twice across media, companies and holders.
2. New `tools/media.ts`: `checkMedia(file): string[]` with those rules, French messages naming the entry, as `checkCantonalGovernments` does.

Primary files:

1. `tools/media.ts`
2. `tools/media.test.ts`

Test gate:

1. `npm test`

Exit criteria:

1. Every rule of the table, the fingerprint and register rows excepted, has a failing case and a passing case.
2. Léman Bleu's disputed share counts once (PRD-0001 §8, 2026-11-18).

### Increment 03: The rules and the staleness notice in `npm run check`

**Status:** done

Sheet: api tab (check contract), code tab (`tools/cli.ts`).

Scope:

1. **Write first, expect red:** extend `tools/media.test.ts`: `staleMedia(file, today)` lists every medium, company, holder, holding and the fög edition checked 181 days before `today` and not one checked 180 days before (the sheet's database tab, "Proof"), reusing `isStale` from `tools/cantonal-governments.ts`; `mediaSummary` counts the lists for the line of the check.
2. `staleMedia` in `tools/media.ts`; `cmdCheck` runs `checkMedia` with the other cross-file rules and prints the stale facts as a notice that never fails, after the existing notices; the summary line gains the media counts.

Primary files:

1. `tools/media.ts`
2. `tools/cli.ts`
3. `tools/media.test.ts`

Test gate:

1. `npm test`
2. `npm run check` exits 0 on `data/`
3. `node tools/cli.ts check --data <copy of data/ with a holding naming a missing holder>` exits 1 and names it

Exit criteria:

1. A broken media file fails `npm run check`; a stale fact only prints a notice.

### Increment 04: Media and their publishers, read by hand

**Status:** done

Sheet: database tab (row counts, the note on the 85 links), api tab ("Éditeur" line).

Scope:

1. Exempt from red-first: data entry; the rules of increments 02 and 03 are the tests.
2. The 38 media of the mockup (12 press, 15 radio, 6 television, 4 online, 1 press and online) with genre, regions (names from `territories.json`), publisher, the imprint page that names it, source and `checked_on`.
3. Their publishers: the companies with name, legal form and seat as the register names them (zefix.ch page read by hand), UID when shown; the three associations or foundations that publish (Le Temps, Le Courrier, Canal 9) as holders with legal form, seat and UID. The publishers of Le Temps and Le Courrier, written "à relever au registre du commerce" in the mockup, are sourced here.
4. The mockup's `media-data.js` (kept outside git) may seed the entries through a throwaway conversion that is not committed; every line is then re-read on its source on the day of entry, which becomes its `checked_on`.

Primary files:

1. `data/media.json`

Test gate:

1. `npm run check`
2. `npm run links` (the new source URLs are collected too)

Exit criteria:

1. 38 media, each with a sourced publisher; no "à relever" left.
2. `npm run links` reports no broken link and no link redirected elsewhere; links Medienmonitor or a newspaper blocks are listed as "à vérifier à la main".

Prediction:

1. Only `data/media.json` changes.

### Increment 05: Owners and holdings, read by hand

**Status:** done

Sheet: database tab (holders, holdings), PRD-0001 US-20 and US-24 (a person with name and share only).

Scope:

1. Exempt from red-first: data entry; the rules of increments 02 and 03 are the tests.
2. The other companies, the holders (people, families, public bodies, associations) and the 47 holdings between holders and companies, each read on its Medienmonitor page (or the company's annual report, or the partners of a Sàrl in the register), with the share when published and `null` otherwise.
3. Léman Bleu's two 24.66 % holdings under one dispute key, with a note naming both Medienmonitor pages.
4. A person is stored with name only: no photo, age, address or contact (US-24).

Primary files:

1. `data/media.json`

Test gate:

1. `npm run check`
2. `npm run links`

Exit criteria:

1. Every holding is sourced and dated; the check passes with TV Léman Bleu SA at 92.47 %.
2. The counts are reported against the mockup's (40 companies, 24 other holders, 47 holdings); each difference is explained by its source.

Prediction:

1. Only `data/media.json` changes.

### Increment 06: The fög values

**Status:** done

Sheet: database tab (FogValue), PRD-0001 US-22.

Scope:

1. Exempt from red-first: data entry; the rules of increments 02 and 03 are the tests.
2. One fög value per medium the fög measures (Le Matin Dimanche, lematin.ch, tdg.ch, letemps.ch, 24heures.ch, 20minutes.ch, and RTS, whose value covers both RTS 1 and rts.ch: 8 media), with the name it is measured as, read on the fög factsheet of February 2026 and cited, not reproduced ("Copyright fög").

Primary files:

1. `data/media.json`

Test gate:

1. `npm run check`

Exit criteria:

1. The 8 measured media carry a value; no other medium carries one.

Prediction:

1. Only `data/media.json` changes.

### Increment 07: The lines of a medium's card

**Status:** done

Sheet: api tab, decision table "the lines of a medium's card and list entry" (Éditeur, Propriétaire, disputes, Au sommet); code tab (`media-model.ts`).

Scope:

1. **Write first, expect red:** new `tools/media-model.test.ts` (the model module does not exist): on fixtures, `cardLines(id)` gives "Éditeur" with name, legal form and seat; "Propriétaire" with each holder and its share, joined by commas, only when a source names a holder; no "Propriétaire" line otherwise, never "inconnu"; both disputed holders, each with "(sources en désaccord)" and the note; `mainHolder(id)` the holder of the largest published share, a lone holder without a share counting as the whole; `chainTop(id)` followed up to the top without looping; on the real `data/media.json`, every medium yields an "Éditeur" line.
2. New `src/site/media-model.ts`: pure, no DOM, no data import; the data is passed in.

Primary files:

1. `src/site/media-model.ts`
2. `tools/media-model.test.ts`

Test gate:

1. `npm test`
2. `npm run check` (both `tsc` configurations)

Exit criteria:

1. Each row of the card decision table for US-20 and US-21 ("Au sommet") has a passing case.

### Increment 08: The media data in the bundle

**Status:** done

Sheet: code tab (`referential.ts`, `tools/build.ts`).

Scope:

1. **Write first, expect red:** new `tools/maintainer-fields.test.ts` (no test covers `MAINTAINER_ONLY` today): `_readme`, `request` and `fingerprint` are removed from a data file at any depth, other keys are kept. The list and its reviver move from `tools/build.ts` to a new `tools/maintainer-fields.ts`, because `tools/build.ts` empties `dist/` and builds as soon as it is imported.
2. `referential.ts` imports `data/media.json`; `fingerprint` joins the maintainer-only fields.

Primary files:

1. `src/site/referential.ts`
2. `tools/build.ts`
3. `tools/maintainer-fields.ts` (new, moved out of `tools/build.ts`)
4. `tools/maintainer-fields.test.ts`

Test gate:

1. `npm test`
2. `npm run build`, and `grep -c fingerprint dist/js/site.js` prints 0

Exit criteria:

1. The bundle carries the media data and no maintainer-only field.

### Increment 09: The Transparence menu and the media page shell

**Status:** done

Sheet: screens tab (ui-01), code tab (`app.ts`).

Scope:

1. Exempt from red-first: layout and navigation, checked on the screens.
2. `app.ts`: "media" in `PAGES` with its block id; the territory bar hidden on that page and the page filtering nothing (US-21, owner 2026-11-17); the menu group "Transparence" with "Médias" and a greyed "Lobbies (bientôt)".
3. `index.html`: the group and the page block; `css/site.css`: the classes of the page.

Primary files:

1. `src/site/app.ts`
2. `index.html`
3. `css/site.css`

Test gate:

1. `npm run check`
2. `npm run build`, then `dist/index.html` opened from disk: the menu shows the group, `#media` opens an empty page without the territory bar, the other pages are unchanged

Exit criteria:

1. The menu matches screen ui-01 at 390 px.

### Increment 10: The lists by genre, the card and the error report

**Status:** done

Sheet: screens tab (ui-04, ui-06 list part, ui-07), api tab (card lines, `mailto:` contract).

Scope:

1. Exempt from red-first: HTML writing; what it shows comes from `media-model.ts`, tested in increment 07.
2. New `src/site/media.ts`: the media grouped by genre (presse, radio, télévision, en ligne), each opening its card; the card of a medium and of a company or holder (who holds it, what it holds, sources and dates); the page's source line naming Medienmonitor (Publicom for OFCOM), the register and the fög.
3. "Signaler une erreur ou demander un retrait" under the card of a medium, a person or a family: the address as selectable text and as a `mailto:` link with subject "Médias : <name>", and what to write. **Brought forward from US-24** so that no owner is named on the published site without a way to report it (see Delivery Rules, rule 8).

Primary files:

1. `src/site/media.ts`
2. `src/site/main.ts`
3. `css/site.css`

Test gate:

1. `npm run check`
2. `npm run build`, then from disk: Léman Bleu's company card shows both disputed holders with their note; a title without a sourced owner has no "Propriétaire" line; the error report opens the mail program

Exit criteria:

1. The card matches screens ui-04 and ui-07, with the spec's labels ("Éditeur", no "Propriétaire non publié").

### Increment 11: The graph libraries and the second script

**Status:** done

Sheet: code tab (`tools/build.ts`, `package.json`), PRD-0001 §8 (graph libraries).

Scope:

1. Exempt from red-first: build configuration; the gate is the build and a smoke load.
2. `cytoscape` and `cytoscape-fcose` as `dependencies`, pinned exactly to the current releases (both MIT; the licences join `dist/`).
3. `tools/build.ts`: a second esbuild entry, `src/site/media-graph.ts` into `dist/js/media-graph.js`, IIFE like the first; the build prints the size of both scripts.
4. `media-graph.ts` registers its two functions on one global (`window.civicMediaGraph`), which `media.ts` calls after adding the script once; the data stays in the first script and is handed over with the tap callback (settles the first item "left to the implementation" of the code tab).

Primary files:

1. `package.json`, `package-lock.json`
2. `tools/build.ts`
3. `src/site/media-graph.ts`

Test gate:

1. `npm ci && npm run build`: two scripts, sizes printed
2. `npm run check`

Exit criteria:

1. `dist/js/site.js` does not contain Cytoscape; `dist/js/media-graph.js` does.

Done notes (2026-11-18):

1. `cytoscape` 3.35.0 and `cytoscape-fcose` 2.2.0 pinned; their MIT licences and those of `cose-base` and `layout-base` copied to `dist/licenses/`.
2. `js/media-graph.js` is minified (1400 KB unminified, 564 KB minified; the libraries make most of it); `js/site.js` stays as it was, 222 KB.
3. The global registers `network` now; Soleil's drawing joins it in increment 14, once the rings it draws exist (increment 12). Soleil's SVG code lives in this second script, as the code tab lists it ("the two drawings"), which settles that item "left to the implementation".
4. `loadGraph()` in `media.ts` adds the script once and can retry after a failed load. Smoke load from disk with every http(s) request blocked: the script registers `civicMediaGraph`, fcose lays out three nodes, no console error.

### Increment 12: Reach, bridges and rings

**Status:** done

Sheet: code tab (`media-model.ts`), screens tab (ui-03, ui-06).

Scope:

1. **Write first, expect red:** extend `tools/media-model.test.ts`: `reach(id)` lists the media a holder reaches through any chain; `bridges()` names the people and families present in the chain of at least two media, and no company; `rings()` gives three rings (kind of top owner, top owner, media), each medium under the holder of its largest published share; accent-free search matches "Leman" to "Léman".
2. The four functions in `media-model.ts`.

Primary files:

1. `src/site/media-model.ts`
2. `tools/media-model.test.ts`

Test gate:

1. `npm test`

Exit criteria:

1. On the real file, every medium appears exactly once in the outer ring.

Done notes (2026-11-18):

1. `rings()` groups persons and families in one centre ring ("people"), as the approved mockup's legend "Personne ou famille" does; the kinds come in a fixed order (people, public, association, company), empty ones left out. On the real file no public body tops a chain, so Soleil has three centre sectors: people 12 media, associations 12, companies 14.
2. `bridges()` on the real file gives the six names of screen ui-06 with the same counts: Famille fondatrice de TX Group 5, Antoine de Raemy 3, then four people with 2.
3. `search()` reuses the site's `normalize`, moved from `dom.ts` to a DOM-free `text.ts` so that the tools' compile (no DOM library) accepts the model, and returns one id: an exact name first, else the first partial match (media, companies, holders, file order).

### Increment 13: The geometry of Soleil

**Status:** pending

Sheet: code tab (`sunburst.ts`).

Scope:

1. **Write first, expect red:** new `tools/sunburst.test.ts` (no geometry module exists): the arcs of a ring cover 360° without gap or overlap; a child's arc lies inside its parent's; a sector below the label threshold gets no label; a label's angle keeps the text upright.
2. New `src/site/sunburst.ts`: `arcs(rings, size)`, `labelled(arc)`.

Primary files:

1. `src/site/sunburst.ts`
2. `tools/sunburst.test.ts`

Test gate:

1. `npm test`

Exit criteria:

1. The geometry cases pass; the module has no DOM.

### Increment 14: Réseau, Soleil, the switch and the search

**Status:** pending

Sheet: screens tab (ui-02, ui-03, ui-06), PRD-0001 US-21.

Scope:

1. Exempt from red-first: drawing and DOM; what is drawn comes from increments 12 and 13.
2. Réseau: every holder, minority holders included, an arrow from owner to owned with the share, a dashed arrow for a disputed holding, one shape and colour per kind named in a legend; pan and zoom by touch inside its box only.
3. Soleil in SVG from the rings, the centre ring in colour only; a tap on a node or a sector opens the card of increment 10.
4. The switch Réseau / Soleil, the search by name in both views, the list "Ils relient plusieurs médias".
5. The drawing has a text label and does not trap focus; keyboard users reach the same facts through the lists.

Primary files:

1. `src/site/media-graph.ts`
2. `src/site/media.ts`
3. `css/site.css`

Test gate:

1. `npm run check`
2. `npm run build`, then from disk at 360 px: both views draw, a tap opens the card, the page never scrolls sideways

Exit criteria:

1. Screens ui-02, ui-03 and ui-06 match the built site.

### Increment 15: Offline run and screens of the real site

**Status:** pending

Sheet: README of the sheet ("Once US-20 and US-21 are built, capture the real site instead"), code tab (offline run).

Scope:

1. Exempt from red-first: verification and documentation.
2. `dist/index.html` opened from disk with the network cut: both views draw, the card opens, the rest of the site is unchanged.
3. `capture-screens.ts` pointed at `dist/` (the site's routes replace the mockup's `?view=` and `?show=` hooks); the seven screens re-captured; the sheet re-rendered (`PASS: no findings`) and republished at its address; the sheet's README no longer says the screens are the mockup's.

Primary files:

1. `docs/plans/active/transparency-media/capture-screens.ts`
2. `docs/plans/active/transparency-media/views/`, `views/dark/`
3. `docs/plans/active/transparency-media/README.md`

Test gate:

1. `node docs/plans/active/transparency-media/capture-screens.ts dist`
2. The sheet's verdict file opens with `PASS: no findings`

Exit criteria:

1. The sheet shows the built site, not the mockup.

Prediction:

1. The 7 `views/ui-*.svg` and their dark copies change; no other figure changes.

### Increment 16: The fög box

**Status:** pending

Sheet: api tab (fög rows of the card table), screens tab (ui-05), PRD-0001 US-22.

Scope:

1. **Write first, expect red:** extend `tools/media-model.test.ts`: `fogBox(id)` gives the value under the fög's label "Tonalité des votations", the scale, ballots and period, the media average (−4), "Ce n'est pas une position politique du média", source and date; a title without a value gives "Pas de mesure du fög pour ce média"; no output of `fogBox` or `cardLines` contains "gauche" or "droite".
2. `fogBox` in `media-model.ts`; `media.ts` renders it on the card.

Primary files:

1. `src/site/media-model.ts`
2. `src/site/media.ts`
3. `tools/media-model.test.ts`

Test gate:

1. `npm test`
2. `npm run build`, then from disk: the card of 24 heures matches screen ui-05

Exit criteria:

1. Every US-22 criterion holds on the seven measured titles and on one unmeasured title.

### Increment 17: The name fingerprint and its check rule

**Status:** pending

Sheet: api tab (row "A named person matches the fingerprint of a removal"), database tab (Removal), PRD-0001 US-24 and §8 (2026-11-18).

Scope:

1. **Write first, expect red:** extend `tools/media.test.ts`: `fingerprint("Éric  Dupont")` equals `fingerprint("eric dupont")` (lower case, accents removed, spaces collapsed) and is a 64-character SHA-256 hex; a named person matching a removal's fingerprint fails the check; a holder with no name and no removal fails; a holder with a removal and a name fails.
2. `fingerprint` and the removal rules in `tools/media.ts`, with `node:crypto`.
3. A maintainer command `node tools/cli.ts media-fingerprint "<name>"` that prints the fingerprint, so that a removal is recorded with the same normalisation the check uses; the sheet's api tab gains it as a contract.

Primary files:

1. `tools/media.ts`
2. `tools/cli.ts`
3. `tools/media.test.ts`
4. `docs/plans/active/transparency-media/api.html`

Test gate:

1. `npm test`
2. `npm run check`

Exit criteria:

1. A removed person cannot come back under a name without failing the check.

### Increment 18: "actionnaire privé" on the page

**Status:** pending

Sheet: api tab (row "A holder is a person who asked for removal").

Scope:

1. **Write first, expect red:** extend `tools/media-model.test.ts`: a holding whose holder carries a removal shows "actionnaire privé" with the share and no name; that holder has no card, no node label and no entry in "Ils relient plusieurs médias".
2. `cardLines`, `bridges` and `rings` follow; `media.ts` and `media-graph.ts` draw the holder without a card.

Primary files:

1. `src/site/media-model.ts`
2. `src/site/media.ts`, `src/site/media-graph.ts`
3. `tools/media-model.test.ts`

Test gate:

1. `npm test`
2. `npm run build`

Exit criteria:

1. A removal fixture shows no name anywhere on the page.

### Increment 19: The removal procedure for the maintainer

**Status:** pending

Sheet: PRD-0001 US-24 (handled within 30 days).

Scope:

1. Exempt from red-first: documentation.
2. `README.md` (maintainer section) and `CLAUDE.md`: how a correction or a removal request is handled within 30 days: answer the sender, correct or remove the entry, record the fingerprint with `media-fingerprint`, run `npm run check`; the two limits of the fingerprint (PRD-0001 §8).

Primary files:

1. `README.md`
2. `CLAUDE.md`

Test gate:

1. `npm run check`
2. `npm run links`

Exit criteria:

1. A maintainer can handle a request from the README alone.

### Increment 20: Reading the register

**Status:** pending

Sheet: api tab (register command, Zefix contract), code tab (`tools/media-register.ts`), PRD-0001 US-25.

Scope:

1. **Write first, expect red:** new `tools/media-register.test.ts` (no register code exists), on an answer recorded once from `lindas.admin.ch` and kept as a fixture: `query(uids)` builds the SPARQL request; the answer is read into name, legal form, seat and status by UID; `compare(file, answer)` reports a different name, legal form or seat, a company in liquidation or deleted, and nothing for a matching company.
2. New `tools/media-register.ts`.

Primary files:

1. `tools/media-register.ts`
2. `tools/media-register.test.ts`
3. `tools/fixtures/` (the recorded answer)

Test gate:

1. `npm test`

Exit criteria:

1. The comparison cases pass on the recorded answer.

### Increment 21: The `media-register` command and its generated file

**Status:** pending

Sheet: api tab (contracts `npm run media-register`, `data/media-register.json`), seq-02.

Scope:

1. **Write first, expect red:** extend `tools/media-register.test.ts`: a failed fetch writes nothing and returns exit code 2; a successful run writes the request, the terms ("OGD Open use. Must provide the source."), the attribution, `retrieved_on` and the companies as returned; the hand-kept file is never written.
2. `cmdMediaRegister` in `tools/cli.ts`, the `media-register` script in `package.json`, `DATA_FILES.media_register` with its schema; `CLAUDE.md`: never edit `data/media-register.json` by hand.
3. One run by hand against `lindas.admin.ch`; its report reviewed.

Primary files:

1. `tools/cli.ts`
2. `tools/media-register.ts`, `tools/media-register.test.ts`
3. `src/types.ts`
4. `package.json`
5. `data/media-register.json`
6. `CLAUDE.md`

Test gate:

1. `npm test`
2. `npm run media-register`, then `npm run check`
3. `npm run links` (the generated file's request URL is collected too)

Exit criteria:

1. Every publisher with a UID is compared; the differences are listed, none is written to `data/media.json`.

Prediction:

1. `data/media-register.json` is created; `data/media.json` is unchanged.

### Increment 22: Close the slice

**Status:** pending

Sheet: all tabs.

Scope:

1. Exempt from red-first: documentation.
2. Each US-20 to US-25 criterion read against the built site and ticked in PRD-0001, the stories' status set to done; the sheet's "left to the implementation" items answered where the build settled them; the sheet re-rendered and republished.

Primary files:

1. `docs/product-specs/prds/prd-0001-swiss-politics-launcher.md`
2. `docs/plans/active/transparency-media/`

Test gate:

1. `npm test && npm run check && npm run build`
2. The sheet's verdict opens with `PASS: no findings`

Exit criteria:

1. Every criterion of US-20 to US-25 is ticked or has a written reason.

## Delivery Rules

1. One increment per commit.
2. **Commit scope:** `media`, the capability this slice delivers (the repository has no capability map; the sheet and the PRD rulings already use it). The increment goes in a `Refs: Plan-0001-media increment NN` trailer, never in the scope.
3. Each increment must be independently runnable and reversible.
4. Tests named in Scope are written or extended first and observed failing before the implementation lands; the commit message records the red run (failing test names) and the green run. A write-first test that already passes is wrong or redundant: fix it, or log why. An increment whose tests were written after its code is not done. Exempt increments say `Exempt from red-first: <reason>` in Scope.
5. One pull request per milestone, merged on a green CI (`npm test`, `npm run check`, `npm run links`); the branch says what the story does (`feat/media-data-file`, not `feat/us-23`).
6. Code, file names, keys and enum values in English; everything shown on the site, the check's messages and the data values in French; no long dash in any text (`CLAUDE.md`).
7. No fact without a source and a check date; no script reads Medienmonitor; the mockup's data is never committed as it stands.
8. **The error report ships with the first page that names an owner.** Pushing to `main` publishes the site (`pages.yml`), so increment 10 brings US-24's "Signaler une erreur" forward into the US-20 milestone; the removal mechanics stay in US-24.

## Milestone Chunks (Standalone Delivery Groups)

| Milestone | Increments | Status | Coherent Outcome | Standalone Test Gate | Exit Criteria | Commit Guidance |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| M1: Checked data file (US-23) | 01-06 | done | `data/media.json` holds the 38 media, their publishers, owners and fög values, every fact sourced; `npm run check` enforces the rules | `npm test && npm run check && npm run links` | Check green on the real file; Léman Bleu at 92.47 %; no page yet | `feat(media): …` and `data(media): …`, PR "feat(media): hand-kept media file checked by npm run check" |
| M2: List and card (US-20) | 07-10 | done | The Transparence menu and the Médias page with the lists by genre, the card and the error report | `npm test && npm run check && npm run build`, from disk | Screens ui-01, ui-04, ui-07 match | PR "feat(media): show who publishes and owns each medium" |
| M3: Réseau and Soleil (US-21) | 11-15 | pending | Both graph views from a second script, search, bridges list; screens of the real site in the sheet | Same, plus the offline run | Works from disk with no network; sheet republished | PR "feat(media): explore the ownership graph" |
| M4: fög box (US-22) | 16 | pending | The fög value under its own label, or "Pas de mesure du fög" | `npm test && npm run build` | No "gauche" or "droite" badge | PR "feat(media): show the fög index of a medium" |
| M5: Removal (US-24) | 17-19 | pending | Removal by fingerprint, enforced by the check; "actionnaire privé" on the page; the 30-day procedure written | `npm test && npm run check` | A removed name cannot come back | PR "feat(media): remove a named owner on request" |
| M6: Register check (US-25) | 20-22 | pending | `npm run media-register` compares the publishers with the commercial register; the slice is closed in the PRD | `npm test && npm run media-register && npm run check` | Differences reported, hand-kept file untouched; criteria ticked | PR "feat(media): check publishers against the commercial register" |
