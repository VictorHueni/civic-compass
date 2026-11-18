/*
 * The reading of the media data (PRD-0001 US-20, US-21).
 *
 * The lines of a medium's card: "Éditeur", the publisher as the register names it; "Propriétaire", the holders of
 * the publisher a source names, with their share; "Au sommet", the top of the chain when it goes above those
 * holders. Decision table: docs/plans/active/transparency-media/ (API tab). A line appears only when a source
 * supports it: no holder named, no "Propriétaire" line, never "inconnu".
 *
 * The graph views: the media a holder reaches, the people and families that link several media ("Ils relient
 * plusieurs médias"), the three rings of Soleil, the search by name without accents.
 *
 * Pure functions, without DOM or data import, shared by the site and the tests.
 */
import type { Company, Holder, Holding, MediaOwnership } from "../types.ts";
import { normalize } from "./text.ts";

/** A page a line rests on, with the day it was read. */
export interface SourceRef {
  url: string;
  checked_on: string;
}

export interface CardLine {
  label: "Éditeur" | "Propriétaire" | "Au sommet";
  text: string;
  sources: SourceRef[];
  /** Notes that qualify the line, such as the sources that disagree. */
  notes: string[];
}

/** The register's short legal forms, written out. Others ("association", "succursale"...) are shown as kept. */
const LEGAL_FORMS: Record<string, string> = { SA: "société anonyme", Sàrl: "société à responsabilité limitée" };

/** The name shown for a person whose name was removed on request (US-24). */
const PRIVATE_HOLDER = "actionnaire privé";

/** "24,66 %": a share as published, with the Swiss French decimal comma. */
export function formatShare(share: number): string {
  return String(share).replace(".", ",") + " %";
}

function addSource(list: SourceRef[], url: string, checked_on: string): void {
  if (!list.some((s) => s.url === url && s.checked_on === checked_on)) list.push({ url, checked_on });
}

/** A company or a holder of the file, by id. */
function entity(m: MediaOwnership, id: string): Company | Holder | undefined {
  return m.companies.find((c) => c.id === id) ?? m.holders.find((h) => h.id === id);
}

function nameOf(m: MediaOwnership, id: string): string {
  return entity(m, id)?.name ?? PRIVATE_HOLDER;
}

/** The holdings in a company, the largest published share first, unpublished shares last, file order kept on ties. */
function holdingsIn(m: MediaOwnership, id: string): Holding[] {
  return m.holdings.filter((h) => h.held === id).sort((a, b) => (b.share ?? -1) - (a.share ?? -1));
}

/**
 * The holder of the largest published share in a company. A lone holder whose share is not published counts as
 * the whole; several holders without any published share give none.
 */
export function mainHolder(m: MediaOwnership, id: string): string | null {
  const holdings = holdingsIn(m, id);
  if (holdings.length === 1) return holdings[0].holder;
  const first = holdings[0];
  return first && first.share !== null ? first.holder : null;
}

/** The ids from `id` up through each main holder, `id` first; stops before an id already met. */
function chain(m: MediaOwnership, id: string): string[] {
  const ids = [id];
  for (let next = mainHolder(m, id); next !== null && !ids.includes(next); next = mainHolder(m, next)) ids.push(next);
  return ids;
}

/** The top of the chain of main holders above `id`: `id` itself when nobody holds it. */
export function chainTop(m: MediaOwnership, id: string): string {
  const ids = chain(m, id);
  return ids[ids.length - 1];
}

function editeurLine(m: MediaOwnership, publisher: string, imprint: string, mediumCheckedOn: string): CardLine {
  const e = entity(m, publisher);
  const form = e?.legal_form;
  const parts = [e?.name ?? publisher, form ? (LEGAL_FORMS[form] ?? form) : null, e?.seat ?? null];
  const sources: SourceRef[] = [];
  if (e) addSource(sources, e.source, e.checked_on);
  addSource(sources, imprint, mediumCheckedOn);
  return { label: "Éditeur", text: parts.filter((p) => p).join(", "), sources, notes: [] };
}

function ownerLine(m: MediaOwnership, holdings: Holding[]): CardLine {
  const sources: SourceRef[] = [];
  const notes: string[] = [];
  const items = holdings.map((h) => {
    addSource(sources, h.source, h.checked_on);
    if (h.dispute !== undefined && h.note && !notes.includes(h.note)) notes.push(h.note);
    const facts = [h.share === null ? null : formatShare(h.share), h.dispute === undefined ? null : "sources en désaccord"].filter((f) => f);
    return nameOf(m, h.holder) + (facts.length ? ` (${facts.join(", ")})` : "");
  });
  return { label: "Propriétaire", text: items.join(", "), sources, notes };
}

/** The lines of a medium's card, in order: Éditeur always; Propriétaire and Au sommet when a source supports them. */
export function cardLines(m: MediaOwnership, mediumId: string): CardLine[] {
  const medium = m.media.find((x) => x.id === mediumId);
  if (!medium) return [];
  const lines = [editeurLine(m, medium.publisher, medium.publisher_source, medium.checked_on)];
  const holdings = holdingsIn(m, medium.publisher);
  if (!holdings.length) return lines;
  lines.push(ownerLine(m, holdings));

  const main = mainHolder(m, medium.publisher);
  if (main === null) return lines;
  const above = chain(m, main);
  if (above.length < 2) return lines;
  const sources: SourceRef[] = [];
  for (let i = 1; i < above.length; i++) {
    const h = m.holdings.find((x) => x.holder === above[i] && x.held === above[i - 1]);
    if (h) addSource(sources, h.source, h.checked_on);
  }
  lines.push({ label: "Au sommet", text: nameOf(m, above[above.length - 1]), sources, notes: [] });
  return lines;
}

/** The media `id` reaches: itself if it is a medium, else every medium its holdings lead to, in file order. */
export function reach(m: MediaOwnership, id: string): string[] {
  if (m.media.some((x) => x.id === id)) return [id];
  const met = new Set([id]);
  for (const next of met) {
    for (const h of m.holdings) if (h.holder === next) met.add(h.held);
  }
  return m.media.filter((x) => met.has(x.publisher)).map((x) => x.id);
}

/** A person or family in the chain of several media: "Ils relient plusieurs médias". */
export interface Bridge {
  id: string;
  media: string[];
}

function byName(m: MediaOwnership, a: string, b: string): number {
  return nameOf(m, a).localeCompare(nameOf(m, b), "fr");
}

/** The people and families that reach at least two media, the most media first, then by name. Never a company. */
export function bridges(m: MediaOwnership): Bridge[] {
  return m.holders
    .filter((h) => h.kind === "person" || h.kind === "family")
    .map((h) => ({ id: h.id, media: reach(m, h.id) }))
    .filter((b) => b.media.length >= 2)
    .sort((a, b) => b.media.length - a.media.length || byName(m, a.id, b.id));
}

/** The kind of the owner at the top of a chain, the centre ring of Soleil: persons and families share one colour. */
export type TopKind = "people" | "public" | "association" | "company";
const TOP_KINDS: TopKind[] = ["people", "public", "association", "company"];

/** A top owner and the media under it: the middle and outer rings of Soleil. */
export interface RingOwner {
  id: string;
  media: string[];
}

export interface Ring {
  kind: TopKind;
  owners: RingOwner[];
}

function topKind(m: MediaOwnership, id: string): TopKind {
  const kind = m.holders.find((h) => h.id === id)?.kind;
  if (kind === "person" || kind === "family") return "people";
  return kind ?? "company";
}

/**
 * The rings of Soleil: each medium goes under the top of the chain of main holders above its publisher (the holder
 * of the largest published share at each step), grouped by the kind of that top. Kinds in a fixed order, empty
 * ones left out; owners with the most media first, then by name; media in file order.
 */
export function rings(m: MediaOwnership): Ring[] {
  const under = new Map<string, string[]>();
  for (const x of m.media) {
    const top = chainTop(m, x.publisher);
    under.set(top, [...(under.get(top) ?? []), x.id]);
  }
  const owners = [...under].map(([id, media]) => ({ id, media }));
  return TOP_KINDS.map((kind) => ({
    kind,
    owners: owners.filter((o) => topKind(m, o.id) === kind).sort((a, b) => b.media.length - a.media.length || byName(m, a.id, b.id)),
  })).filter((r) => r.owners.length);
}

/** Lower case, without accents, spaces trimmed and collapsed. */
function searchable(s: string): string {
  return normalize(s).trim().replace(/\s+/g, " ");
}

/**
 * The medium, company or holder whose name matches `query`, without accents or case: an exact name first, else the
 * first name that contains it (media, then companies, then holders, in file order); null when none does.
 */
export function search(m: MediaOwnership, query: string): string | null {
  const q = searchable(query);
  if (!q) return null;
  const named = [...m.media, ...m.companies, ...m.holders].filter((e) => e.name).map((e) => ({ id: e.id, name: searchable(e.name ?? "") }));
  return (named.find((e) => e.name === q) ?? named.find((e) => e.name.includes(q)))?.id ?? null;
}
