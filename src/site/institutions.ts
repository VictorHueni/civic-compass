/*
 * Page "Qui gouverne et qui siège" (#institutions/<territory>), PRD-0001 US-13.
 * Confederation: the Federal Council, the National Council (half-circle proportional to the seats)
 * and the Council of States, current composition. A canton (US-14): its government (kept by hand,
 * each member sourced; no section until a canton has one), its Grand Conseil as elected (OFS, year
 * of the election) and its members of the two federal chambers. Every figure carries its source and date.
 */
import { $, escapeHtml as esc, host, swissDate } from "./dom.ts";
import { ofCanton, onRender, scope } from "./app.ts";
import { STATE_SITE_IDS } from "./links.ts";
import { cantonalGovernments, cantonalParliaments, cantons, federal, parliament, stateSiteUrl } from "./referential.ts";
import { EIGHTH_COLOUR, OTHERS_COLOUR, hasColour, partyColour } from "./party-colours.ts";
import { OTHER_LISTS, cantonRow, cantonSeats, councilGroups, othersNote, siteAbbr, type CouncilGroup } from "./cantonal-parliaments.ts";
import { holds, isFederalCouncillor, mainLabel, membersOf, ownMandates, partyLabel, seatGroups, type SeatGroup } from "./parliament.ts";
import { PARLIAMENT_FUNCTIONS, type ParliamentPerson } from "../types.ts";

/** CH parties with a colour of their own, from left to right; the others fold into "Autres". */
const ORDER: string[] = federal.parties.map((p) => p.abbr).filter(hasColour);

function labelName(label: string): string {
  return label === "-" ? "sans parti" : label;
}
/** The party shown next to a person: the site's abbreviation, with a regional label in brackets ("PLR (PLD)"). */
function personParty(p: ParliamentPerson): string {
  const label = partyLabel(p);
  const abbr = parliament.party_mapping[label];
  if (abbr === undefined) return labelName(label);
  const main = mainLabel(parliament, abbr);
  return main === null || main === label ? abbr : abbr + " (" + label + ")";
}
function fullName(p: ParliamentPerson): string {
  return p.firstName + " " + p.lastName;
}
function byName(a: ParliamentPerson, b: ParliamentPerson): number {
  return a.lastName.localeCompare(b.lastName, "fr") || a.firstName.localeCompare(b.firstName, "fr");
}
function seatWord(n: number): string {
  return n > 1 ? "sièges" : "siège";
}

/* ---------- Seats: legend, half-circle, bar ---------- */
function groupName(g: SeatGroup): string {
  if (g.abbr === null) return "Autres (" + g.labels.map(([l, n]) => labelName(l) + " " + n).join(", ") + ")";
  const others = g.labels.filter(([l]) => l !== mainLabel(parliament, g.abbr as string));
  return others.length ? g.abbr + " (dont " + others.map(([l, n]) => n + " " + l).join(", ") + ")" : g.abbr;
}
/** What a legend line and a sector need: colour, name, seats. */
interface Slice {
  colour: string;
  name: string;
  seats: number;
}
function federalSlices(groups: SeatGroup[]): Slice[] {
  return groups.map((g) => ({ colour: partyColour(g.abbr), name: groupName(g), seats: g.seats }));
}
function legend(slices: Slice[]): string {
  return '<ul class="seat-legend">' +
    slices.map((g) => '<li><i style="background:' + g.colour + '" aria-hidden="true"></i><span>' + esc(g.name) + "</span><b>" + g.seats + "</b></li>").join("") +
    "</ul>";
}

const CX = 180, CY = 176, R = 168, r = 92;
function arcPoint(radius: number, deg: number): string {
  const a = (deg * Math.PI) / 180;
  return (CX + radius * Math.cos(a)).toFixed(1) + " " + (CY - radius * Math.sin(a)).toFixed(1);
}
/** Sectors proportional to the seats, from left (180°) to right (0°). Decorative: the legend carries the figures. */
function halfCircle(slices: Slice[], total: number): string {
  let done = 0;
  let paths = "";
  for (const g of slices) {
    const a0 = 180 - (done / total) * 180;
    done += g.seats;
    const a1 = 180 - (done / total) * 180;
    paths += '<path fill="' + g.colour + '" d="M' + arcPoint(R, a0) + " A" + R + " " + R + " 0 0 1 " + arcPoint(R, a1) +
      " L" + arcPoint(r, a1) + " A" + r + " " + r + " 0 0 0 " + arcPoint(r, a0) + ' Z"></path>';
  }
  return '<svg class="seat-arc" viewBox="0 0 360 186" aria-hidden="true" focusable="false">' + paths +
    '<text x="' + CX + '" y="' + (CY - 26) + '" text-anchor="middle" class="seat-arc__total">' + total + "</text>" +
    '<text x="' + CX + '" y="' + (CY - 6) + '" text-anchor="middle" class="seat-arc__unit">' + seatWord(total) + "</text></svg>";
}
function seatBar(slices: Slice[]): string {
  return '<div class="seat-bar" aria-hidden="true">' + slices.map((g) => '<span style="flex:' + g.seats + ";background:" + g.colour + '"></span>').join("") + "</div>";
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
    halfCircle(federalSlices(groups), members.length) + legend(federalSlices(groups)) + "</section>";
}
function councilOfStates(): string {
  const members = membersOf(parliament, "CE");
  const groups = seatGroups(parliament, members, ORDER);
  return '<section class="inst-section" aria-labelledby="t-council-of-states"><h3 id="t-council-of-states">Conseil des États</h3>' +
    '<p class="panel__desc">' + members.length + " " + seatWord(members.length) + ", composition actuelle, de gauche à droite.</p>" +
    seatBar(federalSlices(groups)) + legend(federalSlices(groups)) + "</section>";
}

/* ---------- A canton's government (kept by hand) ---------- */
function governmentSection(code: string): string {
  const g = cantonalGovernments.find((x) => x.canton === code);
  const own = cantons[code]?.parties ?? [];
  if (!g || !g.members.length) return "";
  const partyOf = (id: string) => {
    const p = own.find((x) => x.id === id);
    return p ? siteAbbr(p.abbr, code) : "";
  };
  const counts = new Map<string, number>();
  for (const m of g.members) counts.set(m.party, (counts.get(m.party) ?? 0) + 1);
  const at = (id: string) => own.findIndex((p) => p.id === id);
  const summary = [...counts].sort((a, b) => b[1] - a[1] || at(a[0]) - at(b[0])).map(([id, n]) => n + " " + partyOf(id)).join(", ");
  const items = g.members.map((m) =>
    '<li class="member"><span class="member__head"><b class="member__name">' + esc(m.name) + '</b><span class="member__party">' + esc(partyOf(m.party)) + "</span></span>" +
    '<span class="member__dept">' + esc(m.department) + "</span>" +
    (m.role ? '<span class="member__role' + (/^pr/i.test(m.role) ? " member__role--first" : "") + '">' + esc(m.role) + "</span>" : "") + "</li>");
  // One link per site, the official page of the government first; each member's own pages stay in the data.
  const byHost = new Map<string, string>();
  for (const u of [...g.members.map((m) => m.source), ...g.members.map((m) => m.party_source)]) if (!byHost.has(host(u))) byHost.set(host(u), u);
  const urls = [...byHost.values()];
  const checked = g.members.map((m) => m.checked_on).sort()[0];
  const id = "t-government";
  return '<section class="inst-section" aria-labelledby="' + id + '"><h3 id="' + id + '">' + esc(g.body) + "</h3>" +
    '<p class="panel__desc">' + g.members.length + " membres : " + esc(summary) + ".</p>" +
    '<ol class="members">' + items.join("") + "</ol>" +
    '<p class="mini">Sources : ' + urls.map((u) => '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(host(u)) + "</a>").join(", ") +
    ", vérifiées le " + swissDate(checked) + ".</p></section>";
}

/* ---------- A canton's Grand Conseil (OFS, latest election) ---------- */
function councilSlice(g: CouncilGroup): Slice {
  const colour = g.tone === "party" ? partyColour(g.abbr) : g.tone === "eighth" ? EIGHTH_COLOUR : OTHERS_COLOUR;
  const onlyLists = g.parts.length === 1 && g.parts[0][0] === OTHER_LISTS;
  const name = g.tone === "others" && !onlyLists ? "Autres (" + g.parts.map(([l, n]) => l + " " + n).join(", ") + ")" : g.name;
  return { colour, name, seats: g.seats };
}
function grandCouncilSection(code: string, name: string): string {
  const row = cantonRow(cantonalParliaments, name);
  if (!row) return "";
  const { year, total } = cantonSeats(cantonalParliaments, code, row);
  if (year === null || total === null) return "";
  const groups = councilGroups(cantonalParliaments, code, row, cantons[code]?.parties ?? [], ORDER);
  const slices = groups.map(councilSlice);
  const others = othersNote(cantonalParliaments, code);
  const hasOtherLists = groups.some((g) => g.parts.some(([l]) => l === OTHER_LISTS));
  return '<section class="inst-section" aria-labelledby="t-grand-council"><h3 id="t-grand-council">Grand Conseil</h3>' +
    '<p class="panel__desc">' + total + " " + seatWord(total) + ", résultat de l'élection de " + year + ", de gauche à droite.</p>" +
    halfCircle(slices, total) + legend(slices) +
    (others && hasOtherLists ? '<p class="mini">Autres listes selon l\'OFS : ' + esc(others) + ".</p>" : "") +
    '<p class="note-box">Le résultat de l\'élection est affiché tel quel, avec son année. La composition peut avoir changé depuis : changements de parti, indépendants.</p>' +
    '<p class="mini">' + esc(cantonalParliaments.attribution) + ", tableau " + esc(cantonalParliaments.table) + ", données du " + swissDate(cantonalParliaments.retrieved_on) + ".</p>" +
    "</section>";
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
    const government = governmentSection(sc.canton);
    html += '<p class="panel__desc">' + (government ? "Le gouvernement et le parlement" : "Le parlement") + " du canton " + esc(of) + " et ses élus à Berne.</p>" +
      government +
      grandCouncilSection(sc.canton, cantons[sc.canton]?.name ?? "") +
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
