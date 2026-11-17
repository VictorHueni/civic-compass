/*
 * Party presidencies kept by hand in data/parties.json (PRD-0001 US-15 and US-18): the rules
 * `npm run check` applies, and its 180-day staleness warning (owner ruling 8: warn, never fail).
 */
import type { Party } from "../src/types.ts";
import { namesText } from "../src/site/presidency.ts";
import { isStale } from "./cantonal-governments.ts";

export function checkPresidencies(parties: Party[]): string[] {
  const errors: string[] = [];
  for (const p of parties) {
    const names = p.facts?.presidency?.names;
    if (!names) continue;
    if (!names.length) errors.push(`${p.id} : presidency.names est vide`);
    if (names.some((n) => !n.trim())) errors.push(`${p.id} : presidency.names contient un nom vide`);
    for (const n of new Set(names.filter((n, i) => names.indexOf(n) !== i))) errors.push(`${p.id} : ${n} en double dans presidency.names`);
  }
  return errors;
}

/** Presidencies checked more than 180 days before `today` (AAAA-MM-JJ), for a warning that never fails. */
export function stalePresidencies(parties: Party[], today: string): string[] {
  return parties.flatMap((p) => {
    const pr = p.facts?.presidency;
    return pr && isStale(pr.checked_on, today) ? [`${p.id} : ${namesText(pr.names)}, vérifié le ${pr.checked_on}`] : [];
  });
}
