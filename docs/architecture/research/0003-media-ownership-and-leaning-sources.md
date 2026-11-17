---
type: Architecture Research Note
title: "Research-0003: Sources for Swiss media ownership and political leaning"
description: Which sources can tell a voter, with a source and a date, which media serve French-speaking Switzerland, who owns each one and where it stands politically, what reuse terms apply, and what already exists in Switzerland that the site could link to instead of rebuilding.
resource: https://github.com/VictorHueni/civic-compass
tags: [civic-compass, transparency, media, ownership, media-leaning, medienmonitor, foeg, lobbywatch]
timestamp: 2026-11-17T18:00:00Z
status: draft
owner: Victor Hueni
last_reviewed: 2026-11-17
review_interval: 90d
---

<!-- doc-version: 1.0 | created: 2026-11-17 | last-verified: 2026-11-17 -->

# Research-0003: Sources for Swiss media ownership and political leaning

**Status:** Draft
**Date:** 2026-11-17
**Author:** Victor Hueni (desk research by Claude)
**Last verified:** 2026-11-17
**Feeds ADRs:** none yet. Feeds the owner's request of 2026-11-17 for a "transparency" area (phase 1: Swiss media, their owners and their political leaning; phase 2: lobbies through Lobbywatch), and the PRD that will specify it (a new PRD-0002 or a new story set in PRD-0001, owner's call). A future ADR "Sources of media facts" would cite §Findings summary.
**Superseded by:** -

<!--
LIFECYCLE LEGEND
  Draft     : actively populating; ADRs should not cite yet
  Active    : content complete enough for ADR citation; further updates allowed
  Frozen    : feeding ADRs have landed; further edits only via Mode 3 Refresh
  Superseded: replaced by a newer research file; `Superseded by:` link mandatory
-->

On 2026-11-17 the owner asked for a "transparency" area in two phases: first list the Swiss media, who owns each one and its political leaning, then (later) let a voter tap a lobby and be sent to its page on Lobbywatch. The project rules apply to every new fact: no fact without a recorded source and a check date, unknown is shown as unknown and never guessed (PRD-0001 goal 2), people are shown with name, party, canton and function only (PRD-0001 §3), the site is static with no backend and no tracking. The precedent for a political placement is the Chapel Hill Expert Survey `lrgen` for parties ([Research-0001](0001-left-right-placement-sources.md)): a published, method-documented measurement. This note asks which sources can meet that bar for media, and what already exists in Switzerland. Lobbywatch is only touched where it is prior art (Q4); its own research note is Research-0004.

**How confidence is rated here.** Same mapping as Research-0001 and Research-0002. ★★★★★: a statute, or the body that holds the official record publishing it, read directly. ★★★★: a study or dataset read directly from the body that produced the measurement (a federal office's commissioned study, a university research centre), or a company's own statement about itself made under a legal duty. ★★★: a producer's press release or own page describing its product, a company's own unaudited statement about itself, an independent project describing itself. ★★: news report, encyclopaedia, commercial or crowd rating site. Figures read from a chart rather than from text are marked "read from chart". All downloads were made on 2026-11-17 into a scratch folder outside the repository; nothing downloaded was executed. Research was run by four parallel desk-research passes; every source that a Finding rests on was then re-read directly (curl and PDF text extraction) before being cited, and the rows read only through a summarising fetch say so.

---

## Questions index

1. [Q1](#q1): Which source lists the media brands serving French-speaking Switzerland together with the company or group that owns each, and on what terms can the site reuse it?
2. [Q2](#q2): Can the owner behind a media company be verified from an official source, and does any official register name shareholders?
3. [Q3](#q3): Is there a neutral, citable, method-documented source that places Swiss media on a left-right scale, comparable to CHES for parties?
4. [Q4](#q4): Has anyone in Switzerland already built something like this (media ownership, media leaning, links to lobbies), and what can the site link to instead of rebuilding?
5. [Q5](#q5): What do the reuse terms and the personal-data rule of PRD-0001 §3 allow the site to show?

---

<a id="q1"></a>
## Q1: Which source lists the media brands serving French-speaking Switzerland together with the company or group that owns each, and on what terms can the site reuse it?

### Context

Before any leaning, the area needs a list: which media serve the six covered cantons (GE, VD, VS, NE, JU, FR), in which genre (press, radio, TV, online), and which company or group stands behind each. The owner has not yet set the scope (national titles only, or regional titles too; press only, or broadcasting and online too). The list must come from a source the site can cite and date, ideally one that a command could read.

### Sources consulted

| Source | URL | Type | Last verified | Confidence | Key quote / finding |
|---|---|---|---|---|---|
| Medienmonitor Schweiz, ownership database | [medienmonitor-schweiz.ch/beteiligungen/](https://www.medienmonitor-schweiz.ch/beteiligungen/) | Study commissioned by OFCOM (Publicom AG) | 2026-11-17 | ★★★★ | "Der Medienmonitor Schweiz erfasst alle aktuell relevanten Beteiligungsstrukturen, weist Medienmarken ihren Besitzern zu und stellt diese für die grossen Konzerne in grafischen Übersichten dar." One page per group (TX Group, Ringier, CH Media, ESH Médias, SRG SSR, NZZ, Somedia and others) plus "Übrige Medienmarken und Beteiligte". HTML only; the charts are drawn in JavaScript; no download offered. |
| Same, "Übrige Medienmarken und Beteiligte" | [/beteiligungen/uebrige-beteiligungen/](https://www.medienmonitor-schweiz.ch/beteiligungen/uebrige-beteiligungen/) | Same | 2026-11-17 | ★★★★ | Rows read directly, for example: "La Liberté St-Paul Holding SA - Paulus-Schwestern (70%) - Freiburger Kantonalbank (15%) - Groupe E (15%)"; "Le Quotidien Jurassien Editions D+P SA - Groupe Démocrate Media Holding SA (100%)"; "Le Temps Stiftung Aventinus (100%)"; "Le Courrier Nouvelle association du Courrier - Streubesitz"; "Radio Chablais Radio Chablais SA - Association du Chablais (98%) - 28 commune du Chablais (2%)". |
| Same, ESH Médias page | [/beteiligungen/esh/](https://www.medienmonitor-schweiz.ch/beteiligungen/esh/) | Same | 2026-11-17 | ★★★★ | "ESH Médias (Edition Suisse Holding SA, früher: Hersant) mit Sitz in Neuenburg publiziert Tageszeitungen in den Kantonen Neuenburg (ArcInfo), Wallis (Le Nouvelliste) und Waadt (La Côte)." |
| Same, imprint and terms | [/impressum/](https://www.medienmonitor-schweiz.ch/impressum/) | Same | 2026-11-17 | ★★★★ | "Der Medienmonitor Schweiz ist eine Studie der Publicom AG im Auftrag des Bundesamts für Kommunikation (BAKOM). Jede Veröffentlichung oder Verbreitung, auch auszugsweise, ist nur unter Quellenangabe gestattet." No open licence. |
| Same, method | [/methodik/](https://www.medienmonitor-schweiz.ch/methodik/) | Same | 2026-11-17 | ★★★★ | "Der Medienmonitor Schweiz untersucht über 180 Medienmarken, die mindestens wöchentlich erscheinen." Update: "Jahres-Aktualisierung der Beteiligungsdatenbank"; "Nach Bekanntwerden massgeblicher Veränderungen wird Datenbank zeitnah angepasst". |
| Same, accuracy disclaimer | [/beteiligungen/uebrige-beteiligungen/](https://www.medienmonitor-schweiz.ch/beteiligungen/uebrige-beteiligungen/) | Same | 2026-11-17 | ★★★★ | "Den Medienkonzernen wurden die jeweiligen Besitzverhältnisse zur Kontrolle vorgelegt. Diese Feedbackmöglichkeit wurde jedoch nicht in jedem Fall genutzt. Publicom erhebt keinen Anspruch auf die Vollständigkeit sowie Genauigkeit der Angaben." |
| Same, regional factsheet Vaud Fribourg Valais 2024 | [MMS24_VaudFribourgValais-de.pdf](https://www.medienmonitor-schweiz.ch/uploads/media/default/0001/02/MMS24_VaudFribourgValais-de.pdf) | Same | 2026-11-17 | ★★★★ | HTTP `last-modified: Mon, 12 Jan 2026`. Read through a summarising fetch: "Untersuchungsperiode 2024", "Sample Medienraum: 48 Medienmarken". Factsheets also exist for Genève and Arc jurassien (not read in full). |
| OFCOM, broadcasting concessions 2025 to 2034 | [bakom.admin.ch, octroi des concessions](https://www.bakom.admin.ch/fr/octroi-des-concessions-de-diffusion-pour-la-periode-2025-a-2034) | Official page (OFCOM) | 2026-11-17 | ★★★★ | Read through a summarising fetch: "Publié le 4 avril 2025"; programmes per service area, including Radio Chablais, Radio Rhône, RTN, RFJ, Radio Fribourg, Radio Vostok, Léman Bleu, La Télé, Canal 9, Canal Alpha. Holder companies are named only in the per-concession decisions. |
| DETEC decision, Bas-Valais radio concession | [radio-rhone-verfuegung.pdf](https://www.bakom.admin.ch/dam/fr/sd-web/UcDCUgTE7zd7/radio-rhone-verfuegung.pdf) | Official decision | 2026-11-17 | ★★★★★ | "est octroyée à Radio Rhône SA". The applicant "indique les détenteurs des parts prépondérantes du capital", but the decision does not publish them. |
| OFCOM RTV database | [rtvdb.ofcomnet.ch/fr](https://rtvdb.ofcomnet.ch/fr) | Official database | 2026-11-17 | not rated | JavaScript application; content and export could not be read. The OFCOM description page says it lists every broadcaster with a concession or a notification (address, programme, area). |
| Médias Suisses (French-speaking publishers' association) | [mediassuisses.ch](https://mediassuisses.ch/) | Industry association | 2026-11-17 | ★★★ | "L'association compte une quarantaine de membres". Lists titles (24 heures, Arcinfo, La Côte, La Gruyère, La Liberté, Le Nouvelliste, Le Quotidien Jurassien, Le Courrier, Tribune de Genève and others), no owners. |
| WEMF/REMP certified circulation 2026 | [remp_bulletin_tirages.pdf](https://remp.ch/media/remp.ch/media/remp_bulletin_tirages.pdf) | Industry audit body | 2026-11-17 | ★★★ | "BASIS / BASE: 1.4.2025 – 31.3.2026". Circulation per title, no publisher or owner column; La Liberté, La Gruyère and 20 minutes are absent. |
| OFCOM open data on opendata.swiss: ownership structure of print media, online media, by media type; opinion power of media groups | [ckan package ubersicht-der-eigentumsverhaltnisse-von-printmedienangeboten](https://ckan.opendata.swiss/api/3/action/package_show?id=ubersicht-der-eigentumsverhaltnisse-von-printmedienangeboten), [meinungsmacht-von-medienkonzernen](https://ckan.opendata.swiss/api/3/action/package_show?id=meinungsmacht-von-medienkonzernen) | Official open data | 2026-11-17 | ★★★★★ | Licence "terms_open". Read through the CKAN API (the opendata.swiss web pages refuse automated fetching): aggregates only (counts by year and type of owner, opinion power of the ten largest groups), not a list of title and owner. |

### Finding

**One source names the owner of each brand: Medienmonitor Schweiz**, a study that OFCOM commissions from Publicom AG, with a documented method, covering "über 180 Medienmarken, die mindestens wöchentlich erscheinen" across press, radio, TV and online. For the six cantons it covers the dailies (24 heures, Tribune de Genève, Le Temps, Le Nouvelliste, Arcinfo, La Côte, La Liberté, Le Quotidien Jurassien, Le Courrier), 20 minutes, the RTS channels, the concessioned regional radio and TV stations and the main commercial radios, each with its company and, where known, its shareholders.

Three limits matter for the site. **It is not machine-readable** (HTML pages and PDF factsheets, no download), so a generated file is not possible and a hand-kept file citing it is. **Its terms allow reuse only with the source named** ("nur unter Quellenangabe gestattet"), with no open licence. **It disclaims completeness and accuracy**, and its ownership trees can lag its own change log (the ownership-chain research pass found Journal du Jura still under Gassmann although the change log of 22.09.2025 records its sale; not re-checked here). It also omits small titles (La Gruyère, Journal de Morges, GHI, Lausanne Cités).

The official sources each cover a slice: OFCOM's concession decisions name the company holding each regional radio and TV concession, but not its shareholders; the OFCOM open-data cubes are openly licensed but aggregate; the publishers' association and the circulation bulletin list titles without owners.

### Implication for ADRs

- **Future ADR "Sources of media facts":** a hand-kept `data/media.json` (brand, genre, area, publishing company, owning group) citing the Medienmonitor page of each group with a check date, cross-checked against OFCOM concession decisions for broadcasters. Rules out a generated file (no machine-readable source).
- **Owner decision (scope):** which brands are in scope; Medienmonitor's coverage is the natural boundary (weekly or more often, opinion-forming), with titles it omits shown only if another source names their owner.

---

<a id="q2"></a>
## Q2: Can the owner behind a media company be verified from an official source, and does any official register name shareholders?

### Context

Medienmonitor names companies and, for many, their shareholders, but disclaims accuracy (Q1). Most French-speaking titles are published by a company limited by shares (SA). The question is whether a voter-facing "owned by" line can rest on an official record, which is the bar the site set for party seats.

### Sources consulted

| Source | URL | Type | Last verified | Confidence | Key quote / finding |
|---|---|---|---|---|---|
| Ordinance on the commercial register (ORC, RS 221.411), art. 45, version of 1.10.2026 | [fedlex filestore, ORC](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2007/686/20261001/fr/html/fedlex-data-admin-ch-eli-cc-2007-686-20261001-fr-html.html) | Statute | 2026-11-17 | ★★★★★ | "L'inscription au registre du commerce d'une société anonyme mentionne: […] n. les membres du conseil d'administration; o. les personnes habilitées à représenter la société". No item names shareholders. |
| Same ordinance, art. 73 (Sàrl), 88 (cooperative), 95 (foundation) | same | Statute | 2026-11-17 | ★★★★★ | Read by the ownership pass, not re-read here: Sàrl entries name "les associés avec indication du nombre et de la valeur nominale de leurs parts sociales"; a cooperative's members are not entered; a foundation's entry names "tous les membres de l'organe suprême". |
| Code of obligations (RS 220), art. 686 | [fedlex filestore, CO](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/27/317_321_377/20261001/fr/html/fedlex-data-admin-ch-eli-cc-27-317_321_377-20261001-fr-html-4.html) | Statute | 2026-11-17 | ★★★★★ | Read by the ownership pass: "La société tient un registre des actions", kept by the company, not public. |
| Federal Act on the Transparency of Legal Entities (LTPM, RS 955.3), in force 1.10.2026 | [fedlex filestore, LTPM](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2026/323/20261001/fr/html/fedlex-data-admin-ch-eli-cc-2026-323-20261001-fr-html-1.html) | Statute | 2026-11-17 | ★★★★★ | Read by the ownership pass: art. 1 al. 3 "garantir aux autorités un accès rapide et efficace"; access is reserved to authorities and some financial intermediaries. ORC art. 10 let. g excludes these notifications from register publicity. |
| Zefix PublicREST API | [api-docs](https://www.zefix.admin.ch/ZefixPublicREST/v3/api-docs) | Official API | 2026-11-17 | ★★★★★ | Read by the ownership pass: credentials required ("Zefix-Credentials"); licence "OGD Open use. Must provide the source."; the company schema has no person or shareholder field. |
| Financial Market Infrastructure Act (FinMIA, RS 958.1), art. 120 | [fedlex filestore, FinMIA](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2015/853/20240201/fr/html/fedlex-data-admin-ch-eli-cc-2015-853-20240201-fr-html-5.html) | Statute | 2026-11-17 | ★★★★★ | Read by the ownership pass: holders crossing "3, 5, 10, 15, 20, 25, 33⅓, 50 ou 66⅔ % des droits de vote" of a listed company must declare it "à la société et aux bourses". Applies to TX Group only among the French-speaking publishers. |
| TX Group annual report 2025, group structure and shareholders | [report.tx.group/2025](https://report.tx.group/2025/ar/en/group-structure-and-shareholders) | Company statement under a legal duty | 2026-11-17 | ★★★★ | Read by the ownership pass (tx.group refused a direct fetch): the founding-family shareholders' pool held 66.8 % at 31.12.2025. |
| Ringier, partnership with La Mobilière (03.02.2020) | [ringier.com](https://www.ringier.com/ringier-and-la-mobiliere-strengthening-their-partnership/) | Company's own statement | 2026-11-17 | ★★★ | Read by the ownership pass: "the Ringier family holds the clear majority of the Ringier Group with a shareholding of 75 percent." Dated 2020. |
| Le Courrier, publishing association | [lecourrier.ch/nac](https://lecourrier.ch/nac/) | Outlet's own statement | 2026-11-17 | ★★★ | Read by the ownership pass: "une association sans but lucratif, la Nouvelle Association du Courrier (NAC)". |
| Letter of RJB SA to OFCOM (29.09.2025) | [Gesuch RJB.pdf](https://www.bakom.admin.ch/dam/de/sd-web/N72jWSlCUBw5/Gesuch%20RJB.pdf) | Document filed with OFCOM | 2026-11-17 | ★★★ | Read by the ownership pass: "les trois actionnaires détenteurs de Jura Média SA, avec un 4e actionnaire, détiennent le journal « Le Quotidien Jurassien » au travers de l'entreprise Editions D+P SA." Does not match Medienmonitor's "Groupe Démocrate Media Holding SA (100%)"; not reconciled. |

### Finding

**No public official register names the shareholders of a Swiss SA.** The commercial register lists the board and the signatories (ORC art. 45), the share register is kept by the company itself (CO art. 686), and the new beneficial-owner register (LTPM, in force since 1 October 2026) is open to authorities only. Partners of a Sàrl are public, a foundation has no owners (its board is public), an association or cooperative publishes no member list.

**Only listed TX Group has statute-backed public disclosure** (FinMIA art. 120, notifications published by SIX, and the annual report): 24 heures, Tribune de Genève, Le Matin Dimanche and 20 minutes. For every other publisher, the owner rests on Medienmonitor (which disclaims accuracy) or on the company's own words, which can be old (Ringier, 2020), silent (ESH Médias: "Das Unternehmen publiziert Informationen nur sehr restriktiv", Medienmonitor's ESH page) or in conflict with another document (Le Quotidien Jurassien).

Interpretation, flagged as such: an "owned by" line can be sourced to the level of the **publishing company and its group** for nearly every title, but the **ultimate owner** can be sourced officially only for TX Group; elsewhere it is "according to Medienmonitor" with a date.

### Implication for ADRs

- **Future ADR "Sources of media facts":** the owner line cites its source per title (Medienmonitor group page, TX Group annual report, the outlet's own page), with a check date, and stops at the group when no source names its shareholders. Rules out the commercial register as an ownership source.
- **Owner decision:** how far up the chain to show (company, group, ultimate owners); see Q5 for people.

---

<a id="q3"></a>
## Q3: Is there a neutral, citable, method-documented source that places Swiss media on a left-right scale, comparable to CHES for parties?

### Context

The owner asked for each medium's political leaning. A leaning is exactly the kind of fact PRD-0001 goal 2 forbids guessing. For parties the site uses CHES `lrgen`, an expert survey with a codebook (Research-0001). The question is whether Swiss media have an equivalent, and if not, what the closest documented measurement actually measures.

### Sources consulted

| Source | URL | Type | Last verified | Confidence | Key quote / finding |
|---|---|---|---|---|---|
| fög (University of Zurich), factsheet "Rolle der SRG SSR im Mediensystem der Schweiz", 03.02.2026, additional analysis 19.02.2026 | [SRG_Rolle_2026_2.pdf](https://www.foeg.uzh.ch/dam/jcr:33f99533-ff1a-4594-9d10-5fe0b3afb8f0/SRG_Rolle_2026_2.pdf) | University research centre, own data | 2026-11-17 | ★★★★ | 61 federal ballots 2018 to 2025, "n = 19'484 Beiträge" (Abbildung 11). "Die öffentlichen Medien SRF (0) und RTS (–2) positionieren sich praktisch im Durchschnitt der Medienarena"; "Akzente nach links gibt es bei Le Matin Dimanche (–11), blick.ch (–12) und SonntagsBlick (–33)"; Medienarena "(–4)". Read from chart (value order matched to label order, consistent with the 11 values stated in the text): lematin.ch –9, tdg.ch –7, letemps.ch –6, 24heures.ch –5, 20minutes.ch –3. |
| Same, method of the axis | same | Same | 2026-11-17 | ★★★★ | "«Mitte-links» sind alle Vorlagen, die von rechter Seite bekämpft werden […], «Mitte-rechts» alle Vorlagen, die von linker Seite bekämpft werden"; "55 dieser 61 Vorlagen können relativ klar politisch zugeordnet werden". Values are the mean tone per ballot, "Positive Werte bedeuten Zustimmung für «Mitte-rechts» oder Ablehnung von «Mitte-links»". |
| Udris, L. (2023), "Unabhängigkeit und politische Positionierung der Medien bei Volksabstimmungen", Jahrbuch Qualität der Medien, Studie III | [JB_2023_Studie_III_AB_final.pdf](https://www.foeg.uzh.ch/dam/jcr:9b6b8973-92ed-4e00-8d75-c7a5e7024a99/JB_2023_Studie_III_AB_final.pdf) | University research centre, own data | 2026-11-17 | ★★★★ | "manuelle Inhaltsanalysen der Berichterstattung über 44 Volksabstimmungen zwischen 2018 und 2023 in 23 Schweizer Medien"; "Die Tonalitätswerte werden nun auf einer Links-rechts-Achse abgetragen. Positive Tonalitätswerte bedeuten hier entweder eine Zustimmung für Mitte-rechts-Behördenvorlagen oder eine Ablehnung von linken Volksinitiativen." Le Matin Dimanche (–12), Medienarena (–5). Licence line: "Copyright fög – Forschungszentrum Öffentlichkeit und Gesellschaft / Universität Zürich"; no open licence. |
| Same, limit stated by the author | same | Same | 2026-11-17 | ★★★★ | For most titles the tone differs more between government proposals and popular initiatives than between left and right; only for some titles "und der WOZ gibt es zwischen Behördenvorlagen und Volksinitiativen klar weniger Unterschiede: Dort ist für die Tonalität entscheidender, welches politische Lager eine Vorlage unterstützt." |
| fög press release (French), 25.09.2023 | [MM_Positionierung_FR.pdf](https://www.foeg.uzh.ch/dam/jcr:5936e3ee-bec4-4e93-8cf7-1d6110b9190b/MM_Positionierung_FR.pdf) | Producer's press release | 2026-11-17 | ★★★ | "En positionnant les médias étudiés sur un axe gauche-droite (-100 à +100), on constate des orientations vers la gauche par exemple chez Le Matin Dimanche (-12) […] On constate des positionnements politiquement neutres autour de la valeur zéro dans les médias à forte pénétration 20minuten.ch (+1), 20minutes.ch (-1), SRF (-1) et RTS (-3)." Also: "Globalement, les médias rendent compte de manière plutôt positive des projets du Gouvernement et du Parlement, tandis qu'ils ont tendance à rejeter les initiatives populaires." |
| fög Abstimmungsmonitor, final report June 2026 | [Abstimmungsmonitor_Juni_2026.pdf](https://www.foeg.uzh.ch/dam/jcr:79651592-5bab-4bc5-ab71-fff58062e3c1/Abstimmungsmonitor_Juni_2026.pdf) | University research centre, own data | 2026-11-17 | ★★★ | Read by the leaning pass only: tone per ballot and per outlet (24 heures, Le Temps, Tribune de Genève, 20 minutes, Le Matin, Le Matin Dimanche, RTS); "Die Akzeptanz gegenüber den Abstimmungsvorlagen wird über die Tonalität gemessen". The raw material of the index above; German only. |
| fög, Jahrbuch Qualität der Medien 2026 | [JB_2026_Gesamt](https://www.foeg.uzh.ch/dam/jcr:f6cf75d4-fdeb-450c-90e2-dd42241d93af/JB_2026_Gesamt_202610015.pdf) | University research centre | 2026-11-17 | ★★★ | Read by the leaning pass only: quality scores (relevance, diversity, context, professionalism) for Le Temps, 24 heures, Le Nouvelliste, Heidi.news, watson, blick.ch/fr, RTS and others; no political position. Licence "CC BY-NC-ND 4.0". |
| Reuters Institute Digital News Report 2026, Switzerland | [reutersinstitute.politics.ox.ac.uk, 2026/switzerland](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/switzerland) | Academic survey report | 2026-11-17 | ★★★ | Read by the leaning and prior-art passes: brand reach and trust, no left-right per brand. |
| Le Courrier, editorial charter (adopted 28.11.2001) | [lecourrier.ch/charte-redactionnelle](https://lecourrier.ch/charte-redactionnelle/) | Outlet's own statement | 2026-11-17 | ★★★ | Read by the leaning pass: "Le Courrier est un journal généraliste et d'opinion qui se fonde sur une vision humaniste."; "indépendance ne veut pas dire neutralité". |
| Media Bias/Fact Check, AllSides | [mediabiasfactcheck.com](https://mediabiasfactcheck.com/le-temps-bias-and-credibility/), [allsides.com](https://www.allsides.com/media-bias/ratings) | Commercial rating sites | 2026-11-17 | ★★ | Both refused automated fetching; known only through search snippets; method not readable. |
| EUI CMPF Media Pluralism Monitor, Euromedia Ownership Monitor | [cmpf.eui.eu, MPM 2025](https://cmpf.eui.eu/mpm-2025-results/), [media-ownership.eu](https://media-ownership.eu/) | Research monitors | 2026-11-17 | ★★★ | Read by the leaning pass: MPM covers "the 27 EU member states and four candidate countries"; EurOMo covers EU owners. Neither covers Switzerland. |

### Finding

**No CHES-like source exists for Swiss media.** No expert survey places Swiss outlets on a left-right scale.

**The closest documented measurement is the fög index** (University of Zurich, Linards Udris): each outlet's articles on federal ballots are coded by hand for tone, ballots are classed "centre-left" or "centre-right" by which camp fights them, and the mean tone is placed on a –100 to +100 axis. It was published in 2023 (44 ballots, 2018 to 2023) and updated in February 2026 (61 ballots, 2018 to 2025). For French-speaking titles the 2026 values are: Le Matin Dimanche –11, lematin.ch –9, tdg.ch –7, letemps.ch –6, 24heures.ch –5, 20minutes.ch –3, RTS –2, against a media average of –4 (the first two and RTS from the text, the others read from chart). These are the online editions, except Le Matin Dimanche and RTS (19h30 and rts.ch).

What it measures matters for the label. It is **the tone of ballot coverage**, not the outlet's ideology; it mixes left-right with "government proposal or popular initiative", which its author says drives tone more than camp for most titles; its zero is the media average (–4), not the political centre; and nearly all French-speaking titles sit within a few points of that average, which the fög reads as "politiquement équilibrée". It has **no value for Le Nouvelliste, Arcinfo, La Liberté, Le Quotidien Jurassien, La Côte, Le Courrier, watson, Heidi.news or Blick romand**. The study PDF is "Copyright fög" with no open licence.

The other options measure something else: the Reuters report gives trust and reach by brand, not leaning; the fög yearbook scores quality, not politics; an outlet's own charter is its self-description (Le Courrier: "journal d'opinion", "indépendance ne veut pas dire neutralité"); rating sites have no readable method.

### Implication for ADRs

- **Future ADR "Sources of media facts":** if a leaning is shown, it is the fög index with its own label (for example "Tonalité de la couverture des votations fédérales, fög / Université de Zurich, 61 votations 2018 à 2025") and the media average beside it, never "gauche" or "droite" as a property of the outlet; every title outside the index shows nothing rather than a guess.
- **Owner decision (leaning):** show the fög index with its label, show only ownership, or show the outlet's self-declared line where it states one. The data does not support a left-right badge per medium.

---

<a id="q4"></a>
## Q4: Has anyone in Switzerland already built something like this (media ownership, media leaning, links to lobbies), and what can the site link to instead of rebuilding?

### Context

The owner asked to see what already exists before building. If a maintained Swiss source already shows media ownership or lobby ties, the site's value is to link to it in French with context, not to copy it.

### Sources consulted

| Source | URL | Type | Last verified | Confidence | Key quote / finding |
|---|---|---|---|---|---|
| Medienmonitor Schweiz | [medienmonitor-schweiz.ch/beteiligungen/](https://www.medienmonitor-schweiz.ch/beteiligungen/) | OFCOM-commissioned study | 2026-11-17 | ★★★★ | Maintained since 2017; ownership charts per group; "Klicken Sie sich durch die Besitz- und Beteiligungsverhältnisse im Schweizer Medienmarkt." The only maintained Swiss view of who owns what (see Q1). |
| Wikipedia, "Liste de journaux en Suisse" | [fr.wikipedia.org](https://fr.wikipedia.org/wiki/Liste_de_journaux_en_Suisse) | Encyclopaedia | 2026-11-17 | ★★ | Read by the prior-art pass: a "Propriétaire" column in the French-language daily tables, many cells empty; no leaning. CC BY-SA. |
| CORRECTIV.Schweiz, "Unheimliche Meinungsmacher" (14.03.2025) | [correctiv.org](https://correctiv.org/medien/2025/03/14/unheimliche-meinungsmacher-blocher-zeitung-svp-schneider-nica/) | Investigative article | 2026-11-17 | ★★ | Read by the prior-art pass: one-off investigation of free papers in German-speaking Switzerland. |
| Euromedia Ownership Monitor, RSF / Global Media Registry Media Ownership Monitor | [media-ownership.eu](https://media-ownership.eu/), [mom-gmr.org](https://www.mom-gmr.org/en/countries/) | Research monitors | 2026-11-17 | ★★★ | Read by the prior-art pass: neither covers Switzerland. |
| fög positioning study | see Q3 | University research | 2026-11-17 | ★★★★ | The only Swiss left-right placement of outlets; published as a study and a factsheet, not as a public tool. |
| Lobbywatch, data site | [daten.lobbywatch.ch/fr](https://daten.lobbywatch.ch/fr) | Independent association, own data | 2026-11-17 | ★★★ | Pages per organisation and per interest group with numeric ids, checked: [daten.lobbywatch.ch/fr/organisation/47/…](https://daten.lobbywatch.ch/fr/organisation/47/Union%20Suisse%20des%20Paysans) (title "Union Suisse des Paysans – Lobbywatch.ch") and [/fr/lobbygruppe/85/…](https://daten.lobbywatch.ch/fr/lobbygruppe/85/Agriculture%20en%20g%C3%A9n%C3%A9ral) both return 200; the same paths on `lobbywatch.ch` return 404. |
| Lobbywatch, data export | [lobbywatch.ch/datenexport/](https://lobbywatch.ch/datenexport/) | Same | 2026-11-17 | ★★★ | "Lobbywatch stellt Daten unserer Datenbank (DB) für eigene Auswertungen zur Verfügung. Die Daten werden wöchentlich aus unserer Datenbank exportiert." The licence (CC BY-SA 4.0 according to the prior-art pass) is left to Research-0004. Covers federal parliamentarians only. |
| "Intérêts des parlementaires" browser extension (Le Temps with Blick) | [addons.mozilla.org](https://addons.mozilla.org/de/firefox/addon/parliament-interests/) | Browser extension | 2026-11-17 | ★★ | Read by the prior-art pass: "Diese Erweiterung zeigt Interessenbindungen von Parlamentarierinnen und Parlamentarier anhand Daten von Lobbywatch."; last version 23.12.2019, abandoned. The only voter tool found built on Lobbywatch. |
| easyvote, smartvote | [easyvote.ch/fr](https://www.easyvote.ch/fr), [smartvote.ch/fr](https://www.smartvote.ch/fr/) | Civic portals | 2026-11-17 | ★★★ | Read by the prior-art pass: ballot explanations and voting advice; neither shows media ownership nor links to Lobbywatch. |

### Finding

**Nobody offers the combined idea, and nothing does it in French for voters.** The pieces exist separately: Medienmonitor (OFCOM) shows who owns which media, in German-first charts aimed at media-policy readers; the fög published a left-right index of 23 outlets as a study, not as a tool; Lobbywatch publishes the interest ties of federal parliamentarians with one page per organisation and per interest group. The international ownership monitors do not cover Switzerland. The only voter-facing tool that linked to Lobbywatch (a 2019 browser extension by Le Temps and Blick) is abandoned. The civic portals (easyvote, smartvote) cover neither media nor lobbies.

Interpretation, flagged as such: the site's value is a short French page that names, for each covered medium, its owner with a dated source and a link to the Medienmonitor chart, and later sends a voter to the Lobbywatch page of an organisation or interest group, rather than rebuilding either dataset.

### Implication for ADRs

- **Future ADR "Sources of media facts":** link to the source page (Medienmonitor group page) next to each owner line, as party cards link to their sources.
- **Research-0004 (Lobbywatch):** links go to `daten.lobbywatch.ch/fr/organisation/<id>/…` and `/fr/lobbygruppe/<id>/…`, not `lobbywatch.ch`; check the licence, whether the ids are stable, and that the host passes the external-link check (US-11).

---

<a id="q5"></a>
## Q5: What do the reuse terms and the personal-data rule of PRD-0001 §3 allow the site to show?

### Context

PRD-0001 §3 limits people to "name, party, canton and function only". Media owners are often companies, but several are families or named individuals, and Medienmonitor prints names with percentages. Each source also has its own reuse terms, which the site must respect as it did for the Parliament's terms (Research-0002).

### Sources consulted

| Source | URL | Type | Last verified | Confidence | Key quote / finding |
|---|---|---|---|---|---|
| PRD-0001 §3 Non-Goals | [prd-0001](../../product-specs/prds/prd-0001-swiss-politics-launcher.md#3-non-goals) | Project rule | 2026-11-17 | n/a | "People are shown with name, party, canton and function only: no photo, address, date of birth or contact, even when a source provides them." |
| Medienmonitor, "Übrige Medienmarken und Beteiligte" | [/beteiligungen/uebrige-beteiligungen/](https://www.medienmonitor-schweiz.ch/beteiligungen/uebrige-beteiligungen/) | OFCOM-commissioned study | 2026-11-17 | ★★★★ | Named individuals with shares, for example "La Télé Vaud Fribourg TV SA - Piller Damien (46.71%) - Commune de Lausanne (21.85%)"; "Léman Bleu TV Léman Bleu SA - Barbier-Mueller Stéphane (50.75%) - Hersant Philippe (24.66%) - Ville de Genève (17,06 %)"; "Radio Lac Overshop Holding SA - Antoine de Raemy (100%)". |
| Medienmonitor, imprint | [/impressum/](https://www.medienmonitor-schweiz.ch/impressum/) | Same | 2026-11-17 | ★★★★ | "Jede Veröffentlichung oder Verbreitung, auch auszugsweise, ist nur unter Quellenangabe gestattet." |
| fög study 2023 | [JB_2023_Studie_III_AB_final.pdf](https://www.foeg.uzh.ch/dam/jcr:9b6b8973-92ed-4e00-8d75-c7a5e7024a99/JB_2023_Studie_III_AB_final.pdf) | University research | 2026-11-17 | ★★★★ | "Copyright fög – Forschungszentrum Öffentlichkeit und Gesellschaft / Universität Zürich"; no licence for reuse of the values. The 2026 factsheet was not checked for a licence line. |
| TX Group annual report 2025 | [report.tx.group/2025](https://report.tx.group/2025/ar/en/group-structure-and-shareholders) | Company statement | 2026-11-17 | ★★★★ | Read by the ownership pass: names individual members of the founding family in the shareholders' pool. |

### Finding

**Owners are often people.** TX Group is controlled by a founding-family pool whose members are named in its annual report; Ringier says its family holds 75 %; Medienmonitor names individuals with percentages for several French-speaking broadcasters (La Télé, Léman Bleu, Radio Lac, LFM). A media owner is not a function in PRD-0001's sense (the rule was written for office holders), so naming them is a new kind of personal data and needs an owner ruling.

**Reuse terms allow citing, not republishing as open data.** Medienmonitor allows publication "nur unter Quellenangabe"; the fög study is "Copyright fög" without a licence. Showing a short fact (an owner, one index value) with the source named and a link fits a citation; copying a whole chart or table into the site does not obviously fit and is unnecessary if the site links to the source.

### Implication for ADRs

- **Owner decision (people):** either stop the owner line at a company, public body, association, foundation or "famille <nom>" (no individual names), or extend the PRD-0001 §3 rule to "owner of a medium" with name and share only. The first keeps the current rule unchanged.
- **Future ADR "Sources of media facts":** each media fact carries its source and check date, the site shows short facts with a link and never reproduces a chart, and the footer names Medienmonitor (OFCOM / Publicom) and the fög where used.

---

## Findings summary (citable from ADRs)

| Q | Finding (one sentence) | Confidence | Feeds |
|---|---|---|---|
| Q1 | Medienmonitor Schweiz (OFCOM, Publicom) is the one source that names the owner of each of about 180 Swiss brands, including the French-speaking dailies, RTS and the regional broadcasters, but it is HTML only, reusable only with attribution and disclaims accuracy; official sources cover only slices (concession holders, aggregate open data). | ★★★★ | Future ADR on media sources; owner decision on scope |
| Q2 | No public official register names the shareholders of a Swiss SA (ORC art. 45, CO art. 686, LTPM access for authorities only); only listed TX Group has statute-backed disclosure, so for other titles the owner rests on Medienmonitor or the company's own words. | ★★★★★ | Future ADR on media sources |
| Q3 | No CHES-like source exists; the fög index (61 ballots 2018 to 2025) places seven French-speaking titles between –11 and –2 around a media average of –4, but measures the tone of ballot coverage, not ideology, and covers no regional title. | ★★★★ | Owner decision on leaning; future ADR on media sources |
| Q4 | Nobody combines media ownership, leaning and lobby links for voters, and nothing does it in French; Medienmonitor, the fög study and Lobbywatch (`daten.lobbywatch.ch`) each cover one piece and can be linked. | ★★★ | Future PRD; Research-0004 |
| Q5 | Several owners are families or named individuals (TX Group pool, Ringier, La Télé, Léman Bleu), which PRD-0001 §3 does not cover, and the sources allow citation with attribution, not republication. | ★★★★ | Owner decision on people; PRD-0001 §3 |

---

## Recommendation

One line: show for each covered medium its publishing company and owning group with a dated Medienmonitor (or TX Group) source and a link, stop at companies, public bodies and "famille <nom>", and do not show a left-right badge; if the owner wants a political indicator, show the fög index under its own label, with the media average, for the seven titles it covers only.

### Owner decisions needed

To be presented one at a time, with the material above:

1. **Scope:** which media are in (the dailies and RTS only; or also the regional radio and TV stations; or also online-only titles such as watson and Heidi.news).
2. **Leaning:** fög index with its label for the seven covered titles; or ownership only; or the outlet's self-declared line where it states one.
3. **People as owners:** stop at companies, public bodies and families; or name individual owners with their share.
4. **PRD:** a new PRD-0002 "Transparency" (media, then lobbies), or new stories in PRD-0001.

### Owner rulings (2026-11-17)

1. **Leaning: the fög index, shown with care and kept up to date.** For the titles the fög covers, the site shows the fög score under the fög's own label (tone of the coverage of federal ballots, fög / University of Zurich, with the number of ballots and the period), with the media average beside it, the source and the check date; it is never turned into a "gauche" or "droite" badge. The score is stored as a sourced fact in the data and updated when the fög publishes new figures. A title the fög does not cover shows nothing (see ruling 2 for the list of titles). A measurement of the site's own (articles reported by visitors, or articles ingested and rated step by step) is a later idea, out of phase 1: it would need its own published method to meet PRD-0001 goal 2, and visitor reports would need a backend the site does not have (PRD-0001 §3).
2. **Scope: everything Medienmonitor covers in the six cantons, plus titles whose publisher is sourced.** The dailies, RTS, the regional TV stations, the radios and the online titles that Medienmonitor lists for GE, VD, VS, NE, JU and FR. A title Medienmonitor omits (La Gruyère, Journal de Morges and others) comes in when its publishing company can be sourced. Each title carries two separate lines: **"Éditeur"**, the publishing company, sourced to the commercial register (Zefix linked data, read without credentials through `lindas.admin.ch`; checked on 2026-11-17: [St-Paul Holding SA](https://register.ld.admin.ch/zefix/company/1024186) and [St-Paul Médias SA](https://register.ld.admin.ch/zefix/company/1517023) carry name, legal form, seat, purpose and UID, but no persons, no shareholders and no link between the two) together with the title's own imprint for the link between title and company; **"Propriétaire"**, shown only when a source names it (Medienmonitor, TX Group's annual report, the partners of a Sàrl in the register), and absent otherwise.
3. **People as owners: named, with their share, under four conditions.** A media owner who is a person is shown with name and share exactly as the source publishes them, with the source, the check date and a link; nothing else about the person (no photo, age, address or contact); a "signaler une erreur" path to correct or remove on request, since processing against the person's expressed will is an infringement ([LPD art. 30 al. 2 let. b](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2022/491/20250707/fr/html/fedlex-data-admin-ch-eli-cc-2022-491-20250707-fr-html-1.html)) and the data must be accurate and correctable (art. 6 al. 5, art. 32); and the 180-day staleness warning used for party presidencies. Basis read on 2026-11-17: "En règle générale, il n'y a pas atteinte à la personnalité lorsque la personne concernée a rendu les données personnelles accessibles à tout un chacun et ne s'est pas opposée expressément au traitement" (art. 30 al. 3), otherwise justification "par un intérêt privé ou public prépondérant" (art. 31 al. 1); reading media ownership as such an interest is this note's interpretation, not legal advice. The PRD-0001 §3 rule is extended to "media owners: name and share, as published by the source". This overrides the Recommendation's "stop at companies".
4. **Specification: new stories in PRD-0001** (from US-20), not a separate PRD, so the product stays specified in one document. The phase 2 (lobbies) stories follow in the same PRD.
5. **An ownership graph.** The owner wants a picture of the groups that own the media: who holds which company, which company publishes which title. Its form (one tree per group or one network of all groups) is to be chosen on a mockup with real data; each link carries its share and its source, as the facts do.

### Open items (to file once the ledger exists)

- decision-gap, `#q3`: a measurement of the site's own for titles the fög does not cover (visitor reports or step-by-step article ingestion), raised by the owner on 2026-11-17 as a later idea; needs a method, and a backend for visitor input.

The repository has no central open-items ledger yet (PRD-0001 §9), so the gaps found here are listed for filing:

- doc-gap, `#q1`: read the OFCOM RTV database (JavaScript application) in a browser to see whether it names concession holders' shareholders and can be exported.
- doc-gap, `#q1`: check whether OFCOM has its own terms of use beyond the admin.ch terms, and whether Medienmonitor offers a French version of each group page to link to.
- doc-gap, `#q2`: reconcile the owner of Le Quotidien Jurassien (Medienmonitor "Groupe Démocrate Media Holding SA (100%)" against the RJB letter of 29.09.2025), and find ESH Médias' shareholders from any source.
- doc-gap, `#q2`: open TX Group's SIX disclosure notifications directly (the SIX search is JavaScript only).
- doc-gap, `#q3`: read the fög codebook (doi:10.5167/uzh-236162, the repository refused the automated fetch) and check the licence line of the 2026 factsheet.
- doc-gap, `#q4`: Lobbywatch licence, id stability and deep-link terms, in Research-0004.

---

## Decisions Anchored

_(empty until Mode 4 Freeze)_

---

## Consolidated sources

### Statutes (Fedlex)

- [Ordinance on the commercial register, RS 221.411, version of 1.10.2026](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2007/686/20261001/fr/html/fedlex-data-admin-ch-eli-cc-2007-686-20261001-fr-html.html)
- [Code of obligations, RS 220, version of 1.10.2026](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/27/317_321_377/20261001/fr/html/fedlex-data-admin-ch-eli-cc-27-317_321_377-20261001-fr-html-4.html)
- [Federal Act on the Transparency of Legal Entities, RS 955.3](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2026/323/20261001/fr/html/fedlex-data-admin-ch-eli-cc-2026-323-20261001-fr-html-1.html)
- [Financial Market Infrastructure Act, RS 958.1](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2015/853/20240201/fr/html/fedlex-data-admin-ch-eli-cc-2015-853-20240201-fr-html-5.html)

### Federal official sources and commissioned studies

- [Medienmonitor Schweiz, ownership database](https://www.medienmonitor-schweiz.ch/beteiligungen/), [other brands](https://www.medienmonitor-schweiz.ch/beteiligungen/uebrige-beteiligungen/), [ESH Médias](https://www.medienmonitor-schweiz.ch/beteiligungen/esh/), [method](https://www.medienmonitor-schweiz.ch/methodik/), [imprint](https://www.medienmonitor-schweiz.ch/impressum/), [factsheet VD FR VS 2024](https://www.medienmonitor-schweiz.ch/uploads/media/default/0001/02/MMS24_VaudFribourgValais-de.pdf)
- [OFCOM, broadcasting concessions 2025 to 2034](https://www.bakom.admin.ch/fr/octroi-des-concessions-de-diffusion-pour-la-periode-2025-a-2034), [DETEC decision Radio Rhône](https://www.bakom.admin.ch/dam/fr/sd-web/UcDCUgTE7zd7/radio-rhone-verfuegung.pdf), [letter RJB SA](https://www.bakom.admin.ch/dam/de/sd-web/N72jWSlCUBw5/Gesuch%20RJB.pdf), [RTV database](https://rtvdb.ofcomnet.ch/fr)
- [OFCOM open data, print ownership](https://ckan.opendata.swiss/api/3/action/package_show?id=ubersicht-der-eigentumsverhaltnisse-von-printmedienangeboten), [opinion power of media groups](https://ckan.opendata.swiss/api/3/action/package_show?id=meinungsmacht-von-medienkonzernen)
- [Zefix PublicREST API](https://www.zefix.admin.ch/ZefixPublicREST/v3/api-docs)

### University research

- [fög, Rolle der SRG SSR im Mediensystem der Schweiz, 2026](https://www.foeg.uzh.ch/dam/jcr:33f99533-ff1a-4594-9d10-5fe0b3afb8f0/SRG_Rolle_2026_2.pdf)
- [Udris 2023, Jahrbuch Qualität der Medien, Studie III](https://www.foeg.uzh.ch/dam/jcr:9b6b8973-92ed-4e00-8d75-c7a5e7024a99/JB_2023_Studie_III_AB_final.pdf), [press release FR 25.09.2023](https://www.foeg.uzh.ch/dam/jcr:5936e3ee-bec4-4e93-8cf7-1d6110b9190b/MM_Positionierung_FR.pdf)
- [fög Abstimmungsmonitor June 2026](https://www.foeg.uzh.ch/dam/jcr:79651592-5bab-4bc5-ab71-fff58062e3c1/Abstimmungsmonitor_Juni_2026.pdf), [Jahrbuch 2026](https://www.foeg.uzh.ch/dam/jcr:f6cf75d4-fdeb-450c-90e2-dd42241d93af/JB_2026_Gesamt_202610015.pdf)
- [Reuters Institute Digital News Report 2026, Switzerland](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/switzerland)
- [EUI CMPF Media Pluralism Monitor 2025](https://cmpf.eui.eu/mpm-2025-results/), [Euromedia Ownership Monitor](https://media-ownership.eu/), [RSF / GMR Media Ownership Monitor](https://www.mom-gmr.org/en/countries/)

### Industry bodies

- [Médias Suisses](https://mediassuisses.ch/), [WEMF/REMP circulation bulletin 2026](https://remp.ch/media/remp.ch/media/remp_bulletin_tirages.pdf)

### Companies and outlets (self-published)

- [TX Group annual report 2025](https://report.tx.group/2025/ar/en/group-structure-and-shareholders), [Ringier, 03.02.2020](https://www.ringier.com/ringier-and-la-mobiliere-strengthening-their-partnership/), [Le Courrier, NAC](https://lecourrier.ch/nac/), [Le Courrier, editorial charter](https://lecourrier.ch/charte-redactionnelle/)

### Civic projects and prior art

- [Lobbywatch data site](https://daten.lobbywatch.ch/fr), [Lobbywatch data export](https://lobbywatch.ch/datenexport/), ["Intérêts des parlementaires" extension](https://addons.mozilla.org/de/firefox/addon/parliament-interests/), [easyvote](https://www.easyvote.ch/fr), [smartvote](https://www.smartvote.ch/fr/)

### Press, encyclopaedia and rating sites

- [Wikipedia, Liste de journaux en Suisse](https://fr.wikipedia.org/wiki/Liste_de_journaux_en_Suisse), [CORRECTIV.Schweiz, 14.03.2025](https://correctiv.org/medien/2025/03/14/unheimliche-meinungsmacher-blocher-zeitung-svp-schneider-nica/), [Media Bias/Fact Check](https://mediabiasfactcheck.com/le-temps-bias-and-credibility/), [AllSides](https://www.allsides.com/media-bias/ratings)

---

## Changelog

| Date | Author | Mode | Change summary |
|---|---|---|---|
| 2026-11-17 | Victor Hueni (Claude) | Scaffold + Fill | Created and filled in one pass. Step 0 answers taken from the precedent of Research-0001 and 0002: no ADR yet (1B), custom list of 5 questions (2D), deep verification on primary sources (3B), every load-bearing source re-read directly on 2026-11-17 (4B; rows read only by a research pass say so). Not readable: OFCOM RTV database (JavaScript), SIX disclosure search (JavaScript), letemps.ch, tx.group and srgssr.ch (403), the fög codebook repository. Correction to a research pass: Lobbywatch pages live on `daten.lobbywatch.ch`, not `lobbywatch.ch`. Status: Draft until the owner rules on the four decisions listed in the Recommendation. |
| 2026-11-17 | Victor Hueni (Claude) | Fill | Owner rulings 1 to 5 recorded (fög index shown under its own label; scope with separate "Éditeur" and "Propriétaire" lines; owners named with their share under four conditions, LPD art. 6, 30, 31, 32 read; stories in PRD-0001; an ownership graph to be chosen on a mockup). Zefix linked data checked on `lindas.admin.ch` for St-Paul Holding SA and St-Paul Médias SA. |
