/*
 * Local tool of the Boussole citoyenne. Node 26 runs this TypeScript file directly (type stripping).
 *
 *   node tools/cli.ts check                 validates data/*.json against src/types.ts   (npm run check)
 *   node tools/cli.ts links [--all]          tests every current URL of data/*.json      (npm run links)
 *   node tools/cli.ts parliament             writes data/parliament-current.json        (npm run parliament)
 *   node tools/cli.ts cantonal-parliaments   writes data/cantonal-parliaments.json      (npm run cantonal-parliaments)
 *
 * Console messages are in French: the maintainers read them in French.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  DATA_FILES,
  PARLIAMENT_FUNCTIONS,
  type CantonalParliamentsFile,
  type Parliament,
  type ParliamentFile,
  type PartiesFile,
  type Referential,
  type TerritoriesFile,
} from "../src/types.ts";
import { TOOLS_PAGE_IDS, STATE_SITE_IDS, TOOL_IDS } from "../src/site/links.ts";
import { holds, isFederalCouncillor, membersOf, ownMandates } from "../src/site/parliament.ts";
import {
  CANTONAL_PARLIAMENTS,
  CANTONAL_PARTIES,
  cantonalSummary,
  checkCantonalParliaments,
  coveredCantons,
  extractTable,
  unmappedSeats,
} from "./cantonal-parliaments.ts";
import { checkCantonalGovernments, governmentsSummary, staleMembers, STALE_AFTER_DAYS } from "./cantonal-governments.ts";
import { checkPresidencies, stalePresidencies } from "./party-presidencies.ts";
import { readWorkbook } from "./xlsx.ts";
import { checkFile, entryLabel, isPlainObject, Report } from "./schema.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const USER_AGENT = "Mozilla/5.0 (compatible; civic-compass-link-checker)";

const HELP = `Outil local de la Boussole citoyenne.

  npm run check                        contrôle data/*.json (types de src/types.ts, ids, territoires, statuts)
  npm run links [-- --all]             teste les URL actuelles de data/*.json (--all : affiche aussi les liens OK)
  npm run parliament                   écrit data/${DATA_FILES.parliament.file} (clé PARL_API_KEY ou ~/.config/civic-compass/env)
  npm run cantonal-parliaments         écrit data/${DATA_FILES.cantonal_parliaments.file} (tableau OFS ${CANTONAL_PARLIAMENTS.orderNr})

Options communes : --data DOSSIER (par défaut data/).`;

/* ====================================================================== */
/* check                                                                   */
/* ====================================================================== */

type LoadResult = { data: Referential | null; errors: string[] };

/** Reads data/*.json and validates every file against the schemas of src/types.ts. */
function loadReferential(dataDir: string): LoadResult {
  const report = new Report();
  const raw: Record<string, unknown> = {};
  for (const [key, { file, schema }] of Object.entries(DATA_FILES)) {
    const label = `data/${file}`;
    let content: unknown;
    try {
      content = JSON.parse(readFileSync(join(dataDir, file), "utf8"));
    } catch (e) {
      report.add([label], `illisible (${(e as Error).message})`);
      continue;
    }
    checkFile(content, schema, label, report);
    raw[key] = (content as Record<string, unknown>)[key];
  }
  if (report.errors.length) return { data: null, errors: report.errors };
  return { data: raw as unknown as Referential, errors: [] };
}

/** Rules across entries and files, which types alone cannot express. */
function checkConsistency(d: Referential): string[] {
  const report = new Report();
  const codes = new Set<string>();
  d.territories.forEach((t, i) => {
    if (codes.has(t.code)) report.add(["data/territories.json", entryLabel(t, i)], "code en double");
    codes.add(t.code);
  });
  if (!codes.has("CH")) report.add(["data/territories.json"], "territoire « CH » manquant");

  const ids = new Set<string>();
  const lists = [
    { file: "data/parties.json", entries: d.parties, territorial: true },
    { file: "data/state-sites.json", entries: d.state_sites, territorial: true },
    { file: "data/tools.json", entries: d.tools, territorial: false },
  ];
  for (const { file, entries, territorial } of lists) {
    entries.forEach((x, i) => {
      const at = [file, entryLabel(x, i)];
      if (ids.has(x.id)) report.add(at, "id en double (les id sont uniques dans parties, state-sites et tools)");
      ids.add(x.id);
      const territory = (x as { territory?: string }).territory;
      if (territorial && !codes.has(territory as string)) report.add(at, `territoire inconnu « ${territory} »`);
      if ((x.url === null) !== (x.status === "not_found")) report.add(at, "url null si et seulement si status vaut not_found");
    });
  }

  const chParties = d.parties.filter((p) => p.territory === "CH");
  const abbrs = new Set<string>();
  for (const p of chParties) {
    if (abbrs.has(p.abbr)) report.add(["data/parties.json", `parti ${p.id}`], `abréviation « ${p.abbr} » en double parmi les partis CH`);
    abbrs.add(p.abbr);
  }
  const itemIds = new Set<string>();
  d.ballot.items.forEach((o, i) => {
    const at = ["data/ballot.json", `items ${entryLabel(o, i)}`];
    if (itemIds.has(o.id)) report.add(at, "id en double");
    itemIds.add(o.id);
    for (const k of Object.keys(o.parties)) {
      if (!abbrs.has(k)) report.add(at, `parti « ${k} » absent des partis CH (abbr) de parties.json`);
    }
  });
  for (const code of Object.keys(d.ballot.cantons)) {
    if (code === "CH" || !codes.has(code)) report.add(["data/ballot.json", "cantons"], `canton inconnu « ${code} »`);
  }

  // Left-right scores: an inherited score must copy the score of a CH party that has its own.
  const byId = new Map(d.parties.map((p) => [p.id, p]));
  d.parties.forEach((p, i) => {
    const lr = p.left_right;
    if (!lr?.inherited_from) return;
    const at = ["data/parties.json", entryLabel(p, i)];
    const from = byId.get(lr.inherited_from);
    if (!from || from.territory !== "CH" || !from.left_right || from.left_right.inherited_from) {
      report.add(at, `left_right.inherited_from « ${lr.inherited_from} » doit être un parti CH avec son propre score`);
    } else if (from.left_right.value !== lr.value || from.left_right.dataset !== lr.dataset || from.left_right.source !== lr.source) {
      report.add(at, `left_right hérité de « ${lr.inherited_from} » : value, dataset et source doivent être identiques`);
    }
  });

  for (const e of checkParliament(d.parliament, abbrs)) report.add([`data/${DATA_FILES.parliament.file}`], e);
  for (const e of checkCantonalParliaments(d.cantonal_parliaments, d.territories, d.parties)) {
    report.add([`data/${DATA_FILES.cantonal_parliaments.file}`], e);
  }
  for (const e of checkCantonalGovernments(d.cantonal_governments, d.territories, d.parties)) {
    report.add([`data/${DATA_FILES.cantonal_governments.file}`], e);
  }
  for (const e of checkPresidencies(d.parties)) report.add(["data/parties.json"], e);

  // Entries the site links to by id (src/site/links.ts).
  // The site shows only verified links, so an entry it links to directly must be verified.
  const linked = (file: string, entries: { id: string; status: string }[], wanted: readonly string[], needVerified: boolean) => {
    for (const id of wanted) {
      const entry = entries.find((x) => x.id === id);
      if (!entry) report.add([file], `id « ${id} » utilisé par le site (src/site/links.ts) mais absent`);
      else if (needVerified && entry.status !== "verified") report.add([file, id], "le site renvoie vers cette entrée, son lien doit être verified");
    }
  };
  linked("data/state-sites.json", d.state_sites, Object.values(STATE_SITE_IDS), true);
  linked("data/tools.json", d.tools, Object.values(TOOL_IDS), true);
  linked("data/tools.json", d.tools, [...TOOLS_PAGE_IDS.understand, ...TOOLS_PAGE_IDS.compare], false);

  return report.errors;
}

function cmdCheck(dataDir: string): number {
  const { data, errors } = loadReferential(dataDir);
  const all = data ? checkConsistency(data) : errors;
  if (all.length) {
    console.error(all.join("\n"));
    console.error(`\n${all.length} erreur(s) dans ${dataDir}.` + (data ? "" : " Contrôles croisés non lancés : corrigez d'abord la forme des fichiers."));
    return 1;
  }
  const d = data as Referential;
  console.log(
    `Référentiel valide : ${d.territories.length} territoires, ${d.parties.length} partis, ${d.state_sites.length} sites officiels, ` +
      `${d.tools.length} outils, ${d.ballot.items.length} objets en votation, ` +
      `Parlement au ${d.parliament.retrieved_on} (${parliamentSummary(d.parliament)}), ` +
      `parlements cantonaux au ${d.cantonal_parliaments.retrieved_on} (${cantonalSummary(d.cantonal_parliaments, d.territories, d.parties)}), ` +
      `gouvernements cantonaux (${governmentsSummary(d.cantonal_governments)}), ` +
      `présidences de parti (${d.parties.filter((p) => p.facts?.presidency).length}).`,
  );
  const today = new Date().toISOString().slice(0, 10);
  const stale = staleMembers(d.cantonal_governments, today);
  if (stale.length) {
    console.log(`\nAvis (ne bloque pas) : fiches de gouvernement vérifiées il y a plus de ${STALE_AFTER_DAYS} jours, à revérifier sur la page officielle :\n` + stale.join("\n"));
  }
  const stalePresidents = stalePresidencies(d.parties, today);
  if (stalePresidents.length) {
    console.log(`\nAvis (ne bloque pas) : présidences de parti vérifiées il y a plus de ${STALE_AFTER_DAYS} jours, à revérifier sur le site du parti :\n` + stalePresidents.join("\n"));
  }
  const notes = orderNotes(d);
  if (notes.length) console.log("\nAvis (ne bloque pas, le classement reste indicatif) :\n" + notes.join("\n"));
  return 0;
}

/**
 * Aid for the maintainers: within a territory, parties are shown in the order of parties.json.
 * Lists each pair whose left_right scores contradict that order. Parties without a score are skipped.
 */
function orderNotes(d: Referential): string[] {
  const notes: string[] = [];
  for (const code of new Set(d.parties.map((p) => p.territory))) {
    const scored = d.parties.filter((p) => p.territory === code && p.left_right);
    for (let i = 1; i < scored.length; i++) {
      const prev = scored[i - 1], cur = scored[i];
      if (prev?.left_right && cur?.left_right && cur.left_right.value < prev.left_right.value) {
        notes.push(`  ${code} : ${cur.id} (${cur.left_right.value}) est placé à droite de ${prev.id} (${prev.left_right.value})`);
      }
    }
  }
  return notes;
}

/* ====================================================================== */
/* links                                                                   */
/* ====================================================================== */

const CONCURRENCY = 8;
const TIMEOUT_MS = 25_000;
const ATTEMPTS = 3;
const BACKOFF_MS = [1_000, 3_000];

/**
 * blocked: 403/429, the site refuses robots. unreachable: no answer in time after every attempt
 * (some Swiss sites do not answer servers abroad, such as CI runners). Both are listed for a manual
 * check and do not fail the run; a refused connection, a DNS error or a 404 do.
 */
type Verdict = "ok" | "redirected" | "elsewhere" | "blocked" | "unreachable" | "broken";
interface LinkResult {
  url: string;
  verdict: Verdict;
  status: number;
  note: string;
}

/**
 * Every current URL of a JSON document, with where it was found: the id of the nearest entry,
 * else the path of keys (ballot.cantons.VS.url). Skips "previous_urls".
 */
function collectUrls(value: unknown, file: string, owner: string, out: Map<string, Set<string>>): void {
  if (Array.isArray(value)) {
    for (const v of value) collectUrls(v, file, owner, out);
  } else if (isPlainObject(value)) {
    const id = typeof value.id === "string" ? value.id : null;
    for (const [k, v] of Object.entries(value)) {
      if (k === "previous_urls") continue;
      collectUrls(v, file, id ?? (owner ? `${owner}.${k}` : k), out);
    }
  } else if (typeof value === "string" && /^https?:\/\//.test(value)) {
    const where = owner ? `${file} : ${owner}` : file;
    if (!out.has(value)) out.set(value, new Set());
    out.get(value)?.add(where);
  }
}

/** Multi-label public suffixes we may meet. Swiss addresses (.ch, .swiss) and .eu, .com... are single-label. */
const MULTI_LABEL_SUFFIXES = new Set(["co.uk", "org.uk", "ac.uk", "gov.uk", "com.au", "co.nz", "co.jp", "com.br"]);
/** "www.bk.admin.ch" -> "admin.ch" */
function registeredDomain(hostname: string): string {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  if (/^[\d.]+$/.test(h) || h.includes(":")) return h; // IP address
  const labels = h.split(".");
  const keep = MULTI_LABEL_SUFFIXES.has(labels.slice(-2).join(".")) ? 3 : 2;
  return labels.slice(-keep).join(".");
}

/**
 * Sites whose HTTPS certificate is known to be invalid and that the maintainer chose to show
 * anyway: listed for a manual check instead of failing the run. Visitors still get the browser's
 * security warning. Remove an entry as soon as the site fixes its certificate.
 */
const ACCEPTED_CERT_ISSUES: Record<string, string> = {
  "popjura.ch": "certificat au nom de pst-pop.ch, retenu par le mainteneur le 2026-11-16",
};

/**
 * Registered domains run by the same owner: a redirect between them is not "elsewhere".
 * GitHub serves release downloads from its storage domain.
 */
const SAME_OWNER: string[][] = [["github.com", "githubusercontent.com"]];
function sameOwner(a: string, b: string): boolean {
  return a === b || SAME_OWNER.some((group) => group.includes(a) && group.includes(b));
}

function sameAddress(a: string, b: string): boolean {
  return a.replace(/\/$/, "") === b.replace(/\/$/, "");
}
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A transient failure (network error, timeout, 5xx) is retried before the link is called broken. */
async function checkLink(url: string): Promise<LinkResult> {
  let last: LinkResult = { url, verdict: "broken", status: 0, note: "" };
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(BACKOFF_MS[attempt - 1] ?? 3_000);
    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml,*/*;q=0.8", "Accept-Language": "fr-CH,fr" },
      });
      await res.body?.cancel().catch(() => {});
      const final = res.url || url;
      // First, whatever the status: an address now serving another site (a parked domain, a search engine) is not the right one.
      if (!sameOwner(registeredDomain(new URL(url).hostname), registeredDomain(new URL(final).hostname))) {
        return { url, verdict: "elsewhere", status: res.status, note: `redirigé ailleurs : ${final}` };
      }
      if (res.status === 403 || res.status === 429) {
        return { url, verdict: "blocked", status: res.status, note: "le site refuse les robots, à vérifier à la main" };
      }
      if (res.status >= 500) {
        last = { url, verdict: "broken", status: res.status, note: `erreur du serveur ${res.status} ${res.statusText}`.trim() + `, après ${attempt + 1} essai(s)` };
        continue;
      }
      if (!res.ok) return { url, verdict: "broken", status: res.status, note: `${res.status} ${res.statusText}`.trim() };
      if (!sameAddress(final, url)) return { url, verdict: "redirected", status: res.status, note: `redirigé vers ${final}` };
      return { url, verdict: "ok", status: res.status, note: "" };
    } catch (e) {
      const err = e as Error & { cause?: { code?: string; message?: string } };
      const timedOut = err.name === "TimeoutError" || /TIMEOUT/.test(err.cause?.code ?? "");
      const host = new URL(url).hostname;
      if (/^ERR_TLS_CERT|CERT_/.test(err.cause?.code ?? "") && host in ACCEPTED_CERT_ISSUES) {
        return { url, verdict: "blocked", status: 0, note: `certificat HTTPS invalide, exception acceptée : ${ACCEPTED_CERT_ISSUES[host]}` };
      }
      if (timedOut) {
        last = { url, verdict: "unreachable", status: 0, note: `pas de réponse en ${TIMEOUT_MS / 1000} s après ${attempt + 1} essai(s), à vérifier à la main` };
      } else {
        const reason = err.cause?.code || err.cause?.message || err.message;
        last = { url, verdict: "broken", status: 0, note: `${reason}, après ${attempt + 1} essai(s)` };
      }
    }
  }
  return last;
}

async function pool<T, R>(items: T[], size: number, f: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await f(items[i] as T);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return results;
}

const LABELS: Record<Verdict, string> = {
  broken: "CASSÉ   ",
  elsewhere: "AILLEURS",
  blocked: "À VOIR  ",
  unreachable: "À VOIR  ",
  redirected: "OK      ",
  ok: "OK      ",
};
const ORDER: Verdict[] = ["broken", "elsewhere", "unreachable", "blocked", "redirected", "ok"];

async function cmdLinks(dataDir: string, all: boolean): Promise<number> {
  const found = new Map<string, Set<string>>();
  for (const name of readdirSync(dataDir).filter((f) => f.endsWith(".json")).sort()) {
    collectUrls(JSON.parse(readFileSync(join(dataDir, name), "utf8")), `data/${name}`, "", found);
  }
  const urls = [...found.keys()].sort();
  console.log(`Test de ${urls.length} liens (anciennes adresses previous_urls exclues)...\n`);
  const results = await pool(urls, CONCURRENCY, checkLink);
  results.sort((a, b) => ORDER.indexOf(a.verdict) - ORDER.indexOf(b.verdict) || a.url.localeCompare(b.url));
  for (const r of results) {
    if ((r.verdict === "ok" || r.verdict === "redirected") && !all) continue;
    const where = [...(found.get(r.url) ?? [])].join(" ; ");
    console.log(`${LABELS[r.verdict]} ${r.status || "---"}  ${r.url}` + (r.note ? `   (${r.note})` : "") + `   [${where}]`);
  }
  const count = (v: Verdict) => results.filter((r) => r.verdict === v).length;
  const ok = count("ok") + count("redirected");
  const failing = count("broken") + count("elsewhere");
  console.log(
    `\n${results.length} liens : ${ok} OK (dont ${count("redirected")} redirigé(s) sur le même domaine), ` +
      `${count("broken")} cassé(s), ${count("elsewhere")} redirigé(s) ailleurs, ${count("blocked") + count("unreachable")} à vérifier à la main.`,
  );
  if (failing) console.log("Échec : corrigez les liens cassés ou redirigés ailleurs dans data/ (gardez l'ancienne adresse dans previous_urls).");
  return failing ? 1 : 0;
}

/* ====================================================================== */
/* parliament                                                              */
/* ====================================================================== */

/** Current federal composition, from the Parliament's API (ws.parl.ch). Research-0002, owner rulings 2 to 4 and 7. */
const PARLIAMENT = {
  endpoint: "https://ws.parl.ch/api/v1/persons",
  apiDocs: "https://ws.parl.ch/doc/v3/api-docs",
  termsPage: "https://www.parlament.ch/fr/%C3%BCber-das-parlament/faits-donnees-chifrees/open-data-web-services",
  attribution: "Source : Services du Parlement de l'Assemblée fédérale, Berne",
  license:
    "Conditions des Services Web du Parlement : source « Services du Parlement de l'Assemblée fédérale, Berne » et date de téléchargement affichées, " +
    "contenu des données inchangé, reproduction non présentée comme une publication officielle",
  /** Fields asked for: name, council, party, canton and Federal Council function only (no photo, address or date of birth, ruling 7). */
  include: [
    "id",
    "firstName",
    "lastName",
    "council.abbreviation",
    "party.shortName",
    "canton.abbreviation",
    "activeFederalCouncilMandates.department.abbreviation",
    "activeFederalCouncilMandates.department.name",
    "activeFederalCouncilMandates.function.key",
    "activeFederalCouncilMandates.function.name",
  ],
  pageSize: 300, // the API's maximum
  keyFile: join(homedir(), ".config", "civic-compass", "env"),
  /** Seats of each chamber and members of the Federal Council. */
  sizes: { CN: 200, CE: 46, federalCouncil: 7 },
};

/**
 * API party short name -> abbr of a CH party in parties.json (ruling 4: PLD of Basel-Stadt counts
 * with the PLR, Al of Zug with the Greens, as the OFS does). MCG, Lega, UDF and "-" (no party)
 * have no CH party on the site and stay as they are.
 */
const PARLIAMENT_PARTIES: Record<string, string> = {
  PSS: "PS", "M-E": "Centre", "VERT-E-S": "Verts", pvl: "PVL", PLR: "PLR", UDC: "UDC", PEV: "PEV",
  PLD: "PLR", Al: "Verts",
};

function parliamentSummary(p: Parliament): string {
  return `${membersOf(p, "CN").length} au Conseil national, ${membersOf(p, "CE").length} au Conseil des États, ${p.persons.filter(isFederalCouncillor).length} au Conseil fédéral`;
}

/** Rules on the generated file: sizes of the bodies, one President, Vice-President and Chancellor, known abbreviations. */
function checkParliament(p: Parliament, chAbbrs: Set<string>): string[] {
  const errors: string[] = [];
  const ids = new Set<number>();
  for (const x of p.persons) {
    if (ids.has(x.id)) errors.push(`personne ${x.id} en double`);
    ids.add(x.id);
  }
  for (const council of ["CN", "CE"] as const) {
    const n = membersOf(p, council).length;
    if (n !== PARLIAMENT.sizes[council]) errors.push(`${n} membres actifs au ${council} au lieu de ${PARLIAMENT.sizes[council]}`);
  }
  const fc = p.persons.filter(isFederalCouncillor);
  if (fc.length !== PARLIAMENT.sizes.federalCouncil) errors.push(`${fc.length} membres du Conseil fédéral au lieu de ${PARLIAMENT.sizes.federalCouncil}`);
  for (const x of fc) {
    const own = ownMandates(x);
    if (own.length !== 1) errors.push(`${x.firstName} ${x.lastName} : ${own.length} départements comme titulaire au lieu de 1`);
    if (x.council) errors.push(`${x.firstName} ${x.lastName} : membre du Conseil fédéral et du ${x.council.abbreviation}`);
  }
  const roles: [string, string][] = [
    [PARLIAMENT_FUNCTIONS.president, "président·e de la Confédération"],
    [PARLIAMENT_FUNCTIONS.vicePresident, "vice-président·e de la Confédération"],
    [PARLIAMENT_FUNCTIONS.chancellor, "chancelier·ère de la Confédération"],
  ];
  for (const [fn, label] of roles) {
    const n = p.persons.filter((x) => holds(x, fn)).length;
    if (n !== 1) errors.push(`${n} ${label} au lieu de 1`);
  }
  for (const [label, abbr] of Object.entries(p.party_mapping)) {
    if (!chAbbrs.has(abbr)) errors.push(`party_mapping « ${label} » : parti « ${abbr} » absent des partis CH (abbr) de parties.json`);
  }
  return errors;
}

/** The key from the environment, else from the maintainer's file. Never printed, never written. */
function parliamentApiKey(): string | null {
  const fromEnv = process.env.PARL_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  let text: string;
  try {
    text = readFileSync(PARLIAMENT.keyFile, "utf8");
  } catch {
    return null;
  }
  const m = /^\s*(?:export\s+)?PARL_API_KEY\s*=\s*["']?([^"'\s]+)["']?\s*$/m.exec(text);
  return m?.[1] ?? null;
}

async function cmdParliament(dataDir: string): Promise<number> {
  const key = parliamentApiKey();
  if (!key) {
    console.error(`Clé de l'API du Parlement introuvable : définissez PARL_API_KEY ou écrivez PARL_API_KEY=... dans ${PARLIAMENT.keyFile} (droits 600).`);
    return 2;
  }
  const query = (page: number) => {
    const url = new URL(PARLIAMENT.endpoint);
    url.searchParams.set("lang", "fr");
    url.searchParams.set("q", "eq(active,true)");
    url.searchParams.set("include", PARLIAMENT.include.join(","));
    url.searchParams.set("sort", "id:asc");
    url.searchParams.set("size", String(PARLIAMENT.pageSize));
    url.searchParams.set("page", String(page));
    return url;
  };
  const persons: unknown[] = [];
  for (let page = 0; ; page++) {
    const url = query(page);
    let body: { content?: unknown; page?: { hasNext?: unknown } };
    try {
      const res = await fetch(url, { headers: { "X-API-KEY": key, Accept: "application/json", "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(60_000) });
      if (!res.ok) {
        console.error(`Téléchargement impossible : ${res.status} ${res.statusText} (${url}). Rien n'est écrit.`);
        return 2;
      }
      body = (await res.json()) as typeof body;
    } catch (e) {
      console.error(`Téléchargement impossible : ${(e as Error).message} (${url}). Rien n'est écrit.`);
      return 2;
    }
    if (!Array.isArray(body.content)) {
      console.error(`Réponse inattendue de l'API (pas de liste « content ») : rien n'est écrit.`);
      return 1;
    }
    persons.push(...body.content);
    if (body.page?.hasNext !== true) break;
  }

  const output = {
    _readme:
      "Généré par « npm run parliament » depuis l'API du Parlement (ws.parl.ch) : ne pas modifier à la main, relancer la commande. " +
      "persons : la réponse de l'API telle quelle (champs demandés par include) ; party_mapping : correspondance, tenue à part, entre les partis de l'API et les partis CH de parties.json.",
    parliament: {
      request: `GET ${query(0)} (en-tête X-API-KEY)`,
      api_docs: PARLIAMENT.apiDocs,
      terms_page: PARLIAMENT.termsPage,
      attribution: PARLIAMENT.attribution,
      license: PARLIAMENT.license,
      retrieved_on: new Date().toISOString().slice(0, 10),
      persons,
      party_mapping: PARLIAMENT_PARTIES,
    },
  };

  // Same checks as `npm run check`, before writing: a file that would fail is never written.
  const file = `data/${DATA_FILES.parliament.file}`;
  const report = new Report();
  checkFile(output, DATA_FILES.parliament.schema, file, report);
  if (report.errors.length) {
    console.error(report.errors.slice(0, 20).join("\n"));
    console.error(`\nLa réponse de l'API ne suit pas src/types.ts (${report.errors.length} erreur(s)) : rien n'est écrit.`);
    return 1;
  }
  const parliament = (output as unknown as ParliamentFile).parliament;
  const parties = JSON.parse(readFileSync(join(dataDir, DATA_FILES.parties.file), "utf8")) as { parties: { territory: string; abbr: string }[] };
  const errors = checkParliament(parliament, new Set(parties.parties.filter((p) => p.territory === "CH").map((p) => p.abbr)));
  if (errors.length) {
    console.error(errors.join("\n"));
    console.error(`\nComposition inattendue : rien n'est écrit.`);
    return 1;
  }

  const out = join(dataDir, DATA_FILES.parliament.file);
  writeFileSync(out, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(`Écrit ${relative(ROOT, out)} : ${parliament.persons.length} personnes actives, ${parliamentSummary(parliament)}.`);
  const members = parliament.persons.filter((x) => x.council);
  const unmapped = [...new Set(members.map((x) => x.party?.shortName ?? "(aucun)"))].filter((l) => !(l in PARLIAMENT_PARTIES));
  if (unmapped.length) console.log("Sans parti CH correspondant (normal pour les partis absents du site) :", unmapped.join(", "));
  return 0;
}

/* ====================================================================== */
/* cantonal-parliaments                                                    */
/* ====================================================================== */

async function fetchOk(url: string, accept: string): Promise<Response> {
  const res = await fetch(url, { headers: { Accept: accept, "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} (${url})`);
  return res;
}

type DamAsset = {
  ids?: { damId?: unknown };
  bfs?: { lifecycleGroup?: unknown };
  description?: { categorization?: { termsOfUse?: { code?: unknown }[] } };
};

/** Seats per party at the latest election of each covered cantonal parliament, from the OFS (Research-0002 Q4, owner rulings 1, 5 and 6). */
async function cmdCantonalParliaments(dataDir: string): Promise<number> {
  const read = <T,>(key: keyof typeof DATA_FILES) => JSON.parse(readFileSync(join(dataDir, DATA_FILES[key].file), "utf8")) as T;
  const { territories } = read<TerritoriesFile>("territories");
  const { parties } = read<PartiesFile>("parties");

  // The OFS keeps one current version of the table and marks the older ones as redundant.
  let damId: number;
  let workbook: Buffer;
  try {
    const search = (await (await fetchOk(CANTONAL_PARLIAMENTS.search, "application/json")).json()) as { data?: DamAsset[] };
    const current = (search.data ?? []).filter((a) => a.bfs?.lifecycleGroup === "CURRENT");
    if (current.length !== 1 || typeof current[0].ids?.damId !== "number") {
      console.error(`${current.length} version(s) courante(s) du tableau ${CANTONAL_PARLIAMENTS.orderNr} au lieu de 1 : rien n'est écrit.`);
      return 1;
    }
    damId = current[0].ids.damId;
    const asset = (await (await fetchOk(CANTONAL_PARLIAMENTS.asset(damId), "application/json")).json()) as DamAsset;
    const terms = (asset.description?.categorization?.termsOfUse ?? []).map((t) => t.code);
    if (terms.length !== 1 || terms[0] !== CANTONAL_PARLIAMENTS.terms) {
      console.error(`Conditions d'utilisation du tableau changées (${terms.join(", ") || "aucune"} au lieu de ${CANTONAL_PARLIAMENTS.terms}) : rien n'est écrit.`);
      return 1;
    }
    workbook = Buffer.from(await (await fetchOk(CANTONAL_PARLIAMENTS.master(damId), "*/*")).arrayBuffer());
  } catch (e) {
    console.error(`Téléchargement impossible : ${(e as Error).message}. Rien n'est écrit.`);
    return 2;
  }

  let table;
  try {
    table = extractTable(readWorkbook(workbook), coveredCantons(territories, parties).map((t) => t.name));
  } catch (e) {
    console.error(`Tableau OFS illisible : ${(e as Error).message}. Rien n'est écrit.`);
    return 1;
  }

  const output: CantonalParliamentsFile = {
    _readme:
      "Généré par « npm run cantonal-parliaments » depuis le tableau OFS je-f-17.02.05.01.03 : ne pas modifier à la main, relancer la commande. " +
      "columns, rows et notes : le tableau tel quel (résultats au jour de l'élection, sans les changements de groupe ultérieurs) ; " +
      "party_mapping : correspondance, tenue à part, entre les colonnes de l'OFS et les partis du canton dans parties.json.",
    cantonal_parliaments: {
      request: `GET ${CANTONAL_PARLIAMENTS.search}`,
      asset_url: CANTONAL_PARLIAMENTS.master(damId),
      title: table.title,
      table: table.table,
      sheet: table.sheet,
      attribution: CANTONAL_PARLIAMENTS.attribution,
      license: CANTONAL_PARLIAMENTS.license,
      retrieved_on: new Date().toISOString().slice(0, 10),
      columns: table.columns,
      rows: table.rows,
      notes: table.notes,
      party_mapping: CANTONAL_PARTIES,
    },
  };

  // Same checks as `npm run check`, before writing: a file that would fail is never written.
  const report = new Report();
  checkFile(output, DATA_FILES.cantonal_parliaments.schema, `data/${DATA_FILES.cantonal_parliaments.file}`, report);
  const p = output.cantonal_parliaments;
  const errors = [...report.errors, ...checkCantonalParliaments(p, territories, parties)];
  if (errors.length) {
    console.error(errors.join("\n"));
    console.error(`\nTableau inattendu : rien n'est écrit.`);
    return 1;
  }

  const out = join(dataDir, DATA_FILES.cantonal_parliaments.file);
  writeFileSync(out, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(`Écrit ${relative(ROOT, out)} : ${cantonalSummary(p, territories, parties)}, tableau ${p.table} « ${p.sheet} ».`);
  const unmapped = unmappedSeats(p, territories, parties);
  if (unmapped.length) console.log("Sièges sans parti du canton sur le site (affichés sous le libellé de l'OFS) :\n" + unmapped.join("\n"));
  return 0;
}

/* ====================================================================== */

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      data: { type: "string", default: "data" },
      all: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  const command = positionals[0];
  if (values.help || !command) {
    console.log(HELP);
    return values.help ? 0 : 2;
  }
  switch (command) {
    case "check":
      return cmdCheck(resolve(ROOT, values.data));
    case "links":
      return cmdLinks(resolve(ROOT, values.data), values.all);
    case "parliament":
      return cmdParliament(resolve(ROOT, values.data));
    case "cantonal-parliaments":
      return cmdCantonalParliaments(resolve(ROOT, values.data));
    default:
      console.error(`Commande inconnue « ${command} ».\n\n${HELP}`);
      return 2;
  }
}

try {
  process.exitCode = await main();
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 2;
}
