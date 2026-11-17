/*
 * The lines of a cantonal party's card (PRD-0001 US-15): its members in the canton's government ("2 membres
 * sur 7"), its Grand Conseil seats at the latest election (OFS, with the year), and the canton's National
 * Council and Council of States seats it holds (Parliament, current composition).
 *
 * A line appears only when its data is sourced: a canton without a government kept by hand, or a party without
 * an OFS column, has no such line. A sourced zero is written out ("Aucun siège sur 100").
 *
 * Pure functions, without DOM or data import, shared by the site and the tests.
 */
import type { CantonalGovernment, CantonalParliamentRow, CantonalParliaments, Parliament, ParliamentPerson } from "../types.ts";
import { cantonSeats, plainLabel, seatCount, siteAbbr } from "./cantonal-parliaments.ts";
import { membersOf, partyLabel, type Council } from "./parliament.ts";

/** What the card lines need to know of a party of the canton. */
export interface CantonParty {
  id: string;
  /** "PS GE" for a section of a CH party, "MCG" for a party of the canton only. */
  abbr: string;
}

export interface CantonalStanding {
  /** [label, value], in the card's order. */
  rows: [string, string][];
  /** The sources the rows draw on, for the line under the card. */
  government: boolean;
  grandCouncil: boolean;
  federal: boolean;
}

/**
 * A no-break space keeps a figure with its word on a narrow card: "14 sièges sur 100" wraps as "14 sièges /
 * sur 100", never "14 sièges sur / 100" (owner, 2026-11-17). Names keep their own break points ("Bâle-Ville").
 */
export const NBSP = "\u00a0";

/** "1 siège", "14 sièges", with a no-break space. */
export function countOf(n: number, one: string, many: string): string {
  return n + NBSP + (n > 1 ? many : one);
}

function outOf(total: number): string {
  return " sur" + NBSP + total;
}

/** Seats of a party in its Grand Conseil, from the OFS columns mapped to it; null when no column holds a number for it. */
export function grandCouncilSeats(p: CantonalParliaments, code: string, row: CantonalParliamentRow, partyId: string): number | null {
  const mapping = p.party_mapping[code] ?? {};
  let total: number | null = null;
  for (const raw of p.columns) {
    if (mapping[plainLabel(raw)] !== partyId) continue;
    const n = seatCount(row.cells[raw]);
    if (n !== null) total = (total ?? 0) + n;
  }
  return total;
}

/**
 * Whether a federal member sits for a party of the canton: a section of a CH party takes the members the
 * Parliament's labels map to that CH party ("PS GE" <- "PSS"); a party of the canton only takes the members
 * whose label is its abbr ("MCG"), as the generated mapping knows CH parties only.
 */
export function sitsFor(parliament: Parliament, party: CantonParty, code: string): (p: ParliamentPerson) => boolean {
  const base = siteAbbr(party.abbr, code);
  if (base !== party.abbr) return (p) => parliament.party_mapping[partyLabel(p)] === base;
  return (p) => partyLabel(p) === party.abbr;
}

export function cantonalStanding(
  party: CantonParty,
  code: string,
  /** The canton's own name for its parliament: "Grand Conseil", "Parlement" in the Jura. */
  parliamentName: string,
  government: CantonalGovernment | undefined,
  parliaments: CantonalParliaments,
  row: CantonalParliamentRow | undefined,
  parliament: Parliament,
): CantonalStanding {
  const rows: [string, string][] = [];
  const out: CantonalStanding = { rows, government: false, grandCouncil: false, federal: false };

  if (government && government.members.length) {
    const n = government.members.filter((m) => m.party === party.id).length;
    // "2 membres sur 7", never "2 sur 7": next to the rank in the half-circle ("3 sur 7"), a bare count reads as one (owner, 2026-11-17).
    rows.push([government.body, (n ? countOf(n, "membre", "membres") : "Aucun membre") + outOf(government.members.length)]);
    out.government = true;
  }

  if (row) {
    const { year, total } = cantonSeats(parliaments, code, row);
    const n = grandCouncilSeats(parliaments, code, row, party.id);
    if (year !== null && total !== null && n !== null) {
      rows.push([parliamentName + " (élection " + year + ")", (n ? countOf(n, "siège", "sièges") : "Aucun siège") + outOf(total)]);
      out.grandCouncil = true;
    }
  }

  const holds = sitsFor(parliament, party, code);
  const chamber = (council: Council, label: string) => {
    const members = membersOf(parliament, council).filter((p) => p.canton?.abbreviation === code);
    if (!members.length) return;
    const n = members.filter(holds).length;
    rows.push([label + " (" + code + ")", (n ? String(n) : "Aucun siège") + outOf(members.length)]);
    out.federal = true;
  };
  chamber("CN", "Conseil national");
  chamber("CE", "Conseil des États");
  return out;
}

/** "https://www.vd.ch/ce" -> "vd.ch" */
export function siteName(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

/** One page per site, in the order given (the government's official page first): the source links of a government. */
export function governmentSources(g: CantonalGovernment): string[] {
  const bySite = new Map<string, string>();
  for (const u of [...g.members.map((m) => m.source), ...g.members.map((m) => m.party_source)]) if (!bySite.has(siteName(u))) bySite.set(siteName(u), u);
  return [...bySite.values()];
}
