---
type: Architecture Research Note
title: "Research-0004: Sources for lobbies, interest ties and political financing"
description: Which sources can tell a voter in French-speaking Switzerland, with a source and a date, which interests their federal and cantonal representatives are tied to, who holds access badges to the Federal Palace, and who finances the campaigns of the next ballot; what reuse terms apply; and what the Lobbies page of the Transparence area could show.
resource: https://github.com/VictorHueni/civic-compass
tags: [civic-compass, transparency, lobbies, lobbywatch, interest-ties, access-badges, political-financing, cdf]
timestamp: 2026-11-18T22:00:00Z
status: draft
owner: Victor Hueni
last_reviewed: 2026-11-18
review_interval: 90d
---

<!-- doc-version: 1.0 | created: 2026-11-18 | last-verified: 2026-11-18 -->

# Research-0004: Sources for lobbies, interest ties and political financing

**Status:** Draft
**Date:** 2026-11-18
**Author:** Victor Hueni (desk research by Claude)
**Last verified:** 2026-11-18
**Feeds ADRs:** none yet. Feeds phase 2 of the Transparence area (PRD-0001 §2, "Lobbies (phase 2 of the transparency area). Links to Lobbywatch come in later stories of this PRD, after Research-0004."), and the stories that will specify it in PRD-0001 (owner ruling 4 of [Research-0003](0003-media-ownership-and-leaning-sources.md)). A future ADR "Sources of lobby and financing facts" would cite §Findings summary.
**Superseded by:** -

<!--
LIFECYCLE LEGEND
  Draft     : actively populating; ADRs should not cite yet
  Active    : content complete enough for ADR citation; further updates allowed
  Frozen    : feeding ADRs have landed; further edits only via Mode 3 Refresh
  Superseded: replaced by a newer research file; `Superseded by:` link mandatory
-->

On 2026-11-17 the owner set phase 2 of the Transparence area: let a voter see the lobbies, first by sending them to Lobbywatch ([Research-0003](0003-media-ownership-and-leaning-sources.md) §Q4). On 2026-11-18 the owner asked for this research on the potential sources, then a proposal of what the site could show. The project rules apply to every new fact: no fact without a recorded source and a check date, unknown shown as unknown (PRD-0001 goal 2); people shown with name, party, canton and function only (PRD-0001 §3); a static site with no backend and no tracking; French for voters in GE, VD, VS, NE, JU and FR.

**How confidence is rated here.** Same mapping as Research-0001 to 0003. ★★★★★: a statute, or the body that holds the official record publishing it, read directly. ★★★★: official data read directly but used second-hand (a count we derive, a machine interface whose terms are not stated). ★★★: an independent association's own data or statements about itself. ★★: press, encyclopaedias, blogs. Rows read only by a research pass, not re-read by the author, say so; the three load-bearing sources (the CDF campaign export, the Parliament's `PersonInterest` data, the Lobbywatch licence) were re-read directly on 2026-11-18.

---

## Questions index

1. [Q1](#q1): What does Lobbywatch hold, how fresh and how verified is it, how can the site reach it, and on what terms?
2. [Q2](#q2): Do official federal sources publish the interest ties of federal parliamentarians and the holders of access badges, and in a structured form the site can read?
3. [Q3](#q3): Does an official source publish who finances the campaigns of a federal ballot, in time for the voter, and in a form the site can read?
4. [Q4](#q4): What do the six French-speaking cantons publish on their own MPs' interests, lobby access and political financing?
5. [Q5](#q5): What already exists for voters, and what do the reuse terms and the personal-data rule allow the site to show?

---

<a id="q1"></a>
## Q1: What does Lobbywatch hold, how fresh and how verified is it, how can the site reach it, and on what terms?

### Context

Lobbywatch was the owner's starting point for phase 2. Before linking or reusing it, the site needs to know its coverage (federal only, or cantons too), how it checks its facts, how often it is updated, whether its data can be read without credentials, whether its French pages can be deep-linked with stable ids, and whether its licence binds the site.

### Sources consulted

| Source | URL | Type | Last verified | Confidence | Key quote / finding |
|---|---|---|---|---|---|
| Lobbywatch, data export page | [lobbywatch.ch/datenexport/](https://lobbywatch.ch/datenexport/) | Association's own page | 2026-11-18 | ★★★ | "Die Exporte werden wöchentlich frühen Montagmorgen automatisch aktualisiert."; "GraphQL Datenschnittstelle: lobbywatch.ch/graphql". Formats: CSV, SQL, JSON, JSONL, XML, YAML, Markdown, GraphML, graph databases, SPARQL (`lod.lobbywatch.ch`). No login. |
| Lobbywatch, flat JSON export | [cms.lobbywatch.ch/…/lobbywatch_export_flat.json.zip](https://cms.lobbywatch.ch/sites/lobbywatch.ch/files/exports/lobbywatch_export_flat.json.zip) | Association's own data | 2026-11-18 (research pass) | ★★★ | 246 active parliamentarians (60 flagged `romandie`), 7,794 interest ties (1,354 `nicht-deklariert`), 385 access badges, 10,412 organisations, 139 lobby groups, 14 branches with French names. Current data only (every tie has `bis` = NULL). File dated 18.11.2026 01:32; newest tie updated 17.11.2026. |
| Lobbywatch, SQL export | [cms.lobbywatch.ch/…/lobbywatch_export.sql.zip](https://cms.lobbywatch.ch/sites/lobbywatch.ch/files/exports/lobbywatch_export.sql.zip) | Association's own data | 2026-11-18 (research pass) | ★★★ | `verguetung_transparent enum('ja','nein','teilweise')`; "NEIN=Minimaltransparenz (= gesetzliches Minimum, bezahlt/ehrenamtlich)"; ids: `id int(11) NOT NULL AUTO_INCREMENT COMMENT 'Technischer Schlüssel…'`. |
| Lobbywatch, data leaflet (16.12.2019) | [lobbywatch_daten_merkblatt.pdf](https://cms.lobbywatch.ch/sites/lobbywatch.ch/files/exports/lobbywatch_daten_merkblatt.pdf) | Association's own terms | 2026-11-18 (research pass) | ★★★ | "Die Daten werden grundsätzlich unter der Creative Commons Namensnennung - Weitergabe unter gleichen Bedingungen 4.0 International Lizenz (CC BY-SA) zur Verfügung gestellt… Wenn Lobbywatch eine Quelle unter vielen ist, trifft dieser Punkt nicht zu, wenn wir jedoch die Hauptquelle sind, muss das Resultat selbst als CC-BY-SA zur Verfügung gestellt werden." / "Historisierte Daten … sind Copyright-geschützt." |
| Lobbywatch, data site footer (French) | [daten.lobbywatch.ch/fr/parlamentarier/44](https://daten.lobbywatch.ch/fr/parlamentarier/44) | Association's own page | 2026-11-18 | ★★★ | Re-read directly: footer names "Creative Commons BY-SA"; the research pass quotes "Le contenu de Lobbywatch.ch est disponible sous licence … Attribution - Partage dans les mêmes conditions 4.0 International". |
| Lobbywatch, research method | [lobbywatch.ch/wie-wir-recherchieren/](https://lobbywatch.ch/wie-wir-recherchieren/) | Association's own page | 2026-11-18 (research pass) | ★★★ | "Mit eigens entwickelten Applikationen gleichen wir die OSINT-Daten mit den offiziellen Deklarationen des Parlaments ab"; entries are "den betreffenden Personen zur Autorisierung vorgelegt"; "Lobbywatch kantonal: Auch Kantone offenlegen" listed as future work. |
| Lobbywatch, about us | [lobbywatch.ch/ueber-uns/](https://lobbywatch.ch/ueber-uns/) | Association's own page | 2026-11-18 (research pass) | ★★★ | "Unser Team besteht aus investigativen Journalist:innen, IT-Expert:innen und Freiwilligen."; "Der Verein Lobbywatch.ch wird von über 500 Mitgliedern getragen." |
| Lobbywatch, website code | [github.com/lobbywatch/website](https://github.com/lobbywatch/website) | Association's code | 2026-11-18 (research pass) | ★★★ | Routes `parlamentarier`, `organisation`, `lobbygruppe`, `branche`, `zutrittsberechtigter`, each `/<id>/[[...name]]` (the name is optional and ignored); BSD-3-Clause; last push 15.11.2026. |
| Lobbywatch, effectiveness rating | [daten.lobbywatch.ch/fr/wirksamkeit](https://daten.lobbywatch.ch/fr/wirksamkeit) | Association's own page | 2026-11-18 (research pass) | ★★★ | Lobby groups rated hoch/mittel/gering: "Für den Einflussfaktor « hoch », muss die Lobbyorganisation immer oder punktuell an Gesetzesrevisionen mitarbeiten". The page is in German under `/fr`. |
| Lobbywatch, transparency report (30.12.2025) | [lobbywatch.ch/transparenz-im-schweizer-parlament-…](https://lobbywatch.ch/transparenz-im-schweizer-parlament-nur-jedes-vierte-ratsmitglied-legt-alle-einkuenfte-offen/) | Association's own analysis | 2026-11-18 (research pass) | ★★★ | "nur 27 Prozent machen alle ihre Einkünfte transparent. Und 44 Prozent der Parlamentsmitglieder legen gar nichts offen." |

Deep links checked by the research pass with curl on 2026-11-18: `/fr/parlamentarier/44/Céline Amaudruz` 200 ("Céline Amaudruz – Lobbywatch.ch"), `/fr/organisation/47` 200 ("Union Suisse des Paysans"), `/fr/lobbygruppe/85` 200 ("Agriculture en général"), `/fr/branche/15` 200 ("Agriculture"), `/fr/zutrittsberechtigter/84` 200, `/fr/zutrittsberechtigter/90` **500**, `/fr/parlamentarier/999999` 404.

### Finding

**Lobbywatch is the only maintained, structured source of federal interest ties beyond the official declaration, and it can be read freely.** It covers the federal Parliament only (cantons are listed as future work). It adds to the official register what the law does not require: amounts of remuneration where known, ties it found but that were not declared (1,354 marked `nicht-deklariert`), relations between organisations, a classification into 14 branches and 139 lobby groups, and its own ratings (disclosure per parliamentarian, effectiveness per lobby group). Each entry is checked against open sources and sent to the parliamentarian for authorisation (231 of 246 authorised). The export is refreshed weekly and was current on 2026-11-18; the association is active (blog posts in November 2026, code pushed the same week, more than 500 members).

**Deep links in French work and the ids look stable.** `daten.lobbywatch.ch/fr/<type>/<id>` serves French pages; ids are database primary keys, so they are likely stable, but this is interpretation: no promise was found. A parliamentarian's Lobbywatch id differs from the Parliament's number, and the export carries both (`parlament_number`), so the site can map them. An unknown guest id answers 500, not 404, which the link check (US-11) would report as broken rather than missing.

**The licence binds the site only if Lobbywatch becomes its main source.** The data is CC BY-SA 4.0 with attribution; the leaflet says share-alike applies when Lobbywatch is the main source of a result. The site's code is MIT; a page whose facts come mainly from Lobbywatch would have to be offered under CC BY-SA. Linking to Lobbywatch pages carries no such duty. Lobbywatch's own ratings (effectiveness, disclosure) are its judgment, not facts with an official source.

### Implication for ADRs

- **Future ADR "Sources of lobby and financing facts":** link to `daten.lobbywatch.ch/fr/…` for depth rather than copy; if the site copies Lobbywatch data (branches, lobby groups, amounts), the copied content carries "Source : Lobbywatch.ch, CC BY-SA 4.0" and is offered under that licence; Lobbywatch's ratings are not shown as facts.
- **Link check (US-11):** a Lobbywatch guest page that answers 500 must not fail the run silently as "broken" without a manual look; keep guest pages out of the links, or treat that host's 500 like `UNSTABLE_SERVERS`.

---

<a id="q2"></a>
## Q2: Do official federal sources publish the interest ties of federal parliamentarians and the holders of access badges, and in a structured form the site can read?

### Context

The project prefers the body that holds the official record (★★★★★) to a second-hand source. The Federal Assembly keeps by law a register of its members' interests and a register of the people each member lets into the Palace. The site already reads the Parliament's new API with a key on the maintainer's machine (`npm run parliament`, PRD-0001 §8 "The Parliament API key stays off CI").

### Sources consulted

| Source | URL | Type | Last verified | Confidence | Key quote / finding |
|---|---|---|---|---|---|
| LParl art. 11 and art. 69 (RS 171.10, consolidated 2.3.2026) | [fedlex.data.admin.ch … 2003/510 … fr-html-4](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2003/510/20260302/fr/html/fedlex-data-admin-ch-eli-cc-2003-510-20260302-fr-html-4.html) | Statute | 2026-11-18 (research pass) | ★★★★★ | art. 11 al. 1bis: "il précise s'il le fait à titre bénévole ou si l'activité concernée est rémunérée. Les défraiements ne sont pas pris en compte." (in force since 2.12.2019); al. 2: "Les Services du Parlement établissent un registre public"; art. 69 al. 2: "Le nom et les fonctions de ces personnes font l'objet d'une inscription dans un registre accessible au public." |
| Register of interests, Conseil national / Conseil des États | [interessen-nr.pdf](https://www.parlament.ch/centers/documents/de/interessen-nr.pdf), [interessen-sr.pdf](https://www.parlament.ch/centers/documents/de/interessen-sr.pdf) | Official PDF | 2026-11-18 (research pass) | ★★★★★ | "Stand / état / stato: 02.11.2026"; columns organisation, legal form, body, function, paid or unpaid. |
| Register of accredited persons, Conseil national / Conseil des États | [zutrittsberechtigte-nr.pdf](https://www.parlament.ch/centers/documents/de/zutrittsberechtigte-nr.pdf), [zutrittsberechtigte-sr.pdf](https://www.parlament.ch/centers/documents/de/zutrittsberechtigte-sr.pdf) | Official PDF | 2026-11-18 (research pass) | ★★★★★ | "Registre des accrédités … Stand / état / stato: 02.11.2026"; per member, each holder with a category: personal staff, guest, or "Représentant/e de milieux intéressés" with the organisation. |
| Parliament OData service, `PersonInterest` | [ws.parlament.ch/odata.svc/PersonInterest](https://ws.parlament.ch/odata.svc/PersonInterest?$top=1&$filter=Language%20eq%20'FR'&$format=json) | Official machine-readable data, no key | 2026-11-18 | ★★★★ | Re-read directly: `$count` with `Language eq 'FR'` returns **2015**; fields include `OrganizationTypeText`, `FunctionInAgencyText` ("Membre"), `InterestName`, `Paid`, `PersonNumber`, `Modified`. The research pass saw a record modified on 2026-11-18. Whether former members are included is not checked. |
| Parliament new API, OpenAPI document | [ws.parl.ch/doc/v3/api-docs](https://ws.parl.ch/doc/v3/api-docs) | Official machine-readable data, key needed | 2026-11-18 (research pass, document only) | ★★★★ | `PersonV1.interests` / `activeInterests` → `InterestV1 {designation, legalForm, function, isPaid, isAuthorityRepresentation, body, start, end}`; `personsWithAccessAuthorisation {firstName, lastName, function, functionOrganisation}`. Not called. |
| Parliament, open data and web services | [parlament.ch … open-data-web-services](https://www.parlament.ch/fr/%C3%BCber-das-parlament/faits-donnees-chifrees/open-data-web-services) | Official terms | 2026-11-18 (research pass) | ★★★★★ | "La source doit impérativement être indiquée … «Services du Parlement de l'Assemblée fédérale, Berne»"; "Le contenu des données doit rester inchangé."; old services end at the latest in 2027 (`ws-old`) and 2028 (`ws`). |
| CIP-N report on 23.425 (6.9.2024) | [Rapport_de_la_commission_CIP-N_23.425](https://www.parlament.ch/centers/kb/Documents/2023/Rapport_de_la_commission_CIP-N_23.425_2024-09-06.pdf) | Committee report | 2026-11-18 (research pass) | ★★★★★ | "délivre depuis 2011 une carte d'accès au Palais fédéral à chaque canton"; "aucun registre recensant les autres personnes disposant d'un accès permanent". |
| Curia Vista 15.438 and 23.425, via OData `Business` | [ws.parlament.ch/odata.svc/Business … 15.438](https://ws.parlament.ch/odata.svc/Business?$filter=Language%20eq%20'FR'%20and%20BusinessShortNumber%20eq%20'15.438') | Official | 2026-11-18 (research pass) | ★★★★★ | 15.438: "Liquidé", "les trois parties du projet ont été refusées respectivement par 96 voix contre 82, 94 voix contre 81 et 94 voix contre 80"; 23.425: "09.09.2024 Conseil national Refusé de donner suite". |

### Finding

**Yes, and in structured form.** The law requires each federal parliamentarian to declare their ties and whether each is paid or unpaid (since 2.12.2019), and each member's two badge holders with their function. The Parliament publishes both registers as PDF per council (state of 2.11.2026) and the interests as structured data: the public OData service (`PersonInterest`, 2,015 French rows, with a `Paid` flag, no key) and the new API (`interests` with `isPaid`, key needed). The open-data terms allow reuse with the source named, unchanged content and the download date. The old OData service closes at the latest in 2028, so a lasting import should use the new API, which the site already calls.

**There is no lobbyist register.** The badge register lists only the people members invite (the research pass counted 195 "représentants de milieux intéressés" in the National Council and 43 in the Council of States from the 2.11.2026 PDFs: our own count, ★★★★). Parliament has refused every lobbying-transparency bill since 15.438 (rejected 2020; 23.425 refused 9.9.2024). The official register states no amounts; only Lobbywatch tries to.

### Implication for ADRs

- **Future ADR "Sources of lobby and financing facts":** the official interest ties come from the Parliament (new API, through the existing `npm run parliament` command, generated file never hand-edited), with "Services du Parlement de l'Assemblée fédérale, Berne" and the date; Lobbywatch is the link for depth, not the source of the tie.
- **Badge holders:** the official register names private persons (staff, guests); the site would show counts per category, or the organisations of the "représentants de milieux intéressés" only, never the persons' names (PRD-0001 §3).

---

<a id="q3"></a>
## Q3: Does an official source publish who finances the campaigns of a federal ballot, in time for the voter, and in a form the site can read?

### Context

Since 23.10.2022 federal law requires the financing of parties and of large campaigns to be disclosed. The site already has a ballot page for the next federal vote (29.11.2026, four items in `data/ballot.json`). A voter reading an item could see who pays for the yes and the no campaigns: the most direct link between money and the vote in front of them.

### Sources consulted

| Source | URL | Type | Last verified | Confidence | Key quote / finding |
|---|---|---|---|---|---|
| LDP art. 76b–76f (RS 161.1) | [fedlex.data.admin.ch … 1978/688 … fr-html-10](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/1978/688_688_688/20221023/fr/html/fedlex-data-admin-ch-eli-cc-1978-688_688_688-20221023-fr-html-10.html) | Statute | 2026-11-18 (research pass) | ★★★★★ | 76c: campaigns that "engagent plus de 50 000 francs"; 76d al. 1 let. b: "45 jours avant … recettes budgétisées"; 76f al. 2 let. b: published "au plus tard 15 jours après leur réception". Parties in the Federal Assembly: yearly accounts and donations above CHF 15,000 (76b). |
| OFipo (RS 161.18) | [fedlex.data.admin.ch … 2022/490 … fr-html-3](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2022/490/20221023/fr/html/fedlex-data-admin-ch-eli-cc-2022-490-20221023-fr-html-3.html) | Ordinance | 2026-11-18 (research pass) | ★★★★★ | art. 7: "Le contrôle fédéral des finances (CDF) est chargé"; art. 16: party data "au plus tard le 31 août"; art. 17: published "pendant 5 ans". |
| CDF portal on political financing | [politikfinanzierung.efk.admin.ch/app/fr/](https://politikfinanzierung.efk.admin.ch/app/fr/) | Official data | 2026-11-18 (research pass) | ★★★★★ | A tree "29.11.2026 …" with the actors of each item; 4 items, 3 to 6 actors each. Disclaimer: the CDF "ne garantit pas l'exactitude des données (art 15 al. 1 Ofipo)". |
| CDF export, AVS / TVA item (29.11.2026) | […/downloads/financings/33?with_budget=true](https://politikfinanzierung.efk.admin.ch/api/frontend/latest/fr/downloads/financings/33?with_budget=true) | Official data, XLSX | 2026-11-18 | ★★★★★ | Re-read directly: HTTP 200, XLSX of two sheets. Sheet 1 columns "Acteur/trice", "Type d'acteur", "Campagne", "Déclaration" ("Déclaration des recettes budgétées"), "Montant total des recettes (en CHF)", "Recettes provenant de libéralités monétaires (en CHF)", "Fonds propres monétaires (en CHF)"; actors include UDC and PLR ("Rejet de l'objet de la votation populaire") and USS ("Adoption de l'objet…"). Sheet 2 lists donations ("Déclaration de libéralités supérieures à 15 000 francs") with donor name or company, commune, value and date; first row: Swiss Life AG, Zürich, monetary, to the UDC campaign. |

### Finding

**Yes, officially, in time, and readable: this is the strongest source found.** For every federal ballot, each campaign spending more than CHF 50,000 must declare its budget 45 days before the vote, and the CDF publishes it within 15 days, so at the latest about 30 days before the vote (our reading of art. 76d and 76f). For 29.11.2026 the budgets of all four items are online, by actor, with the side each actor campaigns for, and the donations above CHF 15,000 with the donor's name. The documented download is one XLSX per item; the portal's JSON endpoints answer without a key but are undocumented. The CDF gives a disclaimer, not a licence; official acts are free of copyright (LDA art. 5), and data published under a legal duty is meant to be read. Party accounts are published yearly by 31 August.

**Limits.** Only campaigns above CHF 50,000 are covered; budgets are declared before the vote and final accounts after it, so the figure shown before the vote is a budget, not spending. Donors include natural persons with their commune.

### Implication for ADRs

- **Future ADR "Sources of lobby and financing facts":** campaign budgets per ballot item come from the CDF XLSX, imported by a command like `npm run media-register` (generated file, never hand-edited, source and retrieval date kept), shown as "budget déclaré" with the CDF as source and the date.
- **Personal data:** donors who are natural persons are published by the CDF; whether the site repeats their names or shows companies and organisations only, linking to the CDF for the rest, is an owner decision (§Recommendation).

---

<a id="q4"></a>
## Q4: What do the six French-speaking cantons publish on their own MPs' interests, lobby access and political financing?

### Context

The site covers GE, VD, VS, NE, JU and FR, and already shows each cantonal parliament's seats per party (US-14). Lobbywatch covers no canton. If cantons publish their MPs' interests or campaign financing, the site could link to them or reuse them.

### Sources consulted

All rows read by a research pass on 2026-11-18.

| Source | URL | Type | Last verified | Confidence | Key quote / finding |
|---|---|---|---|---|---|
| GE, LRGC art. 29A | [silgeneve.ch … rsg_b1_01](https://silgeneve.ch/legis/data/rsg_b1_01.htm) | Statute | 2026-11-18 | ★★★★★ | "registre que chacun peut consulter sur les fiches signalétiques des députés" |
| GE, "Liens d'intérêts (mars 2026)" | [Liens_interets_mars2026.pdf](https://ge.ch/grandconseil/data/courriers/Liens_interets_mars2026.pdf) | Official PDF | 2026-11-18 | ★★★★★ | One 31-page PDF by party, free text, no paid/unpaid field. |
| GE, LEDP art. 29A–29F | [silgeneve.ch … rsg_a5_05](https://silgeneve.ch/legis/data/rsg_a5_05.htm) | Statute | 2026-11-18 | ★★★★★ | "pour tous les dons de 5 000 francs ou plus, le montant"; 29F: "peuvent être consultés auprès de l'autorité compétente" (not published online). |
| VD, MP register (LGC art. 8–9) | [registres_interets_deputes/Meystre-307836.pdf](https://www.vd.ch/fileadmin/user_upload/organisation/gc/lmgc/registres_interets_deputes/Meystre-307836.pdf) | Official PDF | 2026-11-18 | ★★★★★ | "Le Bureau tient à jour le registre … Celui-ci est public."; one PDF per MP, undated; sampled files from 2019 and 2020. |
| VD, campaign financing publications (LEDP art. 25–26) | [vd.ch … publication-des-budgets-et-des-comptes-de-campagnes](https://www.vd.ch/etat-droit-finances/votations-et-elections/transparence-du-financement-de-la-vie-politique/publication-des-budgets-et-des-comptes-de-campagnes) | Official PDFs | 2026-11-18 | ★★★★★ | Budgets "30 jours avant le scrutin"; donations "supérieur à CHF 5'000.-"; PDFs from 2022 to 27.9.2026. |
| VD, motion 25_MOT_19 | [vd.ch … 25_MOT_19](https://www.vd.ch/gc/depute-e-s/detail-objet/objet/25_MOT_19/membre/620210) | Official | 2026-11-18 | ★★★★★ | "Lobbying, transparence et Grand Conseil", referred to committee 18.3.2025. |
| VS, government register | [vs.ch/web/gouvernement/mr](https://www.vs.ch/web/gouvernement/mr) | Official HTML | 2026-11-18 | ★★★★★ | Per member "Registre des intérêts", categories A–D, undated. MPs' register not seen (parlement.vs.ch is a JavaScript app). |
| VS, LcDP amendment (State release 31.3.2023, copy on a commune site) | [20230331-Com-ModificationLcDP.pdf](https://www.commune-evolene.ch/data/documents/20230331-Com-ModificationLcDP.pdf) | Official release, second-hand copy | 2026-11-18 | ★★★★ | Accounts and donors above CHF 5,000 communicated "à tout intéressé qui en fait la demande écrite, dans un délai de dix jours" (not published). |
| NE, OGC art. 39–40a (11.3.2026) | [OGC_commentee.pdf](https://www.ne.ch/sites/default/files/2026-03/OGC_commentee.pdf) | Statute | 2026-11-18 | ★★★★★ | art. 40: "Ce registre est public."; interests shown on each member's HTML profile, undated, no pay field. |
| NE, LDP (RSN 141) | [rsn.ne.ch … 141.pdf](https://rsn.ne.ch/DATA/program/books/rsne/pdf/141.pdf) | Statute | 2026-11-18 | ★★★★★ | art. 133h "5.000 francs et plus"; donor lists consulted at the Chancellery, not online. |
| JU, LOP art. 13 and register | [Registre des intérêts, octobre 2026](https://www.jura.ch/Htdocs/Files/v/01c53652d08a6d024c2fa54e93b7a4220eeb2080cca2824786bfd785f2aa0967.pdf/Octobre.pdf?download=1) | Official PDF | 2026-11-18 | ★★★★★ | "(Etat : octobre 2026"; one PDF, abbreviations, no pay field. |
| JU, LDP amendment (third reading 1.7.2026) | [CJU_Troisieme-lecture_…_Volet-I.pdf](https://www.jura.ch/Htdocs/Files/v/1163142df6028d9133a2280e0ebb4a0d311d37a54060ae30fa963551388f3455.pdf/CJU_Troisieme-lecture_Modification-loi-sur-les-droits-politiques_Volet-I.pdf?download=1) | Statute | 2026-11-18 | ★★★★★ | art. 28e: donations "excédant 750 francs"; 28k: published on the "site internet de la Chancellerie". In force 1.11.2026 per La Télé (★★); no data yet. |
| FR, LInf art. 13–14 and Parlinfo | [Parlinfo member page](https://www.fr.ch/parlinfo/membres-du-grand-conseil/7a72e9668e9a4c87bd48a45b386d9670) | Official HTML | 2026-11-18 | ★★★★★ | Per member "Registre des intérêts", categories A–E, undated; government and prefects on [fr.ch/cha/registre-des-interets…](https://www.fr.ch/cha/registre-des-interets-des-membres-du-conseil-detat-et-des-prefets). |
| FR, LFiPol (RSF 115.5) and publications | [fr.lexwork.naz.ch … 115.5.pdf](https://fr.lexwork.naz.ch/fr/dta/115.5.pdf), [fr.ch … publications-des-informations-sur-le-financement-de-la-politique](https://www.fr.ch/etat-et-droit/votations-elections-et-droits-politiques/financement-de-la-politique/publications-des-informations-sur-le-financement-de-la-politique) | Statute, official documents | 2026-11-18 | ★★★★★ | art. 7: "plus de 5000 francs … plus de 1000 francs"; art. 9: "six semaines avant"; art. 10–12: yearly income from the mandate published for MPs, government and prefects (2024 figures, 14.11.2025). |
| Cantonal terms of use (GE, VD, VS, NE, JU, FR) | e.g. [ge.ch/conditions-generales](https://www.ge.ch/conditions-generales), [vd.ch/mentions-legales](https://www.vd.ch/mentions-legales) | Terms | 2026-11-18 | ★★★★★ | All six require prior written authorisation for reproduction ("autorisation écrite préalable"). |

### Finding

**Every canton publishes its MPs' interests, none in a structured form, and none states paid or unpaid.** GE and JU publish one PDF for the whole parliament (dated March and October 2026), VD one PDF per member (some untouched since 2019), NE and FR an HTML section per member, and VS shows interests inside a JavaScript application the research pass could not read. Only FR publishes the income MPs draw from their mandate. No canton has a lobbyist register or publishes badge holders; a Vaud motion on lobbying transparency is in committee.

**Campaign financing is online in two cantons only.** VD (PDF per vote, budgets 30 days before) and FR (documents per vote and yearly party accounts, removed after one year) publish; GE and NE let the public consult the lists at the authority; VS gives them on written request; JU's new law (in force 1.11.2026) will publish online but has no data yet. All six sites reserve reproduction to prior written authorisation, which a link does not need.

Interpretation, flagged as such: the cantonal level can be served by links to each canton's register and financing page, not by data; reusing their content would need each canton's authorisation and a parser per format.

### Implication for ADRs

- **Future ADR "Sources of lobby and financing facts":** cantonal interests and financing are linked, not imported: one verified link per canton in the referential (`data/state-sites.json` or a new file), checked by `npm run links`, with "à vérifier" where a canton has nothing online.

---

<a id="q5"></a>
## Q5: What already exists for voters, and what do the reuse terms and the personal-data rule allow the site to show?

### Context

As for the media ([Research-0003](0003-media-ownership-and-leaning-sources.md) §Q4), the site's value is a short French view with sources, not a copy of what already works. And whatever it shows about people must fit PRD-0001 §3 ("name, party, canton and function only") or a ruling that extends it, as US-24 did for media owners.

### Sources consulted

| Source | URL | Type | Last verified | Confidence | Key quote / finding |
|---|---|---|---|---|---|
| "Intérêts des parlementaires" extension (Le Temps) | [addons.mozilla.org API](https://addons.mozilla.org/api/v5/addons/addon/parliament-interests/?lang=fr) | Add-on registry | 2026-11-18 (research pass) | ★★ | "Cette extension affiche les liens d'intérêt des parlementaires suisses mentionnés dans certains médias, grâce aux données de Lobbywatch."; last version 23.12.2019, abandoned. |
| Le Temps, 14.10.2019 | [letemps.ch … liens-dinteret-parlementaires-portee-clic](https://www.letemps.ch/suisse/berne/liens-dinteret-parlementaires-portee-clic) | Press | 2026-11-18 (research pass) | ★★ | "C'est sur cette base que Le Temps a développé son extension, gratuite et publiée en licence libre." |
| smartmonitor | [smartmonitor.ch](https://www.smartmonitor.ch/de) | Civic tool (Politools) | 2026-11-18 (research pass) | ★★★ | "Wir beobachten das Schweizer Parlament."; votes and attendance, no interest ties seen. |
| Transparency International Switzerland | [transparency.ch/politikfinanzierung-und-lobbying/](https://transparency.ch/politikfinanzierung-und-lobbying/) | NGO | 2026-11-18 (research pass) | ★★★ | "Notwendig ist ein transparentes Akkreditierungssystem mit einem öffentlich einsehbaren Register für Interessenvertreter." Advocacy, no tool. |
| SRF, "Lobbymacht im Parlament" | [srf.ch …](https://www.srf.ch/news/schweiz/lobbymacht-im-parlament-einige-lobbys-verlieren-im-bundeshaus-massiv-an-einfluss) | Press | 2026-11-18 (research pass) | ★★ | "Eine neue Auswertung von Lobbywatch zeigt…"; a one-off analysis. |
| LDA art. 5 (RS 231.1) | [fedlex.data.admin.ch … 1993/1798 … fr-html-7](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/1993/1798_1798_1798/20250701/fr/html/fedlex-data-admin-ch-eli-cc-1993-1798_1798_1798-20250701-fr-html-7.html) | Statute | 2026-11-18 (research pass) | ★★★★★ | "Ne sont pas protégés … les lois, ordonnances … et autres actes officiels" |
| Parliament legal notice / admin.ch terms | [parlament.ch/fr/services/mentions-legales](https://www.parlament.ch/fr/services/mentions-legales), [admin.ch … conditions-utilisation](https://www.admin.ch/gov/fr/accueil/conditions-utilisation.html) | Terms | 2026-11-18 (research pass) | ★★★★★ | "Toute reproduction est subordonnée à l'autorisation écrite préalable du détenteur des droits." (generic site terms; the Parliament's open-data terms above allow reuse with attribution). |
| LPD art. 30–31 (RS 235.1) | see [Research-0003](0003-media-ownership-and-leaning-sources.md) owner ruling 3 | Statute | 2026-11-17 | ★★★★★ | "il n'y a pas atteinte à la personnalité lorsque la personne concernée a rendu les données personnelles accessibles à tout un chacun et ne s'est pas opposée expressément au traitement" (art. 30 al. 3). |

### Finding

**No maintained French tool shows voters the interests of their representatives or the financing of a ballot.** The only one built on Lobbywatch (Le Temps, 2019) is abandoned; smartmonitor shows votes, not ties; Transparency International Switzerland campaigns but offers no tool; the press publishes one-off analyses. The CDF portal is official but generic, in a tree of actors, not next to the ballot explanation.

**What the terms and the people rule allow (interpretation, not legal advice).** Parliament data: reuse with the source, unchanged, dated (open-data terms; the generic "autorisation écrite" notice is read as overridden for data the law requires to be published, per the Parliament's own "Règles-cadres" B1). CDF data: published under a legal duty, with a disclaimer and no licence; repeating it with the source and date is in the spirit of the law. Lobbywatch: CC BY-SA, share-alike if it is the main source. Cantons: link only. People: federal parliamentarians are already shown by name, party, canton and function; their declared ties are made public by law (LParl art. 11 al. 2), so showing them extends §3 in the way US-24 did for media owners. Private persons who appear in the sources (badge holders, donors who are natural persons) are another matter: the law publishes them for scrutiny at the source, and the site would need an owner ruling before repeating their names.

### Implication for ADRs

- **PRD-0001 §3 extension (owner):** "federal parliamentarians: declared interest ties, as published by the Parliament"; private persons in badge or donor lists not named by the site unless the owner rules otherwise.
- **Future ADR "Sources of lobby and financing facts":** the voter value lies in putting the official figures next to what the voter is deciding (the ballot item, the party, the MP), in French, with source and date, and in linking Lobbywatch and the cantons for depth.

---

## Findings summary (citable from ADRs)

| Q | Finding (one line) | Confidence | Feeds |
|---|---|---|---|
| Q1 | Lobbywatch is the only maintained structured source of federal interest ties with amounts, undeclared ties, branches and lobby groups; weekly, free export, French deep links `daten.lobbywatch.ch/fr/<type>/<id>`; CC BY-SA, share-alike when it is the main source; federal only. | ★★★ | Future ADR; PRD stories |
| Q2 | The Parliament publishes each federal member's ties with paid/unpaid (LParl art. 11, since 2019) as PDF and as structured data (OData `PersonInterest`, 2,015 rows, no key; new API `interests.isPaid`), and badge holders per member (art. 69); no lobbyist register exists. | ★★★★★ | Future ADR; `npm run parliament` |
| Q3 | The CDF publishes, about 30 days before each federal vote, the declared budgets of every campaign above CHF 50,000 by actor and side, and donations above CHF 15,000 with donor names, as XLSX per item; all four items of 29.11.2026 are online. | ★★★★★ | Future ADR; ballot page |
| Q4 | All six cantons publish MPs' interests (PDF or HTML, no pay field, no data format); only VD and FR publish campaign financing online (PDF), JU from 1.11.2026; no cantonal lobby register; reproduction needs authorisation, links do not. | ★★★★ | Referential links |
| Q5 | No maintained French tool shows voters interest ties or ballot financing; the site can show official ties of federal MPs and CDF campaign budgets with source and date, link Lobbywatch and cantons, and needs an owner ruling before naming private persons. | ★★★ | PRD-0001 §3 extension |

---

## Recommendation

One line: start with the money behind the next ballot (CDF campaign budgets on each ballot item), then the declared ties of federal MPs from the Parliament with a link to their Lobbywatch page, and a Lobbies page that sends the voter to Lobbywatch by sector; link the cantons, do not import them.

What the site could show, in the order recommended:

1. **"Qui finance la campagne ?" on each ballot item.** For the item in front of the voter: the declared campaign budget of each actor above CHF 50,000, grouped "pour" and "contre", the total per side, and the organisations and companies giving more than CHF 15,000; source CDF, date, link to the CDF page. The only official, ready, voter-timed source found (Q3), and nothing like it exists in French (Q5). Labelled "budget déclaré", never "dépenses".
2. **"Liens d'intérêts" of a federal MP.** On a party's card or an MP's line: the declared ties (organisation, function, rémunéré / bénévole), counted and listed, from the Parliament with its date; a link "Plus de détails sur Lobbywatch" to the MP's page (Q1, Q2). Optional summary per party: share of paid ties, top branches (would use Lobbywatch's branches, so CC BY-SA applies to that part).
3. **A Lobbies page in the Transparence area.** The 14 Lobbywatch branches in French, each linking to its Lobbywatch page; for each branch, how many federal MPs hold a tie (computed by us from the official ties, or from Lobbywatch with attribution); the badge holders who are "représentants de milieux intéressés", as organisations and counts, without names (Q2).
4. **The cantons, by link.** For each covered canton, a verified link to its MPs' register of interests and to its financing page where one exists, with "non publié en ligne" for GE, NE and VS financing (Q4).

### Owner decisions needed

To be presented one at a time, with the material above:

1. **Scope and order of phase 2:** which of the four views above, and which first.
2. **Private persons:** donors who are natural persons and badge holders: not named by the site (organisations, companies and counts only, link to the source), or named as the official source publishes them, under the US-24 conditions.
3. **Lobbywatch's place:** link only (no licence duty), or reuse its branches and lobby groups with "Source : Lobbywatch.ch, CC BY-SA 4.0" on that content; and whether its own ratings (effectiveness, disclosure) are ever shown, which this note advises against.
4. **Official ties source:** the new Parliament API through `npm run parliament` (needs the key, stays on the maintainer's machine, PRD-0001 §8), or the public OData service (no key, closes at the latest in 2028).

### Open items (to file once the ledger exists)

The repository has no central open-items ledger yet (PRD-0001 §9), so the gaps found here are listed for filing:

- doc-gap, `#q1`: no written promise from Lobbywatch that ids are stable; GraphQL, REST (dataIF) and SPARQL not queried; annual accounts not read.
- doc-gap, `#q2`: whether OData `PersonInterest` includes former members; the per-member "Liens d'intérêts" page on parlament.ch not fetched; the new API not called (key); opendata.swiss answered 403.
- doc-gap, `#q3`: the portal's JSON endpoints are undocumented; the CDF's position on reuse (no licence stated) not asked.
- doc-gap, `#q4`: Valais MPs' register (statute article and content) not read; GE per-member fiches and FR financing documents not opened; VD member PDFs' update dates not all checked; JU entry into force from the Chancellery itself, not only the press.
- doc-gap, `#q5`: outcome of the popular initiative "Für eine volksorientierte Politik (No Lobbying)" (collection deadline 25.9.2026) not verified.

---

## Decisions Anchored

_(empty until Mode 4 Freeze)_

---

## Consolidated sources

### Statutes (Fedlex and cantonal collections)

- [LParl, RS 171.10, art. 11 and 69](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2003/510/20260302/fr/html/fedlex-data-admin-ch-eli-cc-2003-510-20260302-fr-html-4.html)
- [LDP, RS 161.1, art. 76b–76f](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/1978/688_688_688/20221023/fr/html/fedlex-data-admin-ch-eli-cc-1978-688_688_688-20221023-fr-html-10.html)
- [OFipo, RS 161.18](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/2022/490/20221023/fr/html/fedlex-data-admin-ch-eli-cc-2022-490-20221023-fr-html-3.html)
- [LDA, RS 231.1, art. 5](https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/cc/1993/1798_1798_1798/20250701/fr/html/fedlex-data-admin-ch-eli-cc-1993-1798_1798_1798-20250701-fr-html-7.html)
- GE: [LRGC](https://silgeneve.ch/legis/data/rsg_b1_01.htm), [LEDP](https://silgeneve.ch/legis/data/rsg_a5_05.htm); VD: [LEDP](https://www.lexfind.ch/tolv/219190/fr); NE: [OGC](https://www.ne.ch/sites/default/files/2026-03/OGC_commentee.pdf), [LDP](https://rsn.ne.ch/DATA/program/books/rsne/pdf/141.pdf), [LDP amendment 2024](https://www.ne.ch/legislation-jurisprudence/pubfo/ld/Documents/2024/CE_L__LDP.pdf); JU: [LOP](https://www.lexfind.ch/tolv/192292/fr), [LDP amendment](https://www.jura.ch/Htdocs/Files/v/1163142df6028d9133a2280e0ebb4a0d311d37a54060ae30fa963551388f3455.pdf/CJU_Troisieme-lecture_Modification-loi-sur-les-droits-politiques_Volet-I.pdf?download=1); FR: [LInf](https://fr.lexwork.naz.ch/fr/dta/17.5.pdf), [LFiPol](https://fr.lexwork.naz.ch/fr/dta/115.5.pdf)

### Federal official publications and data

- Registers of interests: [Conseil national](https://www.parlament.ch/centers/documents/de/interessen-nr.pdf), [Conseil des États](https://www.parlament.ch/centers/documents/de/interessen-sr.pdf)
- Registers of accredited persons: [Conseil national](https://www.parlament.ch/centers/documents/de/zutrittsberechtigte-nr.pdf), [Conseil des États](https://www.parlament.ch/centers/documents/de/zutrittsberechtigte-sr.pdf)
- [Parliament OData `PersonInterest`](https://ws.parlament.ch/odata.svc/PersonInterest?$top=1&$filter=Language%20eq%20'FR'&$format=json), [OData metadata](https://ws.parlament.ch/odata.svc/$metadata), [new API OpenAPI](https://ws.parl.ch/doc/v3/api-docs)
- [Parliament open data terms](https://www.parlament.ch/fr/%C3%BCber-das-parlament/faits-donnees-chifrees/open-data-web-services), [Règles-cadres sur les données du Parlement](https://www.parlament.ch/centers/documents/fr/Rahmenregeln%20Parlamentsdaten%20Website_fr.pdf), [legal notice](https://www.parlament.ch/fr/services/mentions-legales)
- [Duty to declare interests](https://www.parlament.ch/fr/%C3%BCber-das-parlament/portrait-du-parlement/deputes/statut-juridique-des-deputes/obligation-de-signaler-les-interets), [CIP-N report on 23.425](https://www.parlament.ch/centers/kb/Documents/2023/Rapport_de_la_commission_CIP-N_23.425_2024-09-06.pdf), [Curia Vista 15.438 via OData](https://ws.parlament.ch/odata.svc/Business?$filter=Language%20eq%20'FR'%20and%20BusinessShortNumber%20eq%20'15.438')
- [CDF political financing portal](https://politikfinanzierung.efk.admin.ch/app/fr/), [export AVS / TVA, 29.11.2026](https://politikfinanzierung.efk.admin.ch/api/frontend/latest/fr/downloads/financings/33?with_budget=true)
- [admin.ch terms of use](https://www.admin.ch/gov/fr/accueil/conditions-utilisation.html)

### Cantonal official publications

- GE: [Liens d'intérêts mars 2026](https://ge.ch/grandconseil/data/courriers/Liens_interets_mars2026.pdf), [media guide](https://ge.ch/grandconseil/data/divers_publication_pdf/guide_medias_grand_conseil_geneve.pdf), [terms](https://www.ge.ch/conditions-generales)
- VD: [MP register sample](https://www.vd.ch/fileadmin/user_upload/organisation/gc/lmgc/registres_interets_deputes/Meystre-307836.pdf), [MPs' obligations](https://www.vd.ch/gc/guide-des-depute-e-s/organes-du-grand-conseil/deputees/obligations-des-depute-e-s), [campaign publications](https://www.vd.ch/etat-droit-finances/votations-et-elections/transparence-du-financement-de-la-vie-politique/publication-des-budgets-et-des-comptes-de-campagnes), [PLR donor list 14.6.2026](https://www.vd.ch/fileadmin/user_upload/themes/etat_droit/votations_elections/fichiers_pdf/VD260614_Dons_PLR_Vaud.pdf), [25_MOT_19](https://www.vd.ch/gc/depute-e-s/detail-objet/objet/25_MOT_19/membre/620210), [legal notice](https://www.vd.ch/mentions-legales)
- VS: [government register](https://www.vs.ch/web/gouvernement/mr), [LcDP release 2023 (commune copy)](https://www.commune-evolene.ch/data/documents/20230331-Com-ModificationLcDP.pdf), [legal information](https://www.vs.ch/information-legale)
- NE: [member profile sample](https://www.ne.ch/autorites/grand-conseil/membres/romain-dubois), [terms](https://www.ne.ch/page/conditions-dutilisation)
- JU: [deputies page](https://www.jura.ch/fr/Autorites/PLT/Depute-e-s/Depute-e-s-au-Parlement-jurassien.html), [register October 2026](https://www.jura.ch/Htdocs/Files/v/01c53652d08a6d024c2fa54e93b7a4220eeb2080cca2824786bfd785f2aa0967.pdf/Octobre.pdf?download=1), [terms](https://www.jura.ch/fr/Accueil/Conditions-d-utilisation.html)
- FR: [Parlinfo member sample](https://www.fr.ch/parlinfo/membres-du-grand-conseil/7a72e9668e9a4c87bd48a45b386d9670), [government and prefects register](https://www.fr.ch/cha/registre-des-interets-des-membres-du-conseil-detat-et-des-prefets), [financing publications](https://www.fr.ch/etat-et-droit/votations-elections-et-droits-politiques/financement-de-la-politique/publications-des-informations-sur-le-financement-de-la-politique), [impressum](https://fr.ch/impressum)

### Civic projects and associations

- Lobbywatch: [data export](https://lobbywatch.ch/datenexport/), [flat JSON export](https://cms.lobbywatch.ch/sites/lobbywatch.ch/files/exports/lobbywatch_export_flat.json.zip), [SQL export](https://cms.lobbywatch.ch/sites/lobbywatch.ch/files/exports/lobbywatch_export.sql.zip), [data leaflet](https://cms.lobbywatch.ch/sites/lobbywatch.ch/files/exports/lobbywatch_daten_merkblatt.pdf), [research method](https://lobbywatch.ch/wie-wir-recherchieren/), [about us](https://lobbywatch.ch/ueber-uns/), [effectiveness](https://daten.lobbywatch.ch/fr/wirksamkeit), [transparency report](https://lobbywatch.ch/transparenz-im-schweizer-parlament-nur-jedes-vierte-ratsmitglied-legt-alle-einkuenfte-offen/), [feed](https://lobbywatch.ch/feed/), [code](https://github.com/lobbywatch/website), [example MP page](https://daten.lobbywatch.ch/fr/parlamentarier/44)
- [smartmonitor](https://www.smartmonitor.ch/de), [Transparency International Switzerland](https://transparency.ch/politikfinanzierung-und-lobbying/)

### Press and add-ons

- [Le Temps, 14.10.2019](https://www.letemps.ch/suisse/berne/liens-dinteret-parlementaires-portee-clic), [Firefox add-on](https://addons.mozilla.org/api/v5/addons/addon/parliament-interests/?lang=fr), [SRF, Lobbymacht im Parlament](https://www.srf.ch/news/schweiz/lobbymacht-im-parlament-einige-lobbys-verlieren-im-bundeshaus-massiv-an-einfluss), [La Télé, 30.09.2026](https://latele.ch/articles/jura-de-nouvelles-obligations-en-termes-de-transparence), [blue News, 25.03.2025](https://www.bluewin.ch/de/news/schweiz/volksinitiative-will-lobbyismus-im-parlament-ausbremsen-li.2622402)

---

## Changelog

| Date | Author | Mode | Change summary |
|---|---|---|---|
| 2026-11-18 | Victor Hueni (Claude) | Scaffold + Fill | Created and filled in one pass. Step 0 answers taken from the precedent of Research-0003: no ADR yet (1B), custom list of 5 questions (2D), deep on the load-bearing questions and quick on the rest (3C), load-bearing sources re-read directly (4B): the CDF export for the AVS / TVA item (XLSX, both sheets read), the Parliament's `PersonInterest` (count 2,015 in French), the Lobbywatch licence footer. Other rows were read by three research passes (Lobbywatch and prior art, federal sources, the six cantons) and say so. Not readable: opendata.swiss (403), parlement.vs.ch (JavaScript), lex.vs.ch, letemps.ch (WebFetch refused; read with curl). Corrections to the passes' briefs: the paid/unpaid rule dates from 2019, not 2023; the federal financing rules cover parties, not parliamentary groups. Status: Draft until the owner rules on the four decisions listed in the Recommendation. |
