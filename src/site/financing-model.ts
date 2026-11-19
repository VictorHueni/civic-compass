/*
 * What the step « Suivre l'argent » shows for a ballot item (PRD-0001 US-26), from data/campaign-financing.json:
 * the budgets each side's committees declared before the vote, sorted by amount, with bars relative to the largest;
 * the donations above CHF 15,000 grouped by the committee that receives them, a donor's gifts to one committee on
 * one line; the committees without such donations. Mockup: artboard 1 of the owner-approved canvas (Plan-0001-financing).
 *
 * A person is shown by first name and name, as the CDF publishes them (owner ruling 4, Research-0004); a donor
 * removed on request (US-27) is « une personne privée », each gift on its own line, so that nothing links them.
 *
 * Pure functions, without DOM or data import, shared by the site and the tests.
 */
import type { CampaignFinancing, Donation, Recommendation } from "../types.ts";
import { NBSP } from "./cantonal-standing.ts";

/** The name shown for a donor removed on request (US-27). */
export const PRIVATE_DONOR = "une personne privée";

/** « 1 128 811 »: whole francs, groups of three joined by no-break spaces (a figure stays in one piece). */
export function amount(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

/** « 889 590 CHF », the unit kept with its figure. */
export function chf(n: number): string {
  return amount(n) + NBSP + "CHF";
}

export interface CommitteeRow {
  actor: string;
  total: number;
  /** Bar width in percent of the largest budget of the item, both sides together. */
  width: number;
}

export interface SideView {
  side: Recommendation;
  total: number;
  committees: CommitteeRow[];
}

export interface DonorLine {
  donor: string;
  value: number;
  count: number;
  /** A natural person, named or removed: the error report and the removal procedure concern them. */
  person: boolean;
}

export interface ReceiverView {
  side: Recommendation;
  actor: string;
  total: number;
  count: number;
  lines: DonorLine[];
}

export type FinancingView =
  | {
      state: "declared";
      sides: [SideView, SideView];
      donations: { count: number; total: number; receivers: number };
      receivers: ReceiverView[];
      /** Committees of the item without a donation above CHF 15,000, by budget. */
      without: string[];
      declared_on: string;
      retrieved_on: string;
      disclaimer: string;
      source_page: string;
    }
  | { state: "none"; retrieved_on: string; source_page: string };

const byAmount = <T extends { total: number }>(a: T, b: T) => b.total - a.total;

/** The donor's line key and label: a company or a named person groups its gifts; a removed donor never does. */
function donorOf(d: Donation, i: number): { key: string; label: string; person: boolean } {
  switch (d.donor.type) {
    case "company":
      return { key: `company:${d.donor.name}`, label: d.donor.name, person: false };
    case "person":
      return { key: `person:${d.donor.first_name} ${d.donor.name}`, label: `${d.donor.first_name} ${d.donor.name}`, person: true };
    case "removed":
      return { key: `removed:${i}`, label: PRIVATE_DONOR, person: true };
  }
}

export function financingView(f: CampaignFinancing, ballotItemId: string): FinancingView {
  const item = f.items.find((i) => i.ballot_item === ballotItemId);
  if (!item) return { state: "none", retrieved_on: f.retrieved_on, source_page: f.source_page };

  // Sorts are stable: equal amounts keep the CDF's order.
  const campaigns = [...item.campaigns].sort(byAmount);
  const largest = Math.max(0, ...campaigns.map((c) => c.total));
  const side = (s: Recommendation): SideView => {
    const mine = campaigns.filter((c) => c.side === s);
    return {
      side: s,
      total: mine.reduce((n, c) => n + c.total, 0),
      committees: mine.map((c) => ({ actor: c.actor, total: c.total, width: largest > 0 ? Math.round((c.total / largest) * 100) : 0 })),
    };
  };

  const receivers: ReceiverView[] = [];
  for (const c of campaigns) {
    const gifts = item.donations.map((d, i) => ({ d, i })).filter(({ d }) => d.actor_id === c.actor_id);
    if (gifts.length === 0) continue;
    const lines = new Map<string, DonorLine>();
    for (const { d, i } of gifts) {
      const who = donorOf(d, i);
      const line = lines.get(who.key) ?? { donor: who.label, value: 0, count: 0, person: who.person };
      line.value += d.value;
      line.count += 1;
      lines.set(who.key, line);
    }
    const sorted = [...lines.values()].sort((a, b) => b.value - a.value);
    receivers.push({ side: c.side, actor: c.actor, total: sorted.reduce((n, l) => n + l.value, 0), count: gifts.length, lines: sorted });
  }
  receivers.sort((a, b) => (a.side === b.side ? b.total - a.total : a.side === "yes" ? -1 : 1));

  return {
    state: "declared",
    sides: [side("yes"), side("no")],
    donations: { count: item.donations.length, total: item.donations.reduce((n, d) => n + d.value, 0), receivers: receivers.length },
    receivers,
    without: campaigns.filter((c) => !item.donations.some((d) => d.actor_id === c.actor_id)).map((c) => c.actor),
    declared_on: item.declared_on,
    retrieved_on: f.retrieved_on,
    disclaimer: f.disclaimer,
    source_page: f.source_page,
  };
}
