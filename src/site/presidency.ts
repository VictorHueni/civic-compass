/*
 * The presidency line of a party's card (PRD-0001 US-15): shown only with its source and check date.
 * Pure: no DOM, so tools/presidency.test.ts can load it.
 */
import type { Party } from "../types.ts";
import { siteName } from "./cantonal-standing.ts";

/** ["A"] -> "A", ["A", "B"] -> "A et B", ["A", "B", "C"] -> "A, B et C" */
export function namesText(names: string[]): string {
  return names.length < 2 ? names.join("") : names.slice(0, -1).join(", ") + " et " + names[names.length - 1];
}

export interface PresidencyFact {
  row: [string, string];
  source: { url: string; site: string; checked_on: string };
}

/** The "Présidence" row and its source, or null when the party has no sourced presidency. */
export function presidencyFact(p: Party): PresidencyFact | null {
  const pr = p.facts?.presidency;
  if (!pr) return null;
  return { row: ["Présidence", namesText(pr.names)], source: { url: pr.source, site: siteName(pr.source), checked_on: pr.checked_on } };
}
