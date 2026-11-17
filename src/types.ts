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
    | { readonly kind: "number" } // any finite number, decimals allowed
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

/**
 * Left-right score of a party from a published survey. An aid for the maintainers to order
 * the parties (the order shown stays indicative and editorial): never shown on the site.
 * A cantonal section inherits the score of its national party: `inherited_from` names that
 * party's id and the value, dataset and source are copied from it.
 */
export interface LeftRight {
  value: number;
  /** E.g. "0 = extrême gauche, 10 = extrême droite". */
  scale: string;
  /** E.g. "CHES 2024, variable lrgen". */
  dataset: string;
  source: string;
  checked_on: string;
  inherited_from?: string;
}
export const LEFT_RIGHT_SCHEMA: Schema<LeftRight> = {
  value: { kind: "number" },
  scale: { kind: "string" },
  dataset: { kind: "string" },
  source: { kind: "url" },
  checked_on: { kind: "date" },
  inherited_from: { kind: "string", optional: true },
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
  left_right?: LeftRight;
}
export const PARTY_SCHEMA: Schema<Party> = {
  ...LINK_ENTRY_SCHEMA,
  territory: { kind: "string" },
  abbr: { kind: "string" },
  short: { kind: "string" },
  position: { kind: "string" },
  facts: { kind: "object", schema: PARTY_FACTS_SCHEMA, optional: true },
  left_right: { kind: "object", schema: LEFT_RIGHT_SCHEMA, optional: true },
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
/** A party may also leave the vote free ("liberté de vote"), when its own source says so. */
export const PARTY_RECOMMENDATIONS = ["yes", "no", "free"] as const;
export type PartyRecommendation = (typeof PARTY_RECOMMENDATIONS)[number];

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
  parties: Record<string, PartyRecommendation>;
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
  parties: { kind: "record", value: { kind: "enum", values: PARTY_RECOMMENDATIONS } },
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

/* ---------- Seats (generated by `npm run seats`, never edited by hand) ---------- */

/**
 * National Council seats per party, extracted from the OFS results file. The whole file is
 * written by the command: rerun it rather than editing it. The site shows a party's seats
 * with the source, as a sourced fact (PRD-0001 goal 2).
 */
export interface Seats {
  /** As shown to voters, e.g. "Conseil national 2023". */
  election: string;
  /** Number of seats of the chamber: `npm run check` requires the national rows to add up to it. */
  total: number;
  /** The CSV file read. */
  source: string;
  /** The dataset page where the file and its terms of use are published. */
  dataset_page: string;
  /** Short attribution shown next to the figures, required by the terms of use. */
  attribution: string;
  license: string;
  retrieved_on: string;
  /** Columns of the CSV used: party name, elected count, result level (only the national level is read). */
  columns: SeatsColumns;
  /** Every national row, by the OFS party name. */
  raw: Record<string, number>;
  /** Seats by `abbr` of a CH party in parties.json. */
  parties: Record<string, number>;
}
export interface SeatsColumns {
  name: string;
  seats: string;
  level: string;
}
export const SEATS_SCHEMA: Schema<Seats> = {
  election: { kind: "string" },
  total: { kind: "integer" },
  source: { kind: "url" },
  dataset_page: { kind: "url" },
  attribution: { kind: "string" },
  license: { kind: "string" },
  retrieved_on: { kind: "date" },
  columns: { kind: "object", schema: { name: { kind: "string" }, seats: { kind: "string" }, level: { kind: "string" } } satisfies Schema<SeatsColumns> },
  raw: { kind: "record", value: { kind: "integer" } },
  parties: { kind: "record", value: { kind: "integer" } },
};

/* ---------- Parliament (generated by `npm run parliament`, never edited by hand) ---------- */

/**
 * Current composition of the federal chambers and the Federal Council, from the Parliament's API
 * (ws.parl.ch). The terms of use require the data to stay unchanged: `persons` holds the API's
 * answer as it came (only the fields asked for with `include`), and the mapping to the site's
 * parties is kept apart in `party_mapping` (Research-0002, owner ruling 3).
 */
export interface Parliament {
  /** The request sent, without the API key (it goes in a header). Not a link: the API refuses calls without a key. */
  request: string;
  /** The public description of the API. */
  api_docs: string;
  /** The page that publishes the terms of use. */
  terms_page: string;
  /** Shown next to every figure, required by the terms of use. */
  attribution: string;
  license: string;
  /** Download date, shown next to every figure. */
  retrieved_on: string;
  /** Every active person (members of both chambers, the Federal Council and the Federal Chancellery), sorted by id. */
  persons: ParliamentPerson[];
  /** API party short name -> `abbr` of a CH party in parties.json. Labels absent here have no CH party on the site (MCG, Lega, UDF, "-"). */
  party_mapping: Record<string, string>;
}
/** A person as the API returns it (field names of the API, in camelCase). */
export interface ParliamentPerson {
  id: number;
  firstName: string;
  lastName: string;
  /** null for the Federal Council and the Federal Chancellery. */
  council: { abbreviation: string } | null;
  /** null when the API records no party; "-" is the API's label for members without a party. */
  party: { shortName: string } | null;
  canton: { abbreviation: string } | null;
  activeFederalCouncilMandates: FederalCouncilMandate[];
}
export interface FederalCouncilMandate {
  department: { abbreviation: string; name: string };
  /** `key` identifies the function (see PARLIAMENT_FUNCTIONS); `name` is its French label. */
  function: { key: string; name: string };
}
/** Function keys of the API (master data category 160), seen on 2026-11-17. */
export const PARLIAMENT_FUNCTIONS = {
  president: "1601000",
  vicePresident: "1601002",
  federalCouncillor: "1601001",
  deputy: "1601003", // "Suppléant/e": stands in for another department, not the member's own
  chancellor: "1601004",
  viceChancellor: "1601005",
} as const;
const FEDERAL_COUNCIL_MANDATE_SCHEMA: Schema<FederalCouncilMandate> = {
  department: { kind: "object", schema: { abbreviation: { kind: "string" }, name: { kind: "string" } } },
  function: { kind: "object", schema: { key: { kind: "string" }, name: { kind: "string" } } },
};
const PARLIAMENT_PERSON_SCHEMA: Schema<ParliamentPerson> = {
  id: { kind: "integer" },
  firstName: { kind: "string" },
  lastName: { kind: "string" },
  council: { kind: "object", nullable: true, schema: { abbreviation: { kind: "string" } } },
  party: { kind: "object", nullable: true, schema: { shortName: { kind: "string" } } },
  canton: { kind: "object", nullable: true, schema: { abbreviation: { kind: "string" } } },
  activeFederalCouncilMandates: { kind: "list", item: { kind: "object", schema: FEDERAL_COUNCIL_MANDATE_SCHEMA } },
};
export const PARLIAMENT_SCHEMA: Schema<Parliament> = {
  request: { kind: "string" },
  api_docs: { kind: "url" },
  terms_page: { kind: "url" },
  attribution: { kind: "string" },
  license: { kind: "string" },
  retrieved_on: { kind: "date" },
  persons: { kind: "list", item: { kind: "object", schema: PARLIAMENT_PERSON_SCHEMA } },
  party_mapping: { kind: "record", value: { kind: "string" } },
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
export interface SeatsFile {
  _readme: string;
  seats: Seats;
}
export interface ParliamentFile {
  _readme: string;
  parliament: Parliament;
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
  seats: {
    file: "seats-national-council-2023.json",
    schema: { _readme: { kind: "string" }, seats: { kind: "object", schema: SEATS_SCHEMA } } satisfies Schema<SeatsFile>,
  },
  parliament: {
    file: "parliament-current.json",
    schema: { _readme: { kind: "string" }, parliament: { kind: "object", schema: PARLIAMENT_SCHEMA } } satisfies Schema<ParliamentFile>,
  },
} as const;

/** The whole referential, once loaded. */
export interface Referential {
  territories: Territory[];
  parties: Party[];
  state_sites: StateSite[];
  tools: Tool[];
  ballot: Ballot;
  seats: Seats;
  parliament: Parliament;
}
