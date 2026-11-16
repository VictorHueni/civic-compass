/*
 * The referential as the site sees it. data/*.json is bundled into the script at build time
 * (no fetch: the site must work when index.html is opened from disk). Entries without a URL
 * are left out of the lists; a party without a URL stays, its card offers a search instead.
 */
import territoriesFile from "../../data/territories.json";
import partiesFile from "../../data/parties.json";
import stateSitesFile from "../../data/state-sites.json";
import toolsFile from "../../data/tools.json";
import ballotFile from "../../data/ballot.json";
import type {
  Ballot,
  BallotFile,
  LinkEntry,
  PartiesFile,
  Party,
  StateSite,
  StateSitesFile,
  TerritoriesFile,
  Territory,
  Tool,
  ToolsFile,
} from "../types.ts";

/** An entry whose URL is known. */
export type Linked<T extends LinkEntry> = T & { url: string };

/** The JSON types inferred by TypeScript are too loose (plain strings); `npm run check` guarantees the shapes of src/types.ts. */
function checked<T>(json: unknown): T {
  return json as T;
}
const territories: Territory[] = checked<TerritoriesFile>(territoriesFile).territories;
const parties: Party[] = checked<PartiesFile>(partiesFile).parties;
const stateSites: StateSite[] = checked<StateSitesFile>(stateSitesFile).state_sites;
const allTools: Tool[] = checked<ToolsFile>(toolsFile).tools;

export const ballot: Ballot = checked<BallotFile>(ballotFile).ballot;

function hasUrl<T extends LinkEntry>(x: T): x is Linked<T> {
  return x.url !== null;
}

function partiesOf(code: string): Party[] {
  return parties.filter((p) => p.territory === code);
}
/** Official sites of a territory, the canton's own site first. */
function stateSitesOf(code: string): Linked<StateSite>[] {
  return stateSites.filter((s) => s.territory === code).filter(hasUrl);
}

export interface Level {
  parties: Party[];
  stateSites: Linked<StateSite>[];
}
export interface Canton extends Level {
  name: string;
  note: string;
}

/** The 26 cantons, covered or not, as [code, name]. */
export const allCantons: [string, string][] = territories.filter((t) => t.code !== "CH").map((t) => [t.code, t.name]);

export const federal: Level = { parties: partiesOf("CH"), stateSites: stateSitesOf("CH") };

/** Covered cantons: those with at least one party in data/parties.json. */
export const cantons: Record<string, Canton> = {};
for (const t of territories) {
  if (t.code === "CH" || !partiesOf(t.code).length) continue;
  cantons[t.code] = { name: t.name, note: t.note || "", parties: partiesOf(t.code), stateSites: stateSitesOf(t.code) };
}

/** Decision aids with a URL, in the order of data/tools.json. */
export const tools: Linked<Tool>[] = allTools.filter(hasUrl);

function urlOf(entries: LinkEntry[], file: string, id: string): string {
  const entry = entries.find((x) => x.id === id);
  if (!entry || entry.url === null) throw new Error(`${file} : aucune URL pour « ${id} »`);
  return entry.url;
}
export function stateSiteUrl(id: string): string {
  return urlOf(stateSites, "data/state-sites.json", id);
}
export function toolUrl(id: string): string {
  return urlOf(allTools, "data/tools.json", id);
}
