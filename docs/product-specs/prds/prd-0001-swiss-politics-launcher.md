---
type: Product Requirements Document
title: "PRD-0001: Swiss politics launcher (Boussole citoyenne)"
description: The whole civic-compass static site as one slice, from the voter's screens to the sourced data referential that feeds them.
resource: https://github.com/VictorHueni/civic-compass
tags: [civic-compass, static-site, referential, ballot, parties]
timestamp: 2026-11-16T19:30:00Z
status: draft
owner: Victor Hueni
last_reviewed: 2026-11-16
review_interval: 30d
---

# PRD-0001: Swiss politics launcher (Boussole citoyenne)

**Status:** draft

The site is named "Boussole citoyenne" in French; the repository and the code use `civic-compass`. User-facing copy quoted below stays in French, as on the site.

Sources of this PRD: `HANDOFF.md`, `README.md` and `CLAUDE.md` of the repository at commit `8f9edd8`, the site as built at that commit, and the owner's decisions of 2026-11-16 (data referential, TypeScript only, repository name). No persona, capability map or FBS exists yet, so §0 is omitted and stories name the role instead of a `P-NN`.

## 1. Problem Statement

A Swiss voter who wants to prepare a ballot has to assemble the picture from a dozen sites: the official brochure (admin.ch), the cantonal voting page, each party's site for its recommendation, and comparison tools (smartvote, smartmonitor, Swissvotes, easyvote). Nothing places the parties of their own canton from left to right with a working link to each, and party sites move without notice: on 2026-11-16, 5 of 51 recorded party addresses had moved to a new domain (four `vertliberaux.ch` sites to `pvl.swiss`, `cg-pcs-fribourg.ch` to `cg-fribourg.ch`), and one (`ensembleagauche.ch`) silently redirected to a Google search. A launcher that is wrong is worse than none, so the cost of not solving this is either no tool or a tool that sends voters to dead or wrong pages.

## 2. Goals

1. **Reach the official source fast (voter goal).** From the home page, a voter reaches the official page and the official brochure of any federal ballot object in at most 2 taps.
2. **No invented fact (trust goal).** 100 % of URLs and party recommendations shown on the site come from a recorded source; an unknown one is shown as unknown ("à confirmer" or a search), never guessed.
3. **Links stay true (maintenance goal).** A party or official link that breaks, or that redirects to another domain, is detected within 7 days by the scheduled check.
4. **Usable everywhere (access goal).** Every page works at 360 px width without sideways scroll, and the built site works when `dist/index.html` is opened from disk with no network for the site itself.
5. **Editable without code (owner goal).** Adding a party, a canton or an official site means editing one JSON file and running one command; no JavaScript or TypeScript file changes.

## 3. Non-Goals

- **German and Italian versions.** The site is French only in this slice; German-speaking and Italian-speaking cantons come with translated copy in a later PRD (see §8).
- **Cantons beyond GE, VD, VS, NE, JU, FR.** The other 20 cantons appear on the map as "bientôt"; adding them is data work under goal 5, not part of this slice.
- **Ballot results.** Results per canton on the map after the vote are deferred: the data source (OFS) is identified but not integrated.
- **Seats in cantonal parliaments.** National Council seats are shown for the parties of the Confederation since 2026-11-16 (US-06), from the OFS 2023 results with their source; seats in cantonal parliaments need other datasets and are deferred.
- **Any backend, account, tracking or personal data.** The site is static; the only stored state is the last territory chosen, in the visitor's own browser.

## 4. User Stories

Roles: **voter**, a Swiss citizen preparing a vote, usually on a phone, a few times a year around each ballot; **maintainer**, the person who keeps the data true (today the owner), on a computer.

### PRD-0001.US-01 · See the next ballot

**Persona:** voter
**Status:** pending
**Covers:** _TODO_

**Description:**
As a voter, I want to see on the home page the date of the next ballot and the list of its objects so that I know what I am voting on before opening anything else.

**Acceptance Criteria:**
- [ ] The home page (`#ballot`) shows the ballot label, its date, when the voting material arrives, and a numbered list of the federal objects with a short title and the question.
- [ ] When a canton is chosen and it has cantonal objects recorded with an official source, they are listed; otherwise only its official voting page is linked.
- [ ] Tapping an object opens its own page; previous and next buttons move between objects.
- [ ] Typecheck passes; verified in a browser at 360 px.

### PRD-0001.US-02 · Understand one object

**Persona:** voter
**Status:** pending
**Covers:** _TODO_

**Description:**
As a voter, I want a plain summary of what a yes and a no change for one object so that I understand the stakes before reading the official brochure.

**Acceptance Criteria:**
- [ ] The "Comprendre" tab shows "Si vous votez OUI" and "Si vous votez NON", the Federal Council and Parliament recommendation when recorded, and the note "Résumé indicatif. La brochure officielle fait foi."
- [ ] It links the object's official page and the official brochure (PDF), plus easyvote and Vimentis.
- [ ] No summary text is published without the object's official page as source.

### PRD-0001.US-03 · Compare party positions on an object

**Persona:** voter
**Status:** pending
**Covers:** _TODO_

**Description:**
As a voter, I want to see which national parties recommend yes or no on an object so that I can situate my vote against the parties I know.

**Acceptance Criteria:**
- [ ] The "Comparer" tab shows the national parties as a half-circle, left to right, coloured by recommendation: yes, no, or unknown.
- [ ] A recommendation appears only if a source for it is listed under the chart; every other party shows "à confirmer" with a link to its site.
- [ ] The tab links smartvote, smartmonitor and Swissvotes.

### PRD-0001.US-04 · Know how to vote

**Persona:** voter
**Status:** pending
**Covers:** _TODO_

**Description:**
As a voter, I want the practical steps to cast my vote so that I do not miss the deadline or the procedure.

**Acceptance Criteria:**
- [ ] The "Décider" tab lists the steps: material received, postal vote or vote at the commune on the day, whom to contact in case of doubt.
- [ ] It links the voting page of the chosen canton (or a generic one at federal level) and ch.ch.

### PRD-0001.US-05 · Choose my territory

**Persona:** voter
**Status:** pending
**Covers:** _TODO_

**Description:**
As a voter, I want to pick the Confederation or my canton once so that every page shows the parties and official sites that concern me.

**Acceptance Criteria:**
- [ ] A territory button opens a sheet with "Confédération" and a tile map of the 26 cantons; covered cantons are selectable, the others are marked "bientôt" and disabled; cantons with a cantonal object on the next ballot carry a marker.
- [ ] The choice applies to every page, is kept in the address (`#<page>/<territory>`, for example `#parties/ge`; the Confederation is `ch`) and is remembered for the next visit in the browser.
- [ ] The sheet closes with the close button, the backdrop or Escape, and gives focus back to the territory button.

### PRD-0001.US-06 · Browse the parties from left to right

**Persona:** voter
**Status:** pending
**Covers:** _TODO_

**Description:**
As a voter, I want to see the parties of my territory ordered from left to right and open a short card for each so that I can locate a party and reach its site.

**Acceptance Criteria:**
- [ ] `#parties` shows a half-circle with one sector per party, left to right in the order of the data file; the active party's short name and rank ("3 sur 9") show in the centre.
- [ ] Moving works by tapping a sector, the arrow buttons, the keyboard arrows and a horizontal swipe.
- [ ] The card shows the name, a one-line description, the position, the facts that have a source (founding year, Federal Council seats; for a party of the Confederation, its National Council seats from the OFS 2023 results, with "Source : Office fédéral de la statistique (OFS)" next to the figure), and a link to the party site when that link is verified; otherwise (not found or to confirm), a link that searches for the party name instead.
- [ ] A fact without a source and a check date is never shown.
- [ ] The page states that the left-right order is indicative.

### PRD-0001.US-07 · Find decision aids

**Persona:** voter
**Status:** pending
**Covers:** _TODO_

**Description:**
As a voter, I want the independent decision tools grouped by what they help with so that I pick the right one quickly.

**Acceptance Criteria:**
- [ ] `#tools` groups the tools in three steps: "Comprendre" (easyvote, Vimentis, Année politique suisse), "Comparer" (smartvote, smartmonitor, PolitPro, Swissvotes), "Décider" (the territory's voting page and the next ballot).
- [ ] Each tool shows its name, one line on what it does, and its host name; only tools whose link is verified are listed.

### PRD-0001.US-08 · Find official sites

**Persona:** voter
**Status:** pending
**Covers:** _TODO_

**Description:**
As a voter, I want the official sites of my territory in one searchable list, plus shortcuts in the menu, so that I can read a law, find an elected member or see results without searching the web.

**Acceptance Criteria:**
- [ ] `#state` lists the official sites of the chosen territory with a search box that ignores accents and case; an empty result says so. Only sites whose link is verified are listed.
- [ ] The menu group "Voir ce que fait l'État" offers "Lire une loi", "Trouver un élu", "Voir les résultats", "Consulter les chiffres" for the chosen territory, and "Tous les sites".
- [ ] Every shortcut URL comes from the data referential, none is written in the code.

### PRD-0001.US-09 · Edit the data without touching code

**Persona:** maintainer
**Status:** pending
**Covers:** _TODO_

**Description:**
As a maintainer, I want parties, official sites, tools, territories and the ballot in separate JSON files so that I add or correct an entry without reading code.

**Acceptance Criteria:**
- [ ] The data lives in `data/` in one file per referential: parties, state sites, tools, territories, ballot.
- [ ] One command checks every file and prints, in French, each error with its file and entry (missing field, duplicate id, unknown territory, invalid status or date, ballot recommendation for a party that does not exist).
- [ ] A canton becomes available on the map as soon as it has parties in the parties file.

### PRD-0001.US-10 · Record the proof of every link

**Persona:** maintainer
**Status:** pending
**Covers:** _TODO_

**Description:**
As a maintainer, I want each link to carry its status, the date it was checked, the evidence, and the addresses it used to have so that I know what is verified and never lose the history of a party's site.

**Acceptance Criteria:**
- [ ] Each party, state site and tool entry has a status (verified, to confirm, not found), a check date, an evidence line (for example the page title) and a list of previous URLs with the date seen and a note.
- [ ] A not-found entry has no URL, and an entry with no URL is not-found; the check rejects anything else.
- [ ] A URL or a recommendation is never added without a source; without one, it stays null or "à confirmer".

### PRD-0001.US-11 · Detect broken and hijacked links

**Persona:** maintainer
**Status:** pending
**Covers:** _TODO_

**Description:**
As a maintainer, I want every current link tested on each push and every Monday so that a dead or moved site is caught before voters hit it.

**Acceptance Criteria:**
- [ ] The check tests every current URL of the data files and skips previous URLs.
- [ ] A redirect to another domain fails the check and is named, so a hijacked domain is never reported as working.
- [ ] A transient failure is retried before a link is declared broken; a site that refuses robots (403, 429) or does not answer in time after every attempt is listed for a manual check and does not fail. A refused connection, a DNS error or a 404 fail.
- [ ] Every non-working link is printed with its reason, then a summary.

### PRD-0001.US-12 · Build and publish

**Persona:** maintainer
**Status:** pending
**Covers:** _TODO_

**Description:**
As a maintainer, I want one command to build the site and the deployment to run on each push to main so that what I edit is online without manual steps.

**Acceptance Criteria:**
- [ ] One command produces `dist/` with the data inside the script, so `dist/index.html` works when opened from disk.
- [ ] A push to `main` builds and deploys to GitHub Pages.
- [ ] The data check and the link check run on every pull request and their result shows on it.

## 5. Design Considerations

- **Mobile first.** The voter's device is a phone; the menu folds into a hamburger on a phone and is open on a computer.
- **Look.** The Swiss Confederation design system (MIT licence), without its coat of arms or logos; the site states it is independent and not official.
- **Editorial tone.** Airy layout, numbered lists, no coloured "AI-looking" cards; no long dash in any text.
- **Accessibility.** Keyboard access to the half-circle, the map and the sheet; ARIA labels on sectors and tiles; focus returned on close.

## 6. Technical Considerations

- **Static, no backend.** Plain HTML and CSS, the site script in TypeScript bundled into one classic script (not an ES module, which browsers block on `file://`), data embedded at build time.
- **One language.** Site and tooling in TypeScript; the tooling runs with Node 26 directly from `.ts` files. Development dependencies only: `typescript`, `esbuild`, `@types/node`.
- **Shared types.** One `src/types.ts` describes the data and is used by both the site and the check, so the schema has a single description.
- **Code in English, copy in French.** File names, identifiers, JSON keys and enum values in English; data values and everything shown on the site in French.
- **Starts from the current site.** Routes, markup and behaviour are those of commit `8f9edd8`; the migration changes the language and the data source, not the screens.
- **Public data sources identified** (not yet integrated): OFS election results on opendata.swiss, parlament.ch OData, OpenParlData, Swissvotes (CC BY 4.0), the Federal Chancellery's ballot calendar.

## 7. Success Metrics

There is no analytics on the site, so metrics come from the repository and its checks.

### 7.1 Leading Indicators

- **Verified party links:** 33 of 51 on 2026-11-16 (16 not found, 2 to confirm). Success: 45 of 51 by the 29 November 2026 ballot; stretch: 51.
- **Official sites and tools verified:** 21 of 22 (admin.ch to confirm). Success: 22.
- **Scheduled check:** green on at least 3 of 4 Mondays per month, every failure explained by a named link.
- **Sourced recommendations:** 7 recorded for the 29 November ballot, on 3 of its 4 objects; every one with a source under the chart.

### 7.2 Lagging Indicators

- **Coverage:** cantons with data, 6 of 26 today; next target set by the multilingual PRD.
- **Time to correct a moved site:** from failed check to fixed entry, target under 7 days.

## 8. Open Questions

No question is left open on 2026-11-16.

Settled on 2026-11-16 by the owner:

- **Facts without sources** are hidden until each carries a source and a check date (US-06); the 18 current facts are kept in the data with a null source.
- **Link status is never shown to voters.** Every link a voter sees must simply work; a link that is not verified is not shown (a party card offers a search instead). The maintainer runs the check and promotes links to verified (US-06, US-07, US-08, US-10).
- **Languages.** The MVP stays French only; German, Italian and the other cantons come in a later PRD.
- **Analytics.** None for the MVP: no counter, no third-party script. Visit measurement comes later with dedicated SEO work.
- **Left-right order.** It stays indicative and every party stays on the half-circle. For the national parties and their cantonal sections it rests on the Chapel Hill Expert Survey 2024 (`lrgen`), kept in the data as an aid and not shown; the footer names the survey. Parties the survey does not cover are placed by hand. The PS label becomes "Gauche" (its score, 1.67, is next to the Greens'). See `docs/architecture/research/0001-left-right-placement-sources.md`.
- **Timeouts** are listed for a manual check and never fail the run, locally or in CI (US-11), because some Swiss sites do not answer servers abroad.

## 9. Open Items

The repository has no central open-items ledger yet. Actionable items surfaced while writing this PRD, to file once the ledger exists:

- execution-item: find or confirm the 16 not-found and 2 to-confirm party URLs (§7.1).
- execution-item: source the founding years and Federal Council seats (US-06), for example from the OFS data the seats command reads.
