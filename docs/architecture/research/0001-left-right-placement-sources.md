---
type: Architecture Research Note
title: "Research-0001: Sources for placing Swiss parties from left to right"
description: Which published sources can justify the left-to-right order of the parties in data/parties.json and their position labels, with coverage, reuse terms and a storage proposal.
resource: https://github.com/VictorHueni/civic-compass
tags: [civic-compass, parties, left-right, sources, ches, selects]
timestamp: 2026-11-16T21:00:00Z
status: draft
owner: Victor Hueni
last_reviewed: 2026-11-16
review_interval: 90d
---

<!-- doc-version: 1.0 | created: 2026-11-16 | last-verified: 2026-11-16 -->

# Research-0001: Sources for placing Swiss parties from left to right

**Status:** Draft
**Date:** 2026-11-16
**Author:** Victor Hueni (desk research by Claude)
**Last verified:** 2026-11-16
**Feeds ADRs:** none yet. Feeds the open question "Left-right order" in [PRD-0001 §8](../../product-specs/prds/prd-0001-swiss-politics-launcher.md#8-open-questions); a future ADR on the source of the order would cite §Findings summary.
**Superseded by:** -

<!--
LIFECYCLE LEGEND
  Draft     : actively populating; ADRs should not cite yet
  Active    : content complete enough for ADR citation; further updates allowed
  Frozen    : feeding ADRs have landed; further edits only via Mode 3 Refresh
  Superseded: replaced by a newer research file; `Superseded by:` link mandatory
-->

The site orders the parties of each territory from left to right by their position in `data/parties.json` and shows a French label per party (`position`, for example "Centre gauche"). The footer (`index.html` line 81) says the order "suit l'usage courant dans les médias et la recherche" without naming a source, and the card shows `position` unconditionally (`src/site/app.ts` line 279), although PRD-0001 goal 2 and US-06 say no fact is shown without a source. This note looks for published sources that the order and the labels can cite.

**How confidence is rated here.** The skill's rubric is written for regulatory topics; this note maps it as follows. ★★★★: a dataset, codebook or report published by the research team that produced the measurement (the primary source for that measurement). ★★★: a producer's own web page describing its product, or a peer-reviewed article. ★★: a news report of someone else's measurement. ★: not used. Every figure computed by this research (rather than read in a source) is marked "computed here".

---

## Questions index

1. [Q1](#q1): Which published sources give a current (2023 election or later) general left-right position for the 9 national parties, and which of the 9 do they cover?
2. [Q2](#q2): Are the long-running comparative datasets (Manifesto Project, ParlGov, V-Party) usable instead, and what do they say about Switzerland?
3. [Q3](#q3): Does any published source place cantonal sections, or the canton-only parties (MCG, LJS, Ensemble à Gauche, CG-PCS, PCSI, CS-POP, POP sections)?
4. [Q4](#q4): Under which reuse terms may the site publish a source's values, and how can `data/parties.json` store them next to the existing `SourcedFact`?
5. [Q5](#q5): Can any source justify the eight French labels ("Gauche radicale" to "Droite conservatrice"), or only the order?

---

<a id="q1"></a>
## Q1: Which published sources give a current general left-right position for the 9 national parties, and which do they cover?

### Context

The Confederation view lists 9 parties: PST-POP, solidaritéS, Verts, PS, PVL, Centre, PEV, PLR, UDC. A usable source must place parties on one general left-right axis (not only economic), be recent enough to include Le Centre (founded 2021 from CVP and BDP), and be citable with a stable link. Three kinds of measurement exist: expert surveys (political scientists rate each party), voter or candidate surveys (Selects), and roll-call scores from National Council votes (smartmonitor, the NZZ rating).

### Sources consulted

| Source | URL | Type | Last verified | Confidence | Key quote / finding |
|---|---|---|---|---|---|
| CHES Europe download page | [chesdata.eu/ches-europe](https://www.chesdata.eu/ches-europe) | Academic dataset (producer page) | 2026-11-16 | ★★★ | 2024 CHES covers "all EU member states except Luxembourg, plus Iceland, Norway, Switzerland, Turkey, and the United Kingdom"; Switzerland is also listed for the 2019, 2014 and 2010 waves. |
| CHES 2024 codebook (Feb 2025, version 21) | [CHES.2024.Codebook.pdf](https://github.com/chesdata/chesdata.github.io/releases/download/ches-europe/CHES.2024.Codebook.pdf) | Academic dataset documentation | 2026-11-16 | ★★★★ | lrgen: "please tick the box that best describes each party's OVERALL IDEOLOGY on a scale ranging from 0 (extreme left) to 10 (extreme right)". Survey of 2024, fielded "between October 10 and November 20 2024" for non-EU countries; "Switzerland 10" parties. Inclusion: parties "that obtained 3% or more in the national election immediately prior to the survey or that elected at least one representative to the national or European parliament". |
| CHES 2024 party means | [CHES_2024_final_v2.csv](https://github.com/chesdata/chesdata.github.io/releases/download/ches-europe/CHES_2024_final_v2.csv) | Academic dataset | 2026-11-16 | ★★★★ | Rows for country 36 (lrgen): GPS/PES 1.33, SP/PS 1.67, GPL/PVL 4.60, DM/LC/AdC 5.47, EVP/PEV 5.64, FDP/PLR 7.67, MCG 8.08, Lega 8.73, EDU/UDF 8.75, SVP/UDC 9.00. No row for PST-POP or solidaritéS. |
| CHES 2024 expert-level file | [CHES_2024_ALL_Stacked_Expert.csv](https://github.com/chesdata/chesdata.github.io/releases/download/ches-europe/CHES_2024_ALL_Stacked_Expert.csv) | Academic dataset | 2026-11-16 | ★★★★ | Computed here from the lrgen answers for Switzerland: 15 experts each for UDC, PS, PLR, Centre, Verts, PVL; 11 for PEV; 12 for MCG. Standard deviation across experts: Verts 0.90, PS 0.90, PVL 1.18, Centre 0.52, PEV 1.75, PLR 0.62, UDC 0.65, MCG 1.38. |
| CHES 2019 party means | [CHES2019V3.csv](https://github.com/chesdata/chesdata.github.io/releases/download/ches-europe/CHES2019V3.csv) | Academic dataset | 2026-11-16 | ★★★★ | lrgen 2019: GPS/PES 1.09, SP/PS 1.36, GPL/PVL 4.91, CVP/PVC 5.27, EVP/PEV 5.82, BDP/PBD 5.82, FDP/PLR 7.00, SVP/UDC 8.73. Same order as 2024 for the parties present in both. |
| Rovny et al. 2025, CHES 2024 research note | [doi:10.1016/j.electstud.2025.102981](https://doi.org/10.1016/j.electstud.2025.102981) (read via the [Lund University copy](https://lucris.lub.lu.se/ws/files/225311019/CHES_2024_Electoral_Studies_Published.pdf)) | Peer-reviewed article | 2026-11-16 | ★★★ | "estimates about the positioning of party leadership for 279 political parties in 31 countries"; "609 political scientists" completed it. |
| Selects 2023 report (French) | [Tresch et al. 2024, doi:10.24447/SLC-2024-00002](https://doi.org/10.24447/SLC-2024-00002), [PDF](https://forscenter.ch/wp-content/uploads/2024/06/selects-studie-2023_fr.pdf) | Academic report (producer) | 2026-11-16 | ★★★★ | Tableau 14 (p. 60), 0 = gauche, 10 = droite, "Résultats pondérés". Electorate's placement of its own party: UDC 8,9, PLR 7,1, Le Centre 5,5, PVL 4,3, PS 1,7, PES 1,9. Candidates' self-placement: UDC 8,3, PLR 7,0, Le Centre 5,5, PVL 4,5, PS 1,7, PES 1,8. Only the six largest parties. |
| Selects 2023 French questionnaire (CSES deposit) | [CHE_2023_French.pdf](https://cses.org/wp-content/uploads/2025/12/CHE_2023_French.pdf) | Survey instrument | 2026-11-16 | ★★★★ | Q43 "Où placeriez-vous les partis suivants sur l'échelle ci-dessous ? 0 = Gauche 10 = Droite" lists PLR, Le Centre, PS, UDC, PES, PVL, Lega, MCG. PEV, PST-POP and solidaritéS are not in the placement list. |
| Selects 2023 Post-Election Survey on SWISSUbase | [doi:10.48573/q99z-aa77](https://doi.org/10.48573/q99z-aa77) (resolves to [SWISSUbase ref. 2634](https://www.swissubase.ch/en/catalogue/studies/20738/latest/datasets/2634/3233/overview)) | Academic dataset (catalogue) | 2026-11-16 | ★★★★ | "To download the data for this version, please contact us." Citation: "Selects. (2024). Selects 2023 Post-Election Survey (Version 1.0) [Data set]. FORS." |
| CSES Module 6 download page | [cses.org Module 6](https://cses.org/data-download/cses-module-6-2021-2026/) | Academic dataset (producer page) | 2026-11-16 | ★★★ | Second Advance Release, "December 16, 2025 version", DOI 10.7804/cses.module6.2025-12-16; Switzerland (2023) included with a Macro Report. |
| CSES Module 6 codebook part 3 | [cses6_codebook_part3_parties_and_leaders.txt](https://cses.org/wp-content/uploads/2025/12/cses6_codebook_part3_parties_and_leaders.txt) | Academic dataset documentation | 2026-11-16 | ★★★★ | Switzerland 2023 parties A to I: SVP/UDC, SP/PS, FDP/PLR, DM/LC, GPS/PES, GLP/PVL, EVP/PEP, Lega, MCG. PdA/PST, EDU, CSP/PCS have codes but no letter, so no left-right item. |
| CSES Module 6 codebook part 2 | [cses6_codebook_part2_variables.txt](https://cses.org/wp-content/uploads/2025/12/cses6_codebook_part2_variables.txt) | Academic dataset documentation | 2026-11-16 | ★★★★ | "F5029_A >>> M06a1.a EXPERT: IDEOLOGY LEFT-RIGHT - PARTY A" (collaborator expert judgment, parties A to I). Values not extracted: the [Swiss Macro Report PDF](https://cses.org/wp-content/uploads/2025/12/CHE_2023_Macro.pdf) marks them with an "x" in a grid that text extraction does not preserve. |
| Blick on smartmonitor (17.08.2023) | [blick.ch](https://www.blick.ch/politik/neue-auswertung-zeigt-martullo-blocher-ist-die-rechteste-politikerin-im-nationalrat-id18850944.html) | News report of a roll-call analysis | 2026-11-16 | ★★ | smartmonitor scored 90 National Council votes of the 2019-2023 term; share of "right" votes by group: SVP 93 %, FDP 81 %, Mitte 64 %, GLP 51 %, EVP 31 %, Grüne 5 %, SP 3 %. |
| smartmonitor home page | [smartmonitor.ch/fr](https://www.smartmonitor.ch/fr) | Producer page | 2026-11-16 | ★★★ | "Votes sélectionnés au Conseil national"; thematic rankings including "Conservateur vs. libéral"; footer "© 2026 Politools" with a CC BY-NC-SA 4.0 badge. The data and methods pages render in JavaScript and could not be read; `/fr/pages/data` returned 404. |
| Bluewin on the NZZ rating (3 Dec 2025) | [bluewin.ch](https://www.bluewin.ch/en/news/switzerland/trede-to-hess-voting-behavior-in-the-national-council-hardly-changes-2992936.html) | News report of a roll-call analysis | 2026-11-16 | ★★ | NZZ analysis with "DW Nominate", members placed from -10 (left) to 10 (right); no party-level figure in the report. The NZZ article itself was not fetched. |

### Finding

Only one source places the national parties on a current, general left-right scale with a public, citable file: **CHES 2024, variable `lrgen`** (0 = extreme left, 10 = extreme right; positions of party leaderships during 2024; 11 to 15 experts per Swiss party). It covers **7 of the 9** national parties of the site (Verts, PS, PVL, Centre, PEV, PLR, UDC) and also MCG. It does **not** cover PST-POP or solidaritéS: both fall below the survey's inclusion rule (3 % of the vote or one elected member), which matches the site's own seat file, where `"PST/Sol."` has 0 National Council seats in 2023 (`data/seats-national-council-2023.json`, from the OFS). For the 7 covered parties, the CHES 2024 order is exactly the site's current order (Verts, PS, PVL, Centre, PEV, PLR, UDC), and the 2019 wave gives the same order.

Two pairs in that order are close and source-dependent. **Verts and PS**: CHES puts the Verts left of the PS (1.33 vs 1.67, each with an expert spread of 0.90), while Selects 2023 puts the PS left of the Verts both as seen by each party's voters (1,7 vs 1,9) and as candidates see themselves (1,7 vs 1,8), and smartmonitor's roll-call share also has the SP slightly left (3 % vs 5 %, as reported by Blick). **Centre and PEV**: CHES puts the PEV right of the Centre (5.64 vs 5.47) with the widest expert spread of any Swiss party (1.75); smartmonitor's roll-call share puts the EVP left of both the GLP and the Mitte (31 % vs 51 % and 64 %). The other steps (PVL < Centre/PEV < PLR < UDC, left bloc < PVL) agree across all sources read.

Selects is the national election study and carries authority, but its public report covers only the six largest parties and its microdata require a request to FORS, so it is a cross-check rather than the citation. CSES Module 6 holds a single collaborator's expert judgment for the same nine parties as CHES (minus EDU), so it adds nothing for coverage. Roll-call scores measure voting in the National Council, not party ideology, exist only for parties with a parliamentary group, and the only figures read here come from news reports.

### Implication for ADRs

- **Future ADR "Source of the left-right order" (not yet written):** favours CHES 2024 `lrgen` as the single cited source for the 7 national parties it covers; Selects 2023 Tableau 14 as a named cross-check. Rules out roll-call scores as the primary source (they rank parliamentary groups, not parties, and PST-POP and solidaritéS have no group).
- **PRD-0001 §8 (Left-right order):** answers the open question for 7 of 9 national parties; the order Verts before PS and Centre before PEV should be described as "following CHES 2024", since other sources invert them.

---

<a id="q2"></a>
## Q2: Are the long-running comparative datasets (Manifesto Project, ParlGov, V-Party) usable instead?

### Context

These datasets are often cited for party positions and some of them cover the small left parties that CHES lacks. The question is whether any of them is current enough and measured (not imputed) for the Swiss parties.

### Sources consulted

| Source | URL | Type | Last verified | Confidence | Key quote / finding |
|---|---|---|---|---|---|
| Manifesto Project datasets page | [manifesto-project.wzb.eu/datasets](https://manifesto-project.wzb.eu/datasets) | Academic dataset (producer page) | 2026-11-16 | ★★★ | Latest version "2026a", DOI [10.25522/manifesto.mpds.2026a](https://doi.org/10.25522/manifesto.mpds.2026a). |
| Manifesto 2026a coded documents list | [documents_MPDataset_MPDS2026a.csv](https://manifesto-project.wzb.eu/down/data/2026a/codebooks/documents_MPDataset_MPDS2026a.csv) | Academic dataset documentation | 2026-11-16 | ★★★★ | Latest Swiss election coded: October 2019 (date 201910). Parties coded for 2019 include "Swiss Labour Party", "Together on the Left", Greens, GLP, SP, FDP, CVP, EVP, EDU, SVP, BDP, Ticino League; MCG last coded 2015. No 2023 election and no Le Centre. |
| Manifesto Project terms of use | [terms_of_use](https://manifesto-project.wzb.eu/information/documents/terms_of_use) | Producer terms | 2026-11-16 | ★★★★ | "Redistribution of the provided data is forbidden except when redistribution is authorized in writing"; data provided "for the purposes of scientific research". |
| ParlGov data page | [parlgov.org/data-info](https://www.parlgov.org/data-info/) | Academic dataset (producer page) | 2026-11-16 | ★★★ | "ParlGov development version" of 4 Nov. 2023; no licence stated on the page. |
| ParlGov codebook | [codebook.pdf](https://www.parlgov.org/data/codebook.pdf) | Academic dataset documentation | 2026-11-16 | ★★★★ | left/right sources: "Castles/Mair 1983 (left/right), Huber/Inglehart 1995 (left/right), Benoit/Laver 2006 (left/right), CHES 2010 (lrgen 1999 and 2002 and 2006)"; missing positions "are imputed by mean values for the respective party family", shown with one decimal place. |
| ParlGov party table | [view_party.csv](https://www.parlgov.org/data/parlgov-development_csv-utf-8/view_party.csv) | Academic dataset | 2026-11-16 | ★★★★ | Switzerland (CHE) `left_right`: PdA 0.5263, "S Solidarity" 1.3 (imputed), Greens 1.6886, SP 1.8319, GLP 2.5 (imputed), CVP 4.7288, EVP-PEP 4.9248, CsP-PCS 6.2 (imputed), FDP 6.3249, SVP 7.3575, MCG ("MCR") 8.8 (imputed). No row for Le Centre. |
| V-Party dataset page | [v-dem.net V-Party](https://www.v-dem.net/data/v-party-dataset/) | Academic dataset (producer page) | 2026-11-16 | ★★★ | "Version 2", published February 2022. |
| V-Party codebook v2 | [vparty_codebook_v2.pdf](https://www.v-dem.net/documents/6/vparty_codebook_v2.pdf), [doi:10.23696/vpartydsv2](https://doi.org/10.23696/vpartydsv2) | Academic dataset documentation | 2026-11-16 | ★★★★ | Expert coding for 1970-2019; "experts coded data for all parties that reached more than 5% of the vote share"; v2pariglef is an "Economic left-right scale". |

### Finding

None of the three is usable as the site's source. The **Manifesto Project** stops at the 2019 election for Switzerland (no 2023 manifesto, no Le Centre), measures the content of election programmes rather than party positions, and its terms forbid redistribution without written permission. **ParlGov** averages expert surveys from 1983 to 2006 and fills gaps with party-family means: for Switzerland this gives the PVL 2.5 (close to the PS at 1.83, where CHES 2024 has 4.60), the left-wing CSP 6.2 (next to the FDP at 6.32) and the MCG 8.8, all imputed, and it has no Le Centre row, so it would mislead. **V-Party** stops in 2019, codes only parties above 5 % of the vote, and its left-right variable is economic only.

ParlGov does keep one thing of value: a published family classification and an old measured score for the Swiss Party of Labour (PdA 0.5263, family "com"), the only published left-right figure found for PST-POP.

### Implication for ADRs

- **Future ADR "Source of the left-right order":** rules out Manifesto Project, ParlGov and V-Party as the primary source. ParlGov may be cited only as a fallback for PST-POP, labelled with its age, if the owner wants a sourced position for that party (see Q3).

---

<a id="q3"></a>
## Q3: Does any published source place cantonal sections, or the canton-only parties?

### Context

42 of the 51 entries are cantonal: sections of national parties in GE, VD, VS, NE, JU, FR, plus parties that exist only in one canton or as alliances (MCG and LJS in GE, Ensemble à Gauche in GE, CG-PCS in FR, PCSI and CS-POP in JU, POP sections in VD and NE). The site orders each canton's list on its own.

### Sources consulted

| Source | URL | Type | Last verified | Confidence | Key quote / finding |
|---|---|---|---|---|---|
| CHES 2024 codebook | [CHES.2024.Codebook.pdf](https://github.com/chesdata/chesdata.github.io/releases/download/ches-europe/CHES.2024.Codebook.pdf) | Academic dataset documentation | 2026-11-16 | ★★★★ | Swiss party list: SVP/UDC, SP/PS, FDP/PLR, DM/LC/AdC, GPS/PES, GPL/PVL, EVP/PEV, EDU/UDF, "3610 Lega Lega dei Ticinesi", "3615 MCG Mouvement Citoyens Genevois". National parties only, plus two regional parties with federal seats. |
| CSES Module 6 codebook part 3 | [cses6_codebook_part3_parties_and_leaders.txt](https://cses.org/wp-content/uploads/2025/12/cses6_codebook_part3_parties_and_leaders.txt) | Academic dataset documentation | 2026-11-16 | ★★★★ | "PARTY I (Geneva Citizens' Movement, MCG) is a regional electoral party that only contested in the canton of Geneva." No other canton-only party. |
| Selects 2023 Candidate Survey | [doi:10.48573/62nt-tx63](https://doi.org/10.48573/62nt-tx63) (catalogue record read on [B2FIND](https://b2find.eudat.eu/dataset/57ae412b-4fa3-543f-b1cb-292ca8f70e9c)) | Academic dataset (catalogue) | 2026-11-16 | ★★★ | "2527 out of 5997 candidates participated"; collects "policy position of the candidates"; "Additional Restrictions: Academic research and teaching only". |
| smartvote smartmap method | [sv25_smartmap_de.pdf](https://blog.smartvote.ch/wp-content/uploads/2026/01/sv25_smartmap_de.pdf) | Producer method note | 2026-11-16 | ★★★ | "Die smartmap-Grafik stellt die politischen Positionen von Kandidierenden oder Parteien ... dar"; axes come from a correspondence analysis, and "Die Benennung der beiden Achsen (links-rechts, konservativ-liberal) erfolgt nachträglich und ist subjektiv." |
| smartvote legal notice | [smartvote.ch/en/impressum](https://smartvote.ch/en/impressum) | Producer terms | 2026-11-16 | ★★★ | "All content, data, design, structure and source code of smartvote are protected by copyright"; use for public purposes "requires the express prior consent of the operator". |
| OFS seats in the repository | `data/seats-national-council-2023.json` (from the [OFS dataset](https://opendata.swiss/de/dataset/eidg-wahlen-2023/resource/3404a45f-c85f-428b-b5e1-68253254c1c4)) | Official statistics | 2026-11-16 | ★★★★ | `"PST/Sol.": 0` National Council seats in 2023, which explains the absence of PST-POP and solidaritéS from CHES 2024. |

### Finding

**No published source measures cantonal sections separately.** CHES, Selects (published tables) and CSES all position national parties. The one canton-only party with a published score is the **MCG** (CHES 2024 lrgen 8.08, 12 experts), which places it between the PLR (7.67) and the UDC (9.00), the order the site already uses in GE. For **LJS, PCSI, CG-PCS, Ensemble à Gauche, CS-POP and the POP sections**, no current published left-right score was found; the Manifesto Project coded "Together on the Left" in 2019 only, and ParlGov's "Solidarity" value is an imputed family mean (Q2). A search for a survey of cantonal party presidents (for example by Andreas Ladner) found nothing citable in this pass.

Two sources could in principle position cantonal lists, because candidates run per canton: the **Selects 2023 Candidate Survey** (candidate self-placement, licensed for "Academic research and teaching only") and **smartvote** (candidate answers mapped by correspondence analysis, reuse for public purposes only with the operator's consent). Using either for the site would mean computing new party averages from microdata, which is the site producing its own measurement under a licence that does not cover publication, rather than citing a published figure.

Interpretation, flagged as such: placing a cantonal section at its national party's position is a site convention, not a sourced measurement; it is defensible only if the card and the footer say that the position is the national party's.

### Implication for ADRs

- **Future ADR "Source of the left-right order":** cantonal sections inherit the national party's CHES value, recorded as inherited; MCG takes its own CHES value; LJS, PCSI, CG-PCS, Ensemble à Gauche, CS-POP and POP sections have no sourced position and need an explicit rule (see Recommendation).
- **Rejected option:** computing averages from the Selects Candidate Survey or smartvote, unless FORS or Politools grants written permission.

---

<a id="q4"></a>
## Q4: Under which reuse terms may the site publish a source's values, and how can `data/parties.json` store them?

### Context

The site already publishes OFS seat figures with a source, a licence string and an attribution (`Seats` in `src/types.ts`). Party facts use `SourcedFact` (`value`, `source`, `checked_on`), whose `value` is an integer in `SOURCED_FACT_SCHEMA`. A left-right score is a decimal and needs its dataset, variable and year to be traceable.

### Sources consulted

| Source | URL | Type | Last verified | Confidence | Key quote / finding |
|---|---|---|---|---|---|
| CHES Europe download page | [chesdata.eu/ches-europe](https://www.chesdata.eu/ches-europe) | Producer page | 2026-11-16 | ★★★ | Gives a citation per wave ("When using the 1999-2024 trend file, please cite: Rovny, Jan, Jonathan Polk, ... 2025") and no licence for the data files. |
| CHES GitHub repository hosting the files | [chesdata/chesdata.github.io](https://github.com/chesdata/chesdata.github.io) | Producer repository | 2026-11-16 | ★★★ | GitHub API reports `"license": null` for the repository that serves the release files. |
| CHES 2024 article | [doi:10.1016/j.electstud.2025.102981](https://doi.org/10.1016/j.electstud.2025.102981) | Peer-reviewed article | 2026-11-16 | ★★★ | "This is an open access article under the CC BY license" (the article, not the dataset). |
| CHES 2024 codebook citation | [CHES.2024.Codebook.pdf](https://github.com/chesdata/chesdata.github.io/releases/download/ches-europe/CHES.2024.Codebook.pdf) | Academic dataset documentation | 2026-11-16 | ★★★★ | "Citation: Rovny, Jan, Ryan Bakker, Liesbet Hooghe, Seth Jolly, Gary Marks, Jonathan Polk, Jan Rovny, Marco Steenbergen, and Milada Anna Vachudova. 2025." |
| Selects 2023 report | [PDF](https://forscenter.ch/wp-content/uploads/2024/06/selects-studie-2023_fr.pdf) | Academic report | 2026-11-16 | ★★★★ | "Tous droits réservés. Copyright © chez l'éditeur." Citation given on p. 2 with DOI 10.24447/SLC-2024-00002. |
| SWISSUbase Selects 2023 PES | [SWISSUbase ref. 2634](https://www.swissubase.ch/en/catalogue/studies/20738/latest/datasets/2634/3233/overview) | Academic dataset (catalogue) | 2026-11-16 | ★★★★ | Download on request; the "Usage license" tab could not be read (its direct URL returned 404). |
| CSES citation page | [funding sources and how to cite](https://cses.org/data-download/cses-module-6-2021-2026/funding-sources-and-how-to-cite-module-6/) | Producer page | 2026-11-16 | ★★★ | Citation form "The Comparative Study of Electoral Systems (www.cses.org). CSES MODULE 6 THIRD ADVANCE RELEASE"; no licence stated. The download page still lists the Second Advance Release. |
| smartmonitor home page | [smartmonitor.ch/fr](https://www.smartmonitor.ch/fr) | Producer page | 2026-11-16 | ★★★ | Footer badge links to [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). |
| Manifesto Project terms | [terms_of_use](https://manifesto-project.wzb.eu/information/documents/terms_of_use) | Producer terms | 2026-11-16 | ★★★★ | "Redistribution of the provided data is forbidden except when redistribution is authorized in writing". |

### Finding

**CHES** publishes its files openly with a requested citation but **no licence for the data** (no licence on the download page, none on the hosting repository); only the article is CC BY. Citing a handful of party means with the requested citation is ordinary academic practice, but the terms for a public, non-academic site are not written down anywhere read here, so written confirmation from the CHES team would close the question. **Selects** figures can be quoted from the report with its citation (the report is "Tous droits réservés", so the site quotes numbers, it does not reproduce the table). **smartmonitor** is CC BY-NC-SA 4.0 (non-commercial, share-alike), compatible with a non-commercial site that credits it, but its party-level figures could not be read from the site itself. **Manifesto** and **smartvote** require written permission.

Storage: `SourcedFact` cannot hold a CHES value as is, because its `value` rule is `integer`. A dedicated object keeps the order auditable and lets `npm run check` verify it. Proposed shape (not implemented):

```json
"left_right": {
  "value": 1.67,
  "scale": "0-10",
  "dataset": "CHES 2024, lrgen, party_id 3602",
  "source": "https://www.chesdata.eu/ches-europe",
  "checked_on": "2026-11-16",
  "inherited_from": null
}
```

with `inherited_from: "ps-ch"` on a cantonal section and the whole object `null` (or absent) where no source exists. This needs a `number` rule kind in `src/types.ts` (the schema language has only `integer` today) and a `SourcedPosition` type next to `SourcedFact`. The citation and the attribution text (authors, year, DOI) belong once in the file's `_readme` or in a small top-level block, like `seats.attribution`, rather than on 51 rows.

### Implication for ADRs

- **Future ADR "Source of the left-right order":** decision must record the reuse basis for CHES (citation only, or written confirmation) and the storage shape; option "reuse `SourcedFact`" is ruled out without a schema change because `value` is an integer.
- **Future ADR on data schema (if any):** adds a `number` rule kind and `SourcedPosition`.

---

<a id="q5"></a>
## Q5: Can any source justify the eight French labels, or only the order?

### Context

The site shows a label per party: "Gauche radicale" (PST-POP, EàG, POP, CS-POP), "Gauche anticapitaliste" (solidaritéS), "Gauche écologiste" (Verts), "Centre gauche" (PS, CG-PCS), "Centre" (PVL, Centre, PEV, PCSI), "Centre droit" (PLR, LJS), "Droite populiste" (MCG), "Droite conservatrice" (UDC). A label is a fact shown to voters, so under goal 2 it needs a source too.

### Sources consulted

| Source | URL | Type | Last verified | Confidence | Key quote / finding |
|---|---|---|---|---|---|
| CHES 2024 codebook, party families | [CHES.2024.Codebook.pdf](https://github.com/chesdata/chesdata.github.io/releases/download/ches-europe/CHES.2024.Codebook.pdf) | Academic dataset documentation | 2026-11-16 | ★★★★ | Family ids: "1 Radical Right", "3 Liberal", "4 Christian-Democratic", "5 Socialist", "6 Radical Left", "7 Green", "10 Confessional"; users "are advised to review family codings to ensure they match their own research goals". |
| CHES 2024 party means, family and populism variables | [CHES_2024_final_v2.csv](https://github.com/chesdata/chesdata.github.io/releases/download/ches-europe/CHES_2024_final_v2.csv) | Academic dataset | 2026-11-16 | ★★★★ | family: UDC 1, MCG 1, PLR 3, Centre 4, PS 5, Verts 7, PVL 7, PEV 10. anti_elite_salience ("How salient has ANTI-ESTABLISHMENT and ANTI-ELITE RHETORIC been", 0 to 10): UDC 8.71, MCG 8.20, Lega 8.20, PS 3.86, Verts 3.43, PLR 2.57. |
| Selects 2023 report | [PDF](https://forscenter.ch/wp-content/uploads/2024/06/selects-studie-2023_fr.pdf) | Academic report | 2026-11-16 | ★★★★ | Scale anchors only: "0 (Gauche) 5 (Centre) 10 (Droite)"; no verbal category per party. |
| smartvote smartmap method | [sv25_smartmap_de.pdf](https://blog.smartvote.ch/wp-content/uploads/2026/01/sv25_smartmap_de.pdf) | Producer method note | 2026-11-16 | ★★★ | Axis names are given afterwards "und ist subjektiv". |

### Finding

**No source read here publishes verbal left-right categories such as "Centre gauche" or "Droite conservatrice" for Swiss parties.** The sources give numbers on a 0 to 10 scale (CHES, Selects) or party families (CHES, ParlGov). The sources can therefore justify the **order**, and a **number** per party, but not the current labels. Three current labels are contradicted by the evidence read:

- **PS "Centre gauche"**: CHES 1.67 and Selects 1,7 place the PS as far left as the Verts, not at the centre-left; CHES family is "Socialist".
- **UDC "Droite conservatrice" vs MCG "Droite populiste"**: CHES puts both in family "Radical Right" and gives the UDC a higher anti-elite salience (8.71) than the MCG (8.20), so the data do not support calling the MCG populist and not the UDC.
- **PVL "Centre"**: CHES 4.60 is left of the scale midpoint, and its CHES family is "Green".

A label derived by the site from the score (for example fixed bands of `lrgen`) would be a site convention applied to a sourced number; it is honest only if the bands are published next to it. The CHES family, translated, is a sourced label but reads oddly to voters for some parties (PVL "Vert", PEV "Confessionnel").

### Implication for ADRs

- **Future ADR "Source of the left-right order":** decide between (a) showing the sourced score and dropping the verbal labels, (b) keeping verbal labels as a disclosed site convention computed from the score, (c) showing the CHES family translated into French. Current hand-written labels have no source and three conflict with the data, so keeping them as they are fails PRD-0001 goal 2.

---

## Findings summary (citable from ADRs)

| Q | Finding (one sentence) | Confidence | Feeds |
|---|---|---|---|
| Q1 | CHES 2024 `lrgen` is the only current, public, general left-right source for Swiss parties; it covers 7 of the 9 national parties (not PST-POP, not solidaritéS) and matches the site's order, while Selects 2023 and smartmonitor invert Verts/PS and smartmonitor also moves the PEV left of the Centre. | ★★★★ | PRD-0001 §8; future ADR on the order source |
| Q2 | Manifesto Project (last Swiss election 2019, no redistribution), ParlGov (old surveys plus family-mean imputation, no Le Centre) and V-Party (to 2019, economic only, parties above 5 %) are not usable as the site's source. | ★★★★ | Future ADR on the order source |
| Q3 | No published source positions cantonal sections; MCG is the only canton-only party with a score (CHES 2024, 8.08); LJS, PCSI, CG-PCS, Ensemble à Gauche, CS-POP and POP sections have none. | ★★★★ | Future ADR on the order source |
| Q4 | CHES data carry a requested citation but no licence (the article is CC BY); Selects figures can be quoted with citation; a decimal score does not fit `SourcedFact`, which stores integers. | ★★★ | Future ADR on the order source; data schema |
| Q5 | Sources justify the order and a numeric position, not the eight French labels; three labels (PS, UDC vs MCG, PVL) conflict with CHES. | ★★★★ | Future ADR on the order source; PRD-0001 US-06 |

---

## Recommendation

One line: cite **CHES 2024 `lrgen`** for the order of the national parties, inherit it for cantonal sections, use CHES for the MCG, and show the remaining parties as "non classé" rather than invent a place.

1. **National parties (CH).** Store CHES 2024 `lrgen` for Verts (1.33), PS (1.67), PVL (4.60), Centre (5.47), PEV (5.64), PLR (7.67), UDC (9.00); the current order stays as it is. For PST-POP and solidaritéS, which CHES does not cover, keep them at the left end only under an explicit, displayed rule ("non classé par la source ; placé à gauche selon sa famille politique") or, if the owner wants a figure, cite ParlGov's PdA value (0.53, surveys up to 2006) with its age; there is no published figure for solidaritéS. Name Selects 2023 Tableau 14 as a cross-check and say on the page that other studies place the PS slightly left of the Verts.
2. **Cantonal sections.** Inherit the national value with `inherited_from` set, and show "position du parti national (CHES 2024)" on the card. POP sections and CS-POP inherit nothing automatically: POP is the cantonal name of PST-POP, so they follow whatever rule item 1 sets for PST-POP; CS-POP is an alliance and needs the owner's ruling.
3. **Canton-only parties.** MCG: own CHES value (8.08), which keeps it between PLR and UDC in GE. LJS, PCSI, CG-PCS, Ensemble à Gauche, CS-POP: `left_right` null, card shows "non classé"; their place in the half-circle follows a written rule chosen by the owner (for example next to the national party they sit with in the cantonal parliament), stated in the footer as a site convention.
4. **Labels.** Replace the eight hand-written `position` labels with the sourced score on the card ("1,7 sur 10, 0 = gauche, 10 = droite"), or, if words are wanted, with bands of the score whose limits are published in the footer. Do not keep "Centre gauche" for the PS or the populist/conservative split between MCG and UDC: the data contradict both.
5. **`data/parties.json` and `src/types.ts`.** Add `left_right` (shape in Q4) with a `number` rule kind; put the CHES citation once in the file; let `npm run check` assert that, within a territory, the array order is non-decreasing in `left_right.value` where present. Drop or rework `position`, which today is shown on every card without a source (`src/site/app.ts` line 279), against US-06.
6. **Footer copy (`index.html` line 81, and README line 9).** Replace "Il suit l'usage courant dans les médias et la recherche" with a sourced sentence, for example: « L'ordre suit la position gauche-droite attribuée aux partis nationaux par des politologues (Chapel Hill Expert Survey 2024, échelle de 0 à 10). Les sections cantonales reprennent la position de leur parti national. Les partis que l'enquête ne couvre pas sont indiqués comme non classés. » with a link to the CHES page and the citation.

These changes are proposals for the owner; none is implemented by this note.

### Open items (to file once the ledger exists)

The repository has no central open-items ledger yet (PRD-0001 §9 notes the same), so the gaps found here are listed for filing:

- doc-gap, Source anchor `#q4`, Source heading "Q4: Under which reuse terms may the site publish a source's values": ask the CHES team in writing whether a public, non-commercial site may display Swiss `lrgen` means with the requested citation.
- doc-gap, `#q1`, "Q1: Which published sources give a current general left-right position": read smartmonitor's own party-level figures and method (its pages render in JavaScript and could not be read), and the NZZ DW-Nominate article, instead of news reports.
- doc-gap, `#q1`: extract the CSES Module 6 collaborator values for Switzerland (`F5029_A` to `F5029_I`) from the dataset, since the Macro Report PDF does not yield them as text.
- decision-gap, `#q3`, "Q3: Does any published source place cantonal sections, or the canton-only parties": owner's rule for placing LJS, PCSI, CG-PCS, Ensemble à Gauche and CS-POP, and for PST-POP and solidaritéS nationally.
- decision-gap, `#q5`, "Q5: Can any source justify the eight French labels": owner's choice among score only, score bands, or CHES family.
- doc-gap, `#q3`: search further for a citable survey of Swiss cantonal parties (for example cantonal party presidents) that could place cantonal sections and canton-only parties.

---

## Decisions Anchored

_(empty until Mode 4 Freeze)_

---

## Consolidated sources

### Academic datasets and their documentation (producers)

- [CHES Europe download page](https://www.chesdata.eu/ches-europe): waves, files and requested citations.
- [CHES 2024 codebook](https://github.com/chesdata/chesdata.github.io/releases/download/ches-europe/CHES.2024.Codebook.pdf): variable definitions, Swiss party ids, inclusion rule, families.
- [CHES 2024 party means](https://github.com/chesdata/chesdata.github.io/releases/download/ches-europe/CHES_2024_final_v2.csv): `lrgen`, family and populism values for 10 Swiss parties.
- [CHES 2024 expert-level file](https://github.com/chesdata/chesdata.github.io/releases/download/ches-europe/CHES_2024_ALL_Stacked_Expert.csv): expert counts and spread (computed here).
- [CHES 2019 party means](https://github.com/chesdata/chesdata.github.io/releases/download/ches-europe/CHES2019V3.csv): 2019 Swiss `lrgen` values.
- [chesdata/chesdata.github.io](https://github.com/chesdata/chesdata.github.io): repository serving the files, no licence declared.
- [Selects 2023 Post-Election Survey, doi:10.48573/q99z-aa77](https://doi.org/10.48573/q99z-aa77): microdata on request.
- [Selects 2023 Candidate Survey, doi:10.48573/62nt-tx63](https://doi.org/10.48573/62nt-tx63) (record on [B2FIND](https://b2find.eudat.eu/dataset/57ae412b-4fa3-543f-b1cb-292ca8f70e9c)): academic research and teaching only.
- [Selects 2023 French questionnaire](https://cses.org/wp-content/uploads/2025/12/CHE_2023_French.pdf): Q43 party placement list.
- [CSES Module 6 download page](https://cses.org/data-download/cses-module-6-2021-2026/), [codebook part 2](https://cses.org/wp-content/uploads/2025/12/cses6_codebook_part2_variables.txt), [codebook part 3](https://cses.org/wp-content/uploads/2025/12/cses6_codebook_part3_parties_and_leaders.txt), [Swiss Macro Report](https://cses.org/wp-content/uploads/2025/12/CHE_2023_Macro.pdf), [citation page](https://cses.org/data-download/cses-module-6-2021-2026/funding-sources-and-how-to-cite-module-6/).
- [Manifesto Project datasets](https://manifesto-project.wzb.eu/datasets), [coded documents 2026a](https://manifesto-project.wzb.eu/down/data/2026a/codebooks/documents_MPDataset_MPDS2026a.csv), [terms of use](https://manifesto-project.wzb.eu/information/documents/terms_of_use).
- [ParlGov data page](https://www.parlgov.org/data-info/), [codebook](https://www.parlgov.org/data/codebook.pdf), [party table](https://www.parlgov.org/data/parlgov-development_csv-utf-8/view_party.csv).
- [V-Party dataset page](https://www.v-dem.net/data/v-party-dataset/), [codebook v2](https://www.v-dem.net/documents/6/vparty_codebook_v2.pdf).

### Official statistics

- [OFS, Eidgenössische Wahlen 2023 on opendata.swiss](https://opendata.swiss/de/dataset/eidg-wahlen-2023/resource/3404a45f-c85f-428b-b5e1-68253254c1c4): source of `data/seats-national-council-2023.json` (PST/Sol. 0 seats).

### Academic / peer-reviewed

- Rovny, Bakker, Hooghe, Jolly, Marks, Polk, Steenbergen, Vachudova (2025), "The 2024 Chapel Hill Expert Survey on political party positioning in Europe: Twenty-five years of party positional data", Electoral Studies 97, [doi:10.1016/j.electstud.2025.102981](https://doi.org/10.1016/j.electstud.2025.102981) ([open copy](https://lucris.lub.lu.se/ws/files/225311019/CHES_2024_Electoral_Studies_Published.pdf)).
- Tresch, Rennwald, Lauener, Lutz, Alkoç, Benvenuti, Mazzoleni (2024), "Élections fédérales 2023. Participation et choix électoral", FORS, [doi:10.24447/SLC-2024-00002](https://doi.org/10.24447/SLC-2024-00002) ([PDF](https://forscenter.ch/wp-content/uploads/2024/06/selects-studie-2023_fr.pdf)).

### Producer pages and terms (civic tools)

- [smartmonitor](https://www.smartmonitor.ch/fr): National Council roll-call monitor by Politools, CC BY-NC-SA 4.0 badge.
- [smartvote smartmap method](https://blog.smartvote.ch/wp-content/uploads/2026/01/sv25_smartmap_de.pdf) and [smartvote legal notice](https://smartvote.ch/en/impressum).

### News reports

- [Blick, 17.08.2023, smartmonitor analysis](https://www.blick.ch/politik/neue-auswertung-zeigt-martullo-blocher-ist-die-rechteste-politikerin-im-nationalrat-id18850944.html).
- [Bluewin, 3 Dec 2025, NZZ DW-Nominate rating](https://www.bluewin.ch/en/news/switzerland/trede-to-hess-voting-behavior-in-the-national-council-hardly-changes-2992936.html).

---

## Changelog

| Date | Author | Mode | Change summary |
|---|---|---|---|
| 2026-11-16 | Victor Hueni (Claude) | Scaffold + Fill | Created and filled in one pass. Step 0 answers taken from the brief: no ADR yet (1B), custom list of 5 questions (2D), deep verification on primary dataset files (3B), every cited URL fetched on 2026-11-16 (4A). Not readable: smartmonitor data and method pages (JavaScript, one 404), SWISSUbase usage-licence tab (404), NZZ article (not fetched). Status: Draft until the owner rules on Q3 and Q5. |
