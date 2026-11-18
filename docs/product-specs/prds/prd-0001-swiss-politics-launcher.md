---
type: Product Requirements Document
title: "PRD-0001: Swiss politics launcher (Boussole citoyenne)"
description: The whole civic-compass static site as one slice, from the voter's screens to the sourced data referential that feeds them.
resource: https://github.com/VictorHueni/civic-compass
tags: [civic-compass, static-site, referential, ballot, parties]
timestamp: 2026-11-16T19:30:00Z
status: draft
owner: Victor Hueni
last_reviewed: 2026-11-18
review_interval: 30d
---

# PRD-0001: Swiss politics launcher (Boussole citoyenne)

**Status:** draft

The site is named "Boussole citoyenne" in French; the repository and the code use `civic-compass`. User-facing copy quoted below stays in French, as on the site.

Sources of this PRD: `HANDOFF.md`, `README.md` and `CLAUDE.md` of the repository at commit `8f9edd8`, the site as built at that commit, and the owner's decisions of 2026-11-16 (data referential, TypeScript only, repository name). The institutions part (US-13 to US-18) adds Research-0002 (`docs/architecture/research/0002-institution-composition-sources.md`, owner rulings included) and the owner-approved mockup (https://claude.ai/artifact/RZzydkbydCD9SCxurJdBBc, private). The media part (US-20 to US-25) adds Research-0003 (`docs/architecture/research/0003-media-ownership-and-leaning-sources.md`, owner rulings included) and the owner-approved mockup of the ownership graph (https://claude.ai/artifact/VbRVXNFMna9BdXTkiFgRnk, private). No persona, capability map or FBS exists yet, so §0 is omitted and stories name the role instead of a `P-NN`.

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
- **Names of cantonal parliament members.** Cantonal parliaments show seats per party from the latest election only (US-14); listing their 60 to 150 members by name, or tracking changes since the election, is out of scope.
- **Personal data beyond the function.** People are shown with name, party, canton and function only: no photo, address, date of birth or contact, even when a source provides them. A media owner who is a person is shown with name and share only, as the source publishes them, under the conditions of US-24 (owner, 2026-11-17).
- **A measurement of media leaning of the site's own.** The site shows the fög index for the titles it covers and nothing for the others; rating articles itself, or collecting visitors' reports, needs its own method and a backend (Research-0003, ruling 1).
- **Lobbies (phase 2 of the transparency area).** Links to Lobbywatch come in later stories of this PRD, after [Research-0004](../../architecture/research/0004-lobby-and-influence-sources.md) (draft, 2026-11-18).
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
- [ ] It links the object's official page and the official brochure (PDF), plus easyvote.
- [ ] No summary text is published without the object's official page as source.

### PRD-0001.US-03 · Compare party positions on an object

**Persona:** voter
**Status:** pending
**Covers:** _TODO_

**Description:**
As a voter, I want to see which national parties recommend yes or no on an object so that I can situate my vote against the parties I know.

**Acceptance Criteria:**
- [ ] The "Comparer" tab shows the national parties as a half-circle, left to right, coloured by recommendation: yes, no, free vote ("liberté de vote", only when the party's own source says so), or unknown.
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
- [ ] The card shows the name, a one-line description, the position, the facts that have a source (founding year; for a party of the Confederation, its federal members and seats, see US-15), and a link to the party site when that link is verified; otherwise (not found or to confirm), a link that searches for the party name instead.
- [ ] A fact without a source and a check date is never shown.
- [ ] The page states that the left-right order is indicative.

### PRD-0001.US-07 · Find decision aids

**Persona:** voter
**Status:** pending
**Covers:** _TODO_

**Description:**
As a voter, I want the independent decision tools grouped by what they help with so that I pick the right one quickly.

**Acceptance Criteria:**
- [ ] `#tools` groups the tools in three steps: "Comprendre" (easyvote, Année politique suisse), "Comparer" (smartvote, smartmonitor, PolitPro, Swissvotes), "Décider" (the territory's voting page and the next ballot).
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

### PRD-0001.US-13 · See who governs and sits for the Confederation

**Persona:** voter
**Status:** pending
**Covers:** _TODO_

**Description:**
As a voter, I want one page that shows the Federal Council and the two federal chambers so that I know who governs and who represents the parties today.

**Acceptance Criteria:**
- [ ] The menu group "Voir ce que fait l'État" opens a page "Qui gouverne et qui siège" (route `#institutions/ch`); it replaces the external "Trouver un élu" link.
- [ ] Federal Council: the 7 members with party and department, the President and Vice-President of the Confederation marked, and the Federal Chancellor on a separate line.
- [ ] National Council: a half-circle proportional to the 200 seats, parties from left to right, with a legend of seats per party; current composition.
- [ ] Council of States: the 46 seats per party.
- [ ] Every figure carries "Source : Services du Parlement de l'Assemblée fédérale, Berne" and the download date; the page states the site is independent and not an official publication; it links to parlament.ch for all members.

### PRD-0001.US-14 · See who governs and sits for my canton

**Persona:** voter
**Status:** pending
**Covers:** _TODO_

**Description:**
As a voter, I want the same page for my canton so that I know my cantonal government, the balance of my cantonal parliament and who represents my canton in Bern.

**Acceptance Criteria:**
- [ ] Route `#institutions/<canton>` for each covered canton.
- [ ] Conseil d'État: each member with name, party, department and the presidency, with its source and check date.
- [ ] Grand Conseil: a half-circle proportional to the seats per party from the latest election, labelled with that election's date, and a note that the composition may have changed since; source OFS.
- [ ] "Les élus <du canton> à Berne": Council of States and National Council members of the canton, by name and grouped by party; source Parliament with its date.
- [ ] A section whose data is not yet sourced is not shown; nothing appears as "unknown".

### PRD-0001.US-15 · See a party's seats and leadership on its card

**Persona:** voter
**Status:** pending
**Covers:** _TODO_

**Description:**
As a voter, I want a party's card to tell me who leads it and how many seats it holds so that I can weigh it.

**Acceptance Criteria:**
- [ ] Presidency: the name or names (co-presidency), shown only with a source and a check date.
- [ ] A party of the Confederation: its Federal Council members by name, its National Council and Council of States seats (current composition).
- [ ] A cantonal section: its Conseil d'État members (count out of the total), its Grand Conseil seats (with the election year) and the canton's National Council and Council of States seats it holds.
- [ ] Regional parties counted with a national one show it ("dont 1 PLD Bâle-Ville").
- [ ] Each line appears only when its data is sourced; the sources are named under the card.

### PRD-0001.US-16 · Generate the federal composition from the Parliament

**Persona:** maintainer
**Status:** pending
**Covers:** _TODO_

**Description:**
As a maintainer, I want one command to fetch the current federal chambers and Federal Council from the Parliament's API so that these figures stay current without hand work.

**Acceptance Criteria:**
- [ ] `npm run parliament` reads the API key from `PARL_API_KEY` or `~/.config/civic-compass/env`; the key is never written to the repository, the generated file or the logs.
- [ ] It writes a generated file with the Parliament's data unchanged (raw) and, apart, the mapping to `parties.json` abbreviations (PLD counted with PLR, Al with the Greens), plus the download date.
- [ ] `npm run check` validates it: 200 National Council seats, 46 Council of States seats, 7 Federal Council members, every mapped abbreviation exists.
- [ ] The file is never edited by hand; a failed fetch writes nothing.

### PRD-0001.US-17 · Generate the cantonal election results

**Persona:** maintainer
**Status:** pending
**Covers:** _TODO_

**Description:**
As a maintainer, I want one command to fetch the latest cantonal parliament results from the OFS so that each covered canton shows its seats per party.

**Acceptance Criteria:**
- [ ] The command finds and downloads the OFS table of cantonal parliament results and reads it with a reader written in the tool (no new dependency).
- [ ] It writes one generated file with, per covered canton, the election year, the seats per party (raw labels and mapping to `parties.json` ids) and the source. The OFS gives the year of the election, not its date (owner, 2026-11-17).
- [ ] `npm run check` fails when a canton's seats do not add up to its parliament's size or a mapped id does not exist.
- [ ] A canton that elected recently (Fribourg, November 2026) shows that election as soon as the OFS publishes it.

### PRD-0001.US-18 · Keep hand-kept records fresh

**Persona:** maintainer
**Status:** pending
**Covers:** _TODO_

**Description:**
As a maintainer, I want the records kept by hand (cantonal governments, party presidencies) to carry a source and a date and to remind me when they are old so that the site never shows a stale name for long.

**Acceptance Criteria:**
- [ ] Each Conseil d'État member and each presidency has a source URL and a `checked_on` date; without them it is not shown.
- [ ] `npm run check` warns, never fails, for any such record checked more than 180 days ago, and lists them.
- [ ] A cantonal government changes on the site only after the official result is published and checked (Fribourg: after the second round of 29 November 2026).

### PRD-0001.US-19 · See the members of a party in a federal chamber

**Persona:** voter
**Status:** pending
**Covers:** _TODO_

**Description:**
As a voter, I want to tap a party on the Confederation page to see who sits for it so that I find my canton's members of that party.

**Acceptance Criteria:**
- [ ] On `#institutions/ch`, each legend line of the National Council and of the Council of States is a button; tapping it, or the party's sector in the half-circle or the bar, opens the list of that group's members right under the legend; tapping it again closes it, and tapping another party replaces it. One group is open at a time per chamber.
- [ ] The list shows "Prénom Nom (GE)", sorted by canton then by name; a member under a label other than the party's main one says so ("Paul Roux (BS, PLD)"), and "Autres" names each member's label ("sans parti" when the Parliament records none).
- [ ] Each list counts as many members as its legend line has seats.
- [ ] A Grand Conseil does not take this: the OFS table gives counts, not names.
- [ ] The source line of the page covers the list; each button states whether its list is open (`aria-expanded`), and the half-circle stays decorative for screen readers.

### PRD-0001.US-20 · See who publishes and who owns a media outlet

**Persona:** voter
**Status:** done
**Covers:** _TODO_

**Description:**
As a voter, I want to see, for a newspaper, radio, TV channel or news site of my region, which company publishes it and who owns that company so that I know whose interests stand behind what I read.

**Acceptance Criteria:**
- [x] A new page, under a "Transparence" menu group, lists the media of the six covered cantons that Medienmonitor Schweiz covers, plus any title whose publisher is sourced (Research-0003, ruling 2), grouped by genre (presse, radio, télévision, en ligne).
- [x] Each title has an "Éditeur" line: the publishing company as the commercial register names it, with its legal form and seat, sourced to the register and to the title's own imprint for the link between them.
- [x] Each title has a "Propriétaire" line only when a source names the owner (Medienmonitor, the company's annual report, the partners of a Sàrl in the register), with each holder's share when published; otherwise the line is absent, never guessed.
- [x] When two sources disagree (Léman Bleu: the same 24.66 % share given to ESH Médias on one Medienmonitor page and to Philippe Hersant on another), both are shown and the line says the sources disagree.
- [x] Every line names its source with a link and its check date; the page names Medienmonitor (Publicom for OFCOM) as required by its terms ("nur unter Quellenangabe").

### PRD-0001.US-21 · Explore the ownership graph

**Persona:** voter
**Status:** done
**Covers:** _TODO_

**Description:**
As a voter, I want to see the media and their owners as one picture so that I notice who holds several media and how far up the chains go.

**Acceptance Criteria:**
- [x] Two views of the same data with a switch (Research-0003, ruling 5): **Réseau**, every owner including minority holders, an arrow from owner to owned with the share; **Soleil**, three rings (kind of top owner, top owner, media), each media under the holder of the largest published share, the centre ring in colour only.
- [x] Tapping a node or a sector opens the same card as US-20 (holders, holdings, sources, dates); a search by name (media, company or person) works in both views.
- [x] The page always shows every medium of French-speaking Switzerland: the site's "Territoire" selector is hidden on this page and filters nothing (owner, 2026-11-17).
- [x] A list "Ils relient plusieurs médias" names the people and families present in the chain of at least two media.
- [x] Readable at 360 px width without sideways scroll of the page; the graph pans and zooms by touch inside its own box.
- [x] Keyboard and screen-reader users reach the same facts through the list of US-20; the drawing has a text label and does not trap focus.
- [x] The built site still works from `dist/index.html` with no network (goal 4).

### PRD-0001.US-22 · See the fög index of a media outlet

**Persona:** voter
**Status:** done
**Covers:** _TODO_

**Description:**
As a voter, I want to see how a media outlet covered federal ballots, as measured by researchers, so that I can weigh its coverage without being told it is "left" or "right".

**Acceptance Criteria:**
- [x] For the titles the fög measures (Le Matin Dimanche, lematin.ch, tdg.ch, letemps.ch, 24heures.ch, 20minutes.ch, RTS), the card shows the value under the fög's own label: tone of the coverage of federal ballots, number of ballots and period (61 ballots, 2018 to 2025), on a scale from −100 (support for centre-left proposals) to +100 (support for centre-right proposals).
- [x] The media average (−4) is shown beside the value, and the card says this is not the outlet's political position.
- [x] The words "gauche" and "droite" are never used as a badge of the outlet.
- [x] A title the fög does not measure shows "Pas de mesure du fög pour ce média", never a guess.
- [x] The value is stored as a sourced fact (value, edition, source URL, check date) and updated when the fög publishes new figures. The update is the maintainer's: `npm run check` warns when the edition was checked more than 180 days ago (US-23), which prompts a look for a newer edition.

### PRD-0001.US-23 · Keep the media data by hand, checked

**Persona:** maintainer
**Status:** done
**Covers:** _TODO_

**Description:**
As a maintainer, I want the media, their publishers and their owners in one data file checked by `npm run check` so that adding or correcting an owner is data work only (goal 5).

**Acceptance Criteria:**
- [x] One hand-kept file holds the media (name, genre, regions, publisher), the companies (name, legal form, seat, UID when known), the other holders (person, family, public body, association or foundation) and the holdings (holder, held, share or none, source URL, `checked_on`, and, when sources disagree, a dispute key shared by the disagreeing holdings with a note naming the sources); its schema lives in `src/types.ts`.
- [x] `npm run check` fails when a holding names a missing holder, when published shares in one company add up to more than 100 %, when a fact has no source, or when a media has no publisher. In that sum a disputed share counts once, as one holding: Léman Bleu's 24.66 %, given to two holders, makes 92.47 %, not 117.13 % (owner, 2026-11-18).
- [x] `npm run check` warns, never fails, when a holding or a fög value was checked more than 180 days ago (as US-18).
- [x] Medienmonitor is read by hand (HTML only, no download); the file says so, and no script scrapes it into the site.

### PRD-0001.US-24 · Respect the people named as owners

**Persona:** maintainer
**Status:** done
**Covers:** _TODO_

**Description:**
As a maintainer, I want every person named as a media owner to be shown fairly and to be able to have an error corrected or the entry removed so that the site meets the data protection act (Research-0003, ruling 3).

**Acceptance Criteria:**
- [x] A person is shown with name and share only, as the source publishes them, with the source and the check date; no photo, age, address or contact.
- [x] The media page offers a way to report an error or ask for removal ("Signaler une erreur"): the address huni.victor@gmail.com, shown as selectable text with a `mailto:` link, and what to write (the media or person concerned, the error, the source if any).
- [x] A removal is recorded in the data (a fingerprint of the person's name, date, reason "demande de la personne") so that the next update does not bring the entry back; the name itself is not kept, and `npm run check` fails when a named person matches a recorded fingerprint. The page then shows the holding without the name ("actionnaire privé") (owner, 2026-11-18).
- [x] A correction or removal request is handled within 30 days. The procedure is written in the README ("Médias : corrections et retraits"); keeping the 30 days is the maintainer's commitment, which no check can enforce.

### PRD-0001.US-25 · Check publishers against the commercial register

**Persona:** maintainer
**Status:** done
**Covers:** _TODO_

**Description:**
As a maintainer, I want one command to check every publishing company against the commercial register so that a renamed, merged or deleted company is noticed.

**Acceptance Criteria:**
- [x] The command reads the register's linked open data (Zefix on `lindas.admin.ch`, no credentials) by UID and writes the result to a generated file with the download date.
- [x] It reports a company whose name, legal form or seat differs from the hand-kept file, or that is in liquidation or deleted; it never changes the hand-kept file.
- [x] A failed fetch writes nothing; the register is named as the source ("OGD Open use. Must provide the source.").

## 5. Design Considerations

- **Institutions mockup.** Owner-approved on 2026-11-16: https://claude.ai/artifact/RZzydkbydCD9SCxurJdBBc (menu entry, Confederation page, canton page, party cards). Party colours: palette B2 (§8).
- **Media ownership mockup.** Owner-approved on 2026-11-17: https://claude.ai/artifact/VbRVXNFMna9BdXTkiFgRnk (Réseau and Soleil views, card, region filter, search). Holder colours: media red, company grey, person or family violet, public body blue, association or foundation green.
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
- **Parliament API.** The new `ws.parl.ch` (key in the `X-API-KEY` header, filters in `q`); the key lives outside the repository; terms of use met by keeping raw data unchanged, naming the source with the download date and staying non-official (Research-0002, rulings 2 and 3).
- **OFS tables in xlsx.** Read by a small reader in the tool (zip and XML with Node's built-ins); a library only if needed (ruling 5).
- **Rejected source:** OpenParlData, whose counts do not match the seats of the covered cantons (Research-0002).
- **Media sources (Research-0003).** Medienmonitor Schweiz for owners (HTML only, reuse with attribution, accuracy disclaimed); the commercial register's linked open data for publishers (`lindas.admin.ch`, terms "OGD Open use. Must provide the source."); the fög factsheet of February 2026 for the index ("Copyright fög", cited, not reproduced).
- **Graph libraries (§8).** Cytoscape.js and cytoscape-fcose bundled from npm into a separate script loaded by the media page; the sunburst in the site's own SVG. This lifts the "development dependencies only" rule for these two packages.
- **Other public sources identified** (not yet integrated): Swissvotes (CC BY 4.0), the Federal Chancellery's ballot calendar.

## 7. Success Metrics

There is no analytics on the site, so metrics come from the repository and its checks.

### 7.1 Leading Indicators

- **Verified party links:** 33 of 51 on 2026-11-16 (16 not found, 2 to confirm). Success: 45 of 51 by the 29 November 2026 ballot; stretch: 51.
- **Official sites and tools verified:** 21 of 22 (admin.ch to confirm). Success: 22.
- **Scheduled check:** green on at least 3 of 4 Mondays per month, every failure explained by a named link.
- **Sourced recommendations:** 32 of 36 recorded for the 29 November ballot on 2026-11-16 (7 at the start of the day), each from the national party's own page or communiqué and cross-checked against Swissvotes; the 4 left are solidaritéS on two items, with no national position found.

### 7.2 Lagging Indicators

- **Coverage:** cantons with data, 6 of 26 today; next target set by the multilingual PRD.
- **Time to correct a moved site:** from failed check to fixed entry, target under 7 days.

## 8. Open Questions

No question is left open on 2026-11-18.

Settled on 2026-11-18 by the owner, raised while writing the media slice design sheet (`docs/plans/active/transparency-media/`):

- **A disputed share counts once (US-23).** When sources give the same share to two holders, the disagreeing holdings carry one shared dispute key and a note naming the sources; both holders are still shown (US-20), but the more-than-100 % rule counts the share once. Without this, TV Léman Bleu SA sums to 117.13 % (50.75 + 24.66 + 24.66 + 17.06) and fails the check on the very case US-20 requires.
- **Vimentis is not linked (US-02, US-07).** Its French section (vimentis.ch/fr/) still shows the ballots of 27 September 2020, while only its German section follows the 2026 ballots; a French-speaking voter would get outdated or German explanations. easyvote and Année politique suisse explain the objects in French. The entry stays in `data/tools.json` as `to_confirm`, with the reason, to restore if the French section is kept up to date again.
- **A removal keeps no name (US-24).** The removal record holds a fingerprint of the person's name (SHA-256 of the name in lower case, without accents, spaces collapsed), the date and the reason, never the name, so the public repository does not keep it in `data/media.json`. The check compares each named person against the recorded fingerprints. Two limits stay: someone who already suspects a name can test it against the fingerprint, and the name remains in the git history of the versions before the removal.

Settled on 2026-11-16 by the owner:

- **Facts without sources** are hidden until each carries a source and a check date (US-06); the 18 current facts are kept in the data with a null source.
- **Link status is never shown to voters.** Every link a voter sees must simply work; a link that is not verified is not shown (a party card offers a search instead). The maintainer runs the check and promotes links to verified (US-06, US-07, US-08, US-10).
- **Languages.** The MVP stays French only; German, Italian and the other cantons come in a later PRD.
- **Analytics.** None for the MVP: no counter, no third-party script. Visit measurement comes later with dedicated SEO work.
- **Left-right order.** It stays indicative and every party stays on the half-circle. For the national parties and their cantonal sections it rests on the Chapel Hill Expert Survey 2024 (`lrgen`), kept in the data as an aid and not shown; the footer names the survey. Parties the survey does not cover are placed by hand. The PS label becomes "Gauche" (its score, 1.67, is next to the Greens'). See `docs/architecture/research/0001-left-right-placement-sources.md`.
- **Institutions (Research-0002, eight rulings).** Election result for cantonal parliaments, current composition for the federal chambers; the new Parliament API; terms of use with three safeguards; PLD and Al counted with PLR and the Greens; an xlsx reader in the tool; Fribourg shown with its November 2026 election; names for small bodies only; a 180-day staleness warning. Everything goes in this PRD (US-13 to US-18), no separate PRD.
- **Party colours (2026-11-17), palette B2 of the mockup.** Verts `#eda100`, PS `#e34948`, PVL `#6250d6`, Centre `#eb6834`, PEV `#1baf7a`, PLR `#2a78d6`, UDC `#008300`, Autres `#898781`. It passes the colour checks (colour-blind separation, normal vision); yellow and aqua are light on white, so the legend and labels stay mandatory. A party keeps its colour on every page; at most 8 colours per half-circle, smaller parties fold into "Autres"; canton-only parties: settled on 2026-11-17 (rule A), in each Grand Conseil the party without a colour that holds the most seats takes an 8th colour, magenta `#b8338f` (MCG in GE, POP in VD and NE, PCSI in JU, CG-PCS in FR), and the others fold into "Autres", named in the legend. The magenta passes the colour checks against each B2 colour (normal vision ΔE ≥ 15.5, colour-blind ΔE ≥ 8.5, contrast ≥ 3:1); the same colour names a different party from one canton to another, so the legend stays mandatory.
- **Election year, not date (2026-11-17).** Cantonal parliaments are labelled with the year of their latest election, as the OFS table gives it ("élection de 2023"); exact dates are not hand-kept (US-17).
- **Lines of a cantonal party's card (2026-11-17), mockup board 4.** "Conseil d'État" (the canton's own name for the body) as a count only, "2 membres sur 7", without names (the word "membres" keeps it from reading as the party's rank shown in the half-circle, "3 sur 7"); "Grand Conseil (élection 2023)" as "18 sièges sur 100"; "Conseil national (GE)" and "Conseil des États (GE)" as "3 sièges sur 12", "1 siège sur 2" (owner, 2026-11-17: the zero already reads "Aucun siège sur 12", and a bare "3 sur 12" reads as a rank like "2 sur 7"). A sourced zero is written out ("Aucun siège sur 100", "Aucun membre sur 7"); a line without data is not shown (a party the OFS does not count, Fribourg's government until it is recorded). A party of the canton only matches its federal members by the Parliament's label equal to its abbreviation, on the site side; the generated mapping stays CH parties only (US-15).
- **Each canton's own name for its parliament (2026-11-17).** The site names a cantonal parliament as the canton does: "Parlement" in the Jura (jura.ch, "Le Parlement jurassien"), "Grand Conseil" in the other covered cantons. The name is kept per canton in `territories.json`, as the government's name is kept in `cantonal-governments.json`, and used for the institutions section, the card line and its source (US-14, US-15).
- **Party presidency (2026-11-17).** Kept by hand in `parties.json` under `facts.presidency`: the names (several for a co-presidency), the party's own page, its words as evidence and the check date. On the card, a "Présidence" line right after "Position" ("A et B", "A, B et C") and "Présidence : <site>, vérifié le <date>" in the sources under the card. A party whose site names nobody has no entry and no line (US-15, US-18).
- **A figure stays with its word (2026-11-17).** On a party's card, a no-break space joins a count to its noun and "sur" to the total ("14 sièges sur 100", "27 sièges, dont 1 PLD Bâle-Ville"), so a narrow screen wraps "14 sièges / sur 100", never "14 sièges sur / 100". Names keep their own break points, as blocking them would push a long name off the screen (US-15, US-18).
- **The Parliament API key stays off CI (2026-11-17).** For now the key stays on the maintainer's machine and is not stored as a CI secret: `npm run parliament` runs by hand, and the pipeline does not refresh the federal composition (US-16).
- **Media and their owners (2026-11-17, Research-0003, five rulings).** The fög index shown under its own label with the media average, updated when the fög publishes, nothing for titles it does not measure; scope: everything Medienmonitor covers in the six cantons plus titles with a sourced publisher, each with an "Éditeur" line (commercial register) and a "Propriétaire" line only when a source names one; owners who are people named with their share, as published, with source, date, a way to report an error and the 180-day warning (LPD art. 6, 30, 31, 32); the stories go in this PRD (US-20 to US-25), lobbies follow here too; the ownership graph has two views, Réseau and Soleil.
- **Channel for "Signaler une erreur" (2026-11-17).** The owner's own address, huni.victor@gmail.com, for now: an e-mail keeps a removal request private, which a public GitHub issue would not; it can later be replaced by a dedicated address with no other change (US-24).
- **Graph libraries (2026-11-17).** The Réseau view uses Cytoscape.js with the fcose layout, installed with npm and bundled at build time (the site's first runtime dependency); the Soleil view is drawn by the site's own SVG code, as the half-circles are, so ECharts is not used; the graph code is a second script loaded only when the media page opens, so the rest of the site keeps its weight and everything works without network (US-21, goal 4). Integrated mockup: https://claude.ai/artifact/HxqpCXiRyjFpUqxXhiyTcb (private): a "Transparence" menu group with "Médias" and "Lobbies (bientôt)". On reviewing it, the owner ruled that the media page shows every medium whatever the territory, so the "Territoire" selector is hidden there (US-21).
- **Timeouts** are listed for a manual check and never fail the run, locally or in CI (US-11), because some Swiss sites do not answer servers abroad.

## 9. Open Items

The repository has no central open-items ledger yet. Actionable items surfaced while writing this PRD, to file once the ledger exists:

- execution-item: source the founding years (US-06). Federal Council members and federal seats now come from the Parliament's data (US-15).
