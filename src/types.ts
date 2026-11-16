/*
 * Types of the referential in data/*.json, shared by the site (src/site) and the tool (tools/cli.ts).
 *
 * Each interface has a schema next to it. The type `Schema<T>` forces the schema to list every key of
 * the interface, with `optional: true` exactly on the optional keys, so `tsc` fails as soon as the two
 * drift apart. `npm run check` validates data/*.json against these schemas.
 */

/* ---------- Schema description ---------- */

type Flags = { readonly optional?: true; readonly nullable?: true };
export type Rule = Flags &
  (
    | { readonly kind: "string" }
    | { readonly kind: "integer" }
    | { readonly kind: "date" } // AAAA-MM-JJ
    | { readonly kind: "url" } // http:// or https://
    | { readonly kind: "enum"; readonly values: readonly string[] }
    | { readonly kind: "list"; readonly item: Rule }
    | { readonly kind: "object"; readonly schema: AnySchema }
    | { readonly kind: "record"; readonly value: Rule } // free keys, every value follows `value`
  );
export type AnySchema = { readonly [key: string]: Rule };

type IsOptional<T, K extends keyof T> = {} extends Pick<T, K> ? true : false;
type IsNullable<V> = null extends V ? true : false;
type RuleFor<T, K extends keyof T> = Rule &
  (IsOptional<T, K> extends true ? { readonly optional: true } : { readonly optional?: never }) &
  (IsNullable<T[K]> extends true ? { readonly nullable: true } : { readonly nullable?: never });

/** One rule per key of T, no more, no less. */
export type Schema<T> = { readonly [K in keyof T]-?: RuleFor<T, K> };

/* ---------- Links (parties, state sites, tools) ---------- */

export const LINK_STATUSES = ["verified", "to_confirm", "not_found"] as const;
/** verified: checked by hand; to_confirm: plausible, not proven; not_found: no site found, url is null. */
export type LinkStatus = (typeof LINK_STATUSES)[number];

/** An address no longer used, kept for the record. Never tested by `npm run links`. */
export interface PreviousUrl {
  url: string;
  seen_on: string;
  note: string;
}
export const PREVIOUS_URL_SCHEMA: Schema<PreviousUrl> = {
  url: { kind: "url" },
  seen_on: { kind: "date" },
  note: { kind: "string" },
};

/** Fields shared by every entry that points to a web site. `url` is null if and only if status is not_found. */
export interface LinkEntry {
  id: string;
  name: string;
  description: string;
  url: string | null;
  status: LinkStatus;
  checked_on: string;
  evidence: string;
  previous_urls: PreviousUrl[];
}
const LINK_ENTRY_SCHEMA: Schema<LinkEntry> = {
  id: { kind: "string" },
  name: { kind: "string" },
  description: { kind: "string" },
  url: { kind: "url", nullable: true },
  status: { kind: "enum", values: LINK_STATUSES },
  checked_on: { kind: "date" },
  evidence: { kind: "string" },
  previous_urls: { kind: "list", item: { kind: "object", schema: PREVIOUS_URL_SCHEMA } },
};

/* ---------- Territories ---------- */

/** "CH" for the Confederation, else a canton code. */
export interface Territory {
  code: string;
  name: string;
  note?: string;
}
export const TERRITORY_SCHEMA: Schema<Territory> = {
  code: { kind: "string" },
  name: { kind: "string" },
  note: { kind: "string", optional: true },
};

/* ---------- Parties ---------- */

/**
 * A fact about a party. The site shows it only once it has a source (PRD-0001 goal 2:
 * no fact without a source); until then it is kept here with source and checked_on null.
 */
export interface SourcedFact {
  value: number;
  source: string | null;
  checked_on: string | null;
}
export const SOURCED_FACT_SCHEMA: Schema<SourcedFact> = {
  value: { kind: "integer" },
  source: { kind: "url", nullable: true },
  checked_on: { kind: "date", nullable: true },
};

export interface PartyFacts {
  founded?: SourcedFact;
  federal_council_seats?: SourcedFact;
}
export const PARTY_FACTS_SCHEMA: Schema<PartyFacts> = {
  founded: { kind: "object", schema: SOURCED_FACT_SCHEMA, optional: true },
  federal_council_seats: { kind: "object", schema: SOURCED_FACT_SCHEMA, optional: true },
};

export interface Party extends LinkEntry {
  territory: string;
  abbr: string;
  short: string;
  position: string;
  facts?: PartyFacts;
}
export const PARTY_SCHEMA: Schema<Party> = {
  ...LINK_ENTRY_SCHEMA,
  territory: { kind: "string" },
  abbr: { kind: "string" },
  short: { kind: "string" },
  position: { kind: "string" },
  facts: { kind: "object", schema: PARTY_FACTS_SCHEMA, optional: true },
};

/* ---------- State sites and tools ---------- */

export interface StateSite extends LinkEntry {
  territory: string;
}
export const STATE_SITE_SCHEMA: Schema<StateSite> = {
  ...LINK_ENTRY_SCHEMA,
  territory: { kind: "string" },
};

/** Decision aids, valid for every territory. */
export type Tool = LinkEntry;
export const TOOL_SCHEMA: Schema<Tool> = LINK_ENTRY_SCHEMA;

/* ---------- Ballot ---------- */

export const RECOMMENDATIONS = ["yes", "no"] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];

export interface BallotItem {
  id: string;
  short: string;
  title: string;
  question: string;
  yes: string;
  no: string;
  /** Recommendation of the Federal Council and Parliament, null when not stated. */
  federal_council: Recommendation | null;
  url: string;
  /** Party recommendations, keyed by the `abbr` of a CH party. Only sourced ones. */
  parties: Record<string, Recommendation>;
}
export const BALLOT_ITEM_SCHEMA: Schema<BallotItem> = {
  id: { kind: "string" },
  short: { kind: "string" },
  title: { kind: "string" },
  question: { kind: "string" },
  yes: { kind: "string" },
  no: { kind: "string" },
  federal_council: { kind: "enum", values: RECOMMENDATIONS, nullable: true },
  url: { kind: "url" },
  parties: { kind: "record", value: { kind: "enum", values: RECOMMENDATIONS } },
};

export interface CantonBallot {
  /** Titles of the cantonal items voted the same day. */
  items: string[];
  url: string;
}
export const CANTON_BALLOT_SCHEMA: Schema<CantonBallot> = {
  items: { kind: "list", item: { kind: "string" } },
  url: { kind: "url" },
};

export interface Source {
  title: string;
  url: string;
}
export const SOURCE_SCHEMA: Schema<Source> = {
  title: { kind: "string" },
  url: { kind: "url" },
};

export interface Ballot {
  date: string;
  label: string;
  voting_material: string;
  page: string;
  brochure: string;
  items: BallotItem[];
  /** Keyed by canton code. */
  cantons: Record<string, CantonBallot>;
  sources: Source[];
}
export const BALLOT_SCHEMA: Schema<Ballot> = {
  date: { kind: "date" },
  label: { kind: "string" },
  voting_material: { kind: "string" },
  page: { kind: "url" },
  brochure: { kind: "url" },
  items: { kind: "list", item: { kind: "object", schema: BALLOT_ITEM_SCHEMA } },
  cantons: { kind: "record", value: { kind: "object", schema: CANTON_BALLOT_SCHEMA } },
  sources: { kind: "list", item: { kind: "object", schema: SOURCE_SCHEMA } },
};

/* ---------- Files in data/ ---------- */

/** Every file wraps its content in one key, next to a free note for editors (`_readme`). */
export interface PartiesFile {
  _readme: string;
  parties: Party[];
}
export interface StateSitesFile {
  _readme: string;
  state_sites: StateSite[];
}
export interface ToolsFile {
  _readme: string;
  tools: Tool[];
}
export interface TerritoriesFile {
  _readme: string;
  territories: Territory[];
}
export interface BallotFile {
  _readme: string;
  ballot: Ballot;
}

const list = (schema: AnySchema) => ({ kind: "list", item: { kind: "object", schema } }) as const;

/** data/ file name, then the schema of its whole content. */
export const DATA_FILES = {
  territories: {
    file: "territories.json",
    schema: { _readme: { kind: "string" }, territories: list(TERRITORY_SCHEMA) } satisfies Schema<TerritoriesFile>,
  },
  parties: {
    file: "parties.json",
    schema: { _readme: { kind: "string" }, parties: list(PARTY_SCHEMA) } satisfies Schema<PartiesFile>,
  },
  state_sites: {
    file: "state-sites.json",
    schema: { _readme: { kind: "string" }, state_sites: list(STATE_SITE_SCHEMA) } satisfies Schema<StateSitesFile>,
  },
  tools: {
    file: "tools.json",
    schema: { _readme: { kind: "string" }, tools: list(TOOL_SCHEMA) } satisfies Schema<ToolsFile>,
  },
  ballot: {
    file: "ballot.json",
    schema: { _readme: { kind: "string" }, ballot: { kind: "object", schema: BALLOT_SCHEMA } } satisfies Schema<BallotFile>,
  },
} as const;

/** The whole referential, once loaded. */
export interface Referential {
  territories: Territory[];
  parties: Party[];
  state_sites: StateSite[];
  tools: Tool[];
  ballot: Ballot;
}
