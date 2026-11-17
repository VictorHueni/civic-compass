/*
 * Page "Qui gouverne et qui siège" (#institutions/<territory>), PRD-0001 US-13.
 * Confederation: the Federal Council, the National Council (half-circle proportional to the seats)
 * and the Council of States, current composition. A canton: its members of the two federal
 * chambers (the part of US-14 already sourced); its government and parliament come with US-14.
 * Every figure carries the Parliament's attribution and the download date (terms of use).
 */
import { $, escapeHtml as esc, host } from "./dom.ts";
import { ofCanton, onRender, scope } from "./app.ts";
import { STATE_SITE_IDS } from "./links.ts";
import { cantons, federal, parliament, stateSiteUrl } from "./referential.ts";
import { hasColour, partyColour } from "./party-colours.ts";
import { holds, isFederalCouncillor, membersOf, ownMandates, partyLabel, seatGroups, type SeatGroup } from "./parliament.ts";
import { PARLIAMENT_FUNCTIONS, type ParliamentPerson } from "../types.ts";

/** CH parties with a colour of their own, from left to right; the others fold into "Autres". */
const ORDER: string[] = federal.parties.map((p) => p.abbr).filter(hasColour);
/** For each party of the site, its main API label nationally ("PLR"); the others are named ("dont 1 PLD"). */
const MAIN_LABEL = new Map<string, string>();
for (const g of seatGroups(parliament, parliament.persons, ORDER)) {
  if (g.abbr !== null && g.labels[0]) MAIN_LABEL.set(g.abbr, g.labels[0][0]);
}

function labelName(label: string): string {
  return label === "-" ? "sans parti" : label;
}
/** The party shown next to a person: the site's abbreviation, with a regional label in brackets ("PLR (PLD)"). */
function personParty(p: ParliamentPerson): string {
  const label = partyLabel(p);
  const abbr = parliament.party_mapping[label];
  if (abbr === undefined) return labelName(label);
  const main = MAIN_LABEL.get(abbr);
  return main === undefined || main === label ? abbr : abbr + " (" + label + ")";
}
function fullName(p: ParliamentPerson): string {
  return p.firstName + " " + p.lastName;
}
function byName(a: ParliamentPerson, b: ParliamentPerson): number {
  return a.lastName.localeCompare(b.lastName, "fr") || a.firstName.localeCompare(b.firstName, "fr");
}
/** "2026-11-17" -> "17.11.2026" */
function swissDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return d + "." + m + "." + y;
}
function seatWord(n: number): string {
  return n > 1 ? "sièges" : "siège";
}

/* ---------- Seats: legend, half-circle, bar ---------- */
function groupName(g: SeatGroup): string {
  if (g.abbr === null) return "Autres (" + g.labels.map(([l, n]) => labelName(l) + " " + n).join(", ") + ")";
  const others = g.labels.filter(([l]) => l !== MAIN_LABEL.get(g.abbr as string));
  return others.length ? g.abbr + " (dont " + others.map(([l, n]) => n + " " + l).join(", ") + ")" : g.abbr;
}
function legend(groups: SeatGroup[]): string {
  return '<ul class="seat-legend">' +
    groups.map((g) => '<li><i style="background:' + partyColour(g.abbr) + '" aria-hidden="true"></i><span>' + esc(groupName(g)) + "</span><b>" + g.seats + "</b></li>").join("") +
    "</ul>";
}

const CX = 180, CY = 176, R = 168, r = 92;
function arcPoint(radius: number, deg: number): string {
  const a = (deg * Math.PI) / 180;
  return (CX + radius * Math.cos(a)).toFixed(1) + " " + (CY - radius * Math.sin(a)).toFixed(1);
}
/** Sectors proportional to the seats, from left (180°) to right (0°). Decorative: the legend carries the figures. */
function halfCircle(groups: SeatGroup[], total: number): string {
  let done = 0;
  let paths = "";
  for (const g of groups) {
    const a0 = 180 - (done / total) * 180;
    done += g.seats;
    const a1 = 180 - (done / total) * 180;
    paths += '<path fill="' + partyColour(g.abbr) + '" d="M' + arcPoint(R, a0) + " A" + R + " " + R + " 0 0 1 " + arcPoint(R, a1) +
      " L" + arcPoint(r, a1) + " A" + r + " " + r + " 0 0 0 " + arcPoint(r, a0) + ' Z"></path>';
  }
  return '<svg class="seat-arc" viewBox="0 0 360 186" aria-hidden="true" focusable="false">' + paths +
    '<text x="' + CX + '" y="' + (CY - 26) + '" text-anchor="middle" class="seat-arc__total">' + total + "</text>" +
    '<text x="' + CX + '" y="' + (CY - 6) + '" text-anchor="middle" class="seat-arc__unit">' + seatWord(total) + "</text></svg>";
}
function seatBar(groups: SeatGroup[]): string {
  return '<div class="seat-bar" aria-hidden="true">' + groups.map((g) => '<span style="flex:' + g.seats + ";background:" + partyColour(g.abbr) + '"></span>').join("") + "</div>";
}

/* ---------- Sections ---------- */
function rank(p: ParliamentPerson): number {
  if (holds(p, PARLIAMENT_FUNCTIONS.president)) return 0;
  if (holds(p, PARLIAMENT_FUNCTIONS.vicePresident)) return 1;
  return 2;
}
function federalCouncil(): string {
  const members = parliament.persons.filter(isFederalCouncillor).sort((a, b) => rank(a) - rank(b) || byName(a, b));
  const counts = new Map<string, number>();
  for (const p of members) counts.set(personParty(p), (counts.get(personParty(p)) ?? 0) + 1);
  const at = (party: string) => (ORDER.indexOf(party) + 1 || 99);
  const summary = [...counts].sort((a, b) => b[1] - a[1] || at(a[0]) - at(b[0])).map(([party, n]) => n + " " + party).join(", ");
  const items = members.map((p) => {
    const own = ownMandates(p)[0];
    const role = rank(p) < 2 ? ownMandates(p).find((m) => m.function.key !== PARLIAMENT_FUNCTIONS.federalCouncillor) : undefined;
    return '<li class="member"><span class="member__head"><b class="member__name">' + esc(fullName(p)) + '</b><span class="member__party">' + esc(personParty(p)) + "</span></span>" +
      (own ? '<span class="member__dept">' + esc(own.department.name) + "</span>" : "") +
      (role ? '<span class="member__role' + (rank(p) === 0 ? " member__role--first" : "") + '">' + esc(role.function.name) + "</span>" : "") + "</li>";
  });
  const chancellor = parliament.persons.find((p) => holds(p, PARLIAMENT_FUNCTIONS.chancellor));
  const chancellorFn = chancellor?.activeFederalCouncilMandates.find((m) => m.function.key === PARLIAMENT_FUNCTIONS.chancellor);
  return '<section class="inst-section" aria-labelledby="t-federal-council"><h3 id="t-federal-council">Conseil fédéral</h3>' +
    '<p class="panel__desc">' + members.length + " membres : " + esc(summary) + ".</p>" +
    '<ol class="members">' + items.join("") + "</ol>" +
    (chancellor && chancellorFn ? '<p class="mini">' + esc(chancellorFn.function.name) + " : " + esc(fullName(chancellor)) + " (" + esc(personParty(chancellor)) + ").</p>" : "") +
    "</section>";
}
function nationalCouncil(): string {
  const members = membersOf(parliament, "CN");
  const groups = seatGroups(parliament, members, ORDER);
  return '<section class="inst-section" aria-labelledby="t-national-council"><h3 id="t-national-council">Conseil national</h3>' +
    '<p class="panel__desc">' + members.length + " " + seatWord(members.length) + ", composition actuelle, de gauche à droite.</p>" +
    halfCircle(groups, members.length) + legend(groups) + "</section>";
}
function councilOfStates(): string {
  const members = membersOf(parliament, "CE");
  const groups = seatGroups(parliament, members, ORDER);
  return '<section class="inst-section" aria-labelledby="t-council-of-states"><h3 id="t-council-of-states">Conseil des États</h3>' +
    '<p class="panel__desc">' + members.length + " " + seatWord(members.length) + ", composition actuelle, de gauche à droite.</p>" +
    seatBar(groups) + legend(groups) + "</section>";
}

/** Members of one chamber for a canton, grouped by party from left to right. */
function cantonMembers(code: string, council: "CN" | "CE", title: string): string {
  const members = membersOf(parliament, council).filter((p) => p.canton?.abbreviation === code).sort(byName);
  if (!members.length) return "";
  const byParty = new Map<string, ParliamentPerson[]>();
  for (const p of members) byParty.set(personParty(p), [...(byParty.get(personParty(p)) ?? []), p]);
  const at = (p: ParliamentPerson) => ORDER.indexOf(parliament.party_mapping[partyLabel(p)] ?? "") + 1 || 99;
  const rows = [...byParty].sort((a, b) => at(a[1][0] as ParliamentPerson) - at(b[1][0] as ParliamentPerson) || a[0].localeCompare(b[0], "fr"));
  return "<h4>" + esc(title) + " (" + members.length + ")</h4>" +
    '<ul class="members members--compact">' +
    rows.map(([party, ps]) => '<li class="member"><span class="member__head"><span>' + esc(ps.map(fullName).join(", ")) + '</span><span class="member__party">' + esc(party) + "</span></span></li>").join("") +
    "</ul>";
}

function sources(): string {
  const url = stateSiteUrl(STATE_SITE_IDS.parliament);
  return '<div class="source-box"><p>' + esc(parliament.attribution) + ", données du " + swissDate(parliament.retrieved_on) + ".</p>" +
    "<p>Site indépendant, ce n'est pas une publication officielle. Les personnes sont présentées par leur nom, leur parti, leur canton et leur fonction seulement.</p></div>" +
    '<a class="fact-sheet__link" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"><span>Tous les élus sur le site du Parlement<small>' + esc(host(url)) + '</small></span><span aria-hidden="true">↗</span></a>';
}

function render(): void {
  const sc = scope();
  let html = '<h2 id="t-institutions">Qui gouverne et qui siège</h2>';
  if (sc.level === "federal") {
    html += '<p class="panel__desc">Le gouvernement et le Parlement de la Confédération, aujourd\'hui.</p>' + federalCouncil() + nationalCouncil() + councilOfStates();
  } else {
    const of = ofCanton(sc.canton);
    html += '<p class="panel__desc">Les élus du canton ' + esc(of) + " aux Chambres fédérales, aujourd'hui.</p>" +
      '<section class="inst-section" aria-labelledby="t-canton-in-bern"><h3 id="t-canton-in-bern">Les élus du canton ' + esc(of) + " à Berne</h3>" +
      cantonMembers(sc.canton, "CE", "Conseil des États") + cantonMembers(sc.canton, "CN", "Conseil national") + "</section>";
    const grandCouncil = cantons[sc.canton]?.stateSites.find((s) => s.name.toLowerCase().includes("grand conseil"));
    if (grandCouncil) {
      html += '<a class="fact-sheet__link" href="' + esc(grandCouncil.url) + '" target="_blank" rel="noopener noreferrer"><span>' + esc(grandCouncil.name) + " du canton<small>" + esc(host(grandCouncil.url)) + '</small></span><span aria-hidden="true">↗</span></a>';
    }
  }
  $("institutions").innerHTML = html + sources();
}

export function start(): void {
  onRender(render);
  render();
}
