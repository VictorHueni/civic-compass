/*
 * Rules on data/media.json that its schema cannot express (PRD-0001 US-23, US-24): the decision table
 * "what npm run check says about the media" of docs/plans/active/transparency-media/ (API tab).
 * Messages are in French: the maintainers read them in French.
 */
import { createHash } from "node:crypto";
import { normalize } from "../src/site/text.ts";
import type { Holding, MediaOwnership, Territory } from "../src/types.ts";
import { isStale } from "./cantonal-governments.ts";

/**
 * The fingerprint of a name removed on request (US-24, PRD-0001 §8): SHA-256, in hexadecimal, of the name in lower
 * case, without accents, spaces collapsed. The file keeps it instead of the name, so that the check can refuse the
 * name if a later update brings it back. Its two limits (§8): someone who already suspects a name can test it, and
 * the name stays in the git history of the versions before the removal.
 */
export function fingerprint(name: string): string {
  return createHash("sha256").update(normalize(name).trim().replace(/\s+/g, " ")).digest("hex");
}

/** Rounds a sum of percentages to two decimals, as the shares are published. */
const percent = (n: number): number => Math.round(n * 100) / 100;

/** Returns one message per broken rule, in the order of the file. */
export function checkMedia(m: MediaOwnership, territories: Territory[]): string[] {
  const errors: string[] = [];
  const companies = new Set(m.companies.map((c) => c.id));
  const holders = new Map(m.holders.map((h) => [h.id, h]));
  const regions = new Set(territories.map((t) => t.code));

  const seen = new Set<string>();
  for (const id of [...m.media.map((x) => x.id), ...m.companies.map((x) => x.id), ...m.holders.map((x) => x.id)]) {
    if (seen.has(id)) errors.push(`id « ${id} » en double (media, companies, holders)`);
    seen.add(id);
  }

  for (const medium of m.media) {
    const at = medium.id;
    if (!medium.publisher) errors.push(`${at} : pas d'éditeur`);
    else if (!companies.has(medium.publisher)) {
      const h = holders.get(medium.publisher);
      if (!h) errors.push(`${at} : éditeur « ${medium.publisher} » introuvable`);
      else if (h.kind !== "association") errors.push(`${at} : l'éditeur « ${medium.publisher} » n'est ni une société ni une association ou fondation`);
    }
    if (!medium.regions.length) errors.push(`${at} : aucune région`);
    for (const r of medium.regions) if (!regions.has(r)) errors.push(`${at} : région « ${r} » inconnue de territories.json`);
  }

  const label = (h: Holding) => `holding ${h.holder} → ${h.held}`;
  for (const h of m.holdings) {
    if (!companies.has(h.holder) && !holders.has(h.holder)) errors.push(`${label(h)} : détenteur « ${h.holder} » introuvable`);
    if (!companies.has(h.held)) errors.push(`${label(h)} : « ${h.held} » n'est pas une société de companies`);
    if (h.share !== null && (h.share < 0 || h.share > 100)) errors.push(`${label(h)} : part ${h.share} hors de 0 à 100`);
  }

  const disputes = new Map<string, Holding[]>();
  for (const h of m.holdings) if (h.dispute !== undefined) disputes.set(h.dispute, [...(disputes.get(h.dispute) ?? []), h]);
  for (const [key, group] of disputes) {
    const held = [...new Set(group.map((h) => h.held))];
    if (held.length > 1) errors.push(`dispute « ${key} » : porte sur plusieurs sociétés (${held.join(", ")})`);
    if (group.length < 2) errors.push(`dispute « ${key} » : une seule participation (il en faut au moins deux)`);
  }
  for (const h of m.holdings) if (h.dispute !== undefined && !h.note) errors.push(`${label(h)} : dispute sans note qui nomme les sources`);

  for (const c of m.companies) {
    const total = publishedTotal(m.holdings.filter((h) => h.held === c.id));
    if (total > 100) errors.push(`${c.id} : les parts publiées font ${total} % (plus de 100 %)`);
  }

  // Removals (US-24): a removed holder keeps no name; no named holder may match a removed name. Messages name the
  // id only, never the name, so that the check's output does not repeat a name that was asked out.
  const removed = new Set(m.holders.flatMap((h) => (h.removal ? [h.removal.fingerprint] : [])));
  for (const h of m.holders) {
    if (h.removal && h.name) errors.push(`${h.id} : un nom et un retrait (un détenteur retiré ne garde pas son nom)`);
    if (!h.removal && !h.name) errors.push(`${h.id} : ni nom ni retrait`);
    if (h.name && removed.has(fingerprint(h.name))) errors.push(`${h.id} : ce nom a été retiré à la demande de la personne ; ne pas le remettre`);
  }

  const measured = new Set<string>();
  const media = new Set(m.media.map((x) => x.id));
  for (const v of m.fog.values) {
    if (!media.has(v.medium)) errors.push(`fög : média « ${v.medium} » introuvable`);
    else if (measured.has(v.medium)) errors.push(`fög : deux valeurs pour « ${v.medium} »`);
    measured.add(v.medium);
  }
  return errors;
}

/**
 * Sum of the published shares in one company. Holdings under one dispute key are the same share
 * given to two holders by two sources: it counts once, at its largest value (PRD-0001 §8, 2026-11-18).
 */
export function publishedTotal(holdings: Holding[]): number {
  let total = 0;
  const disputed = new Map<string, number>();
  for (const h of holdings) {
    if (h.share === null) continue;
    if (h.dispute === undefined) total += h.share;
    else disputed.set(h.dispute, Math.max(disputed.get(h.dispute) ?? 0, h.share));
  }
  for (const share of disputed.values()) total += share;
  return percent(total);
}

/**
 * Facts checked more than 180 days before `today` (AAAA-MM-JJ), for a warning that never fails (US-23, as US-18).
 * A holder is named by id only after a removal: its name is gone.
 */
export function staleMedia(m: MediaOwnership, today: string): string[] {
  const named = (id: string, name: string | undefined) => (name ? `${id} (${name})` : id);
  return [
    ...m.media.filter((x) => isStale(x.checked_on, today)).map((x) => `${named(x.id, x.name)}, vérifié le ${x.checked_on}`),
    ...m.companies.filter((x) => isStale(x.checked_on, today)).map((x) => `${named(x.id, x.name)}, vérifié le ${x.checked_on}`),
    ...m.holders.filter((x) => isStale(x.checked_on, today)).map((x) => `${named(x.id, x.name)}, vérifié le ${x.checked_on}`),
    ...m.holdings.filter((h) => isStale(h.checked_on, today)).map((h) => `holding ${h.holder} → ${h.held}, vérifié le ${h.checked_on}`),
    ...(isStale(m.fog.edition.checked_on, today) ? [`fög : édition ${m.fog.edition.period}, vérifiée le ${m.fog.edition.checked_on}`] : []),
  ];
}

/** "38 médias, 40 sociétés, ...": the part of the line of npm run check that counts the media file. */
export function mediaSummary(m: MediaOwnership): string {
  return (
    `${m.media.length} médias, ${m.companies.length} sociétés, ${m.holders.length} autres détenteurs, ` +
    `${m.holdings.length} participations, ${m.fog.values.length} valeurs du fög`
  );
}
