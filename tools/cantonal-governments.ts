/*
 * Cantonal governments kept by hand (data/cantonal-governments.json, PRD-0001 US-14 and US-18):
 * the rules `npm run check` applies, and its 180-day staleness warning (owner ruling 8: warn, never fail).
 */
import type { CantonalGovernment, Party, Territory } from "../src/types.ts";
import { coveredCantons } from "./cantonal-parliaments.ts";

/** Members of each covered government (Research-0002 Q5: official pages, OFS je-f-17.02.06.01, OpenParlData agree). */
export const GOVERNMENT_SIZES: Record<string, number> = { GE: 7, VD: 7, VS: 5, NE: 5, JU: 5, FR: 7 };
export const STALE_AFTER_DAYS = 180;

export function checkCantonalGovernments(governments: CantonalGovernment[], territories: Territory[], parties: Party[]): string[] {
  const errors: string[] = [];
  const covered = new Set(coveredCantons(territories, parties).map((t) => t.code));
  const seen = new Set<string>();
  for (const g of governments) {
    const at = g.canton;
    if (!covered.has(g.canton)) errors.push(`${at} : pas un canton couvert`);
    if (seen.has(g.canton)) errors.push(`${at} : canton en double`);
    seen.add(g.canton);
    const size = GOVERNMENT_SIZES[g.canton];
    if (size === undefined) errors.push(`${at} : taille du gouvernement inconnue (GOVERNMENT_SIZES, tools/cantonal-governments.ts)`);
    else if (g.members.length !== size) errors.push(`${at} : ${g.members.length} membres au lieu de ${size}`);
    const names = new Set<string>();
    for (const m of g.members) {
      if (names.has(m.name)) errors.push(`${at} : ${m.name} en double`);
      names.add(m.name);
      const party = parties.find((p) => p.id === m.party);
      if (!party) errors.push(`${at} : ${m.name}, parti « ${m.party} » absent de parties.json`);
      else if (party.territory !== g.canton) errors.push(`${at} : ${m.name}, « ${m.party} » est un parti de ${party.territory}`);
    }
  }
  return errors;
}

/** True when a record kept by hand was checked more than 180 days before `today` (both AAAA-MM-JJ). */
export function isStale(checkedOn: string, today: string): boolean {
  return Date.parse(checkedOn + "T00:00:00Z") < Date.parse(today + "T00:00:00Z") - STALE_AFTER_DAYS * 86_400_000;
}

/** Members checked more than 180 days before `today` (AAAA-MM-JJ), for a warning that never fails. */
export function staleMembers(governments: CantonalGovernment[], today: string): string[] {
  return governments.flatMap((g) =>
    g.members.filter((m) => isStale(m.checked_on, today)).map((m) => `${g.canton} : ${m.name}, vérifié le ${m.checked_on}`),
  );
}

/** "GE 7, VD 7…" */
export function governmentsSummary(governments: CantonalGovernment[]): string {
  return governments.map((g) => `${g.canton} ${g.members.length}`).join(", ");
}
