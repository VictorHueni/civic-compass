/*
 * Local tool of the Boussole citoyenne. Node 26 runs this TypeScript file directly (type stripping).
 *
 *   node tools/boussole.ts check            validates data/*.json against src/types.ts   (npm run check)
 *   node tools/boussole.ts links [--all]     tests every current URL of data/*.json      (npm run links)
 *   node tools/boussole.ts seats --show      shows the columns of the OFS file            (npm run seats -- --show)
 *   node tools/boussole.ts seats             writes data/seats-national-council-2023.json (npm run seats)
 *
 * Console messages are in French: the maintainers read them in French.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { DATA_FILES, type AnySchema, type Referential, type Rule } from "../src/types.ts";
import { AID_TOOL_IDS, STATE_SITE_IDS, TOOL_IDS } from "../src/site/links.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const USER_AGENT = "Mozilla/5.0 (compatible; boussole-citoyenne-outil-local)";
/** Party results, National Council elections 2023 (OFS, via opendata.swiss). */
const SEATS_URL = "https://ogd-static.voteinfo-app.ch/v4/ogd/sd-t-17.02-NRW2023-parteien-appendix.csv";
const SEATS_FILE = "seats-national-council-2023.json";

const HELP = `Outil local de la Boussole citoyenne.

  npm run check                        contrôle data/*.json (types de src/types.ts, ids, territoires, statuts)
  npm run links [-- --all]             teste les URL actuelles de data/*.json (--all : affiche aussi les liens OK)
  npm run seats -- --show              montre les colonnes du fichier de l'OFS
  npm run seats [-- --col-name N --col-seats N]
                                       écrit data/${SEATS_FILE}

Options communes : --data DOSSIER (par défaut data/).`;

/* ====================================================================== */
/* check                                                                   */
/* ====================================================================== */

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const URL_PATTERN = /^https?:\/\/\S+$/;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function isRealDate(s: string): boolean {
  if (!DATE.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
function show(v: unknown): string {
  return typeof v === "string" ? v : JSON.stringify(v);
}

/** Label of a list entry: its position from 1, and its id or code when it has one. */
function entryLabel(item: unknown, i: number): string {
  const key = isPlainObject(item) ? (item.id ?? item.code) : undefined;
  return `entrée ${i + 1}` + (typeof key === "string" ? ` (${key})` : "");
}

class Report {
  readonly errors: string[] = [];
  add(where: string[], message: string): void {
    const line = `${where.join(", ")} : ${message}`;
    if (!this.errors.includes(line)) this.errors.push(line);
  }
}

/** Checks `value` (the content of field `name`) against `rule`. */
function checkValue(value: unknown, rule: Rule, name: string, where: string[], report: Report): void {
  if (value === null) {
    if (!rule.nullable) report.add(where, `« ${name} » ne peut pas être null`);
    return;
  }
  switch (rule.kind) {
    case "string":
      if (typeof value !== "string") report.add(where, `« ${name} » doit être un texte, trouvé ${show(value)}`);
      return;
    case "integer":
      if (!Number.isInteger(value)) report.add(where, `« ${name} » doit être un nombre entier, trouvé ${show(value)}`);
      return;
    case "date":
      if (typeof value !== "string" || !isRealDate(value)) report.add(where, `« ${name} » doit être une date AAAA-MM-JJ, trouvé ${show(value)}`);
      return;
    case "url":
      if (typeof value !== "string" || !URL_PATTERN.test(value)) report.add(where, `« ${name} » doit être une URL http(s), trouvé ${show(value)}`);
      return;
    case "enum":
      if (typeof value !== "string" || !rule.values.includes(value)) {
        report.add(where, `« ${name} » vaut ${show(value)} (attendu : ${rule.values.join(", ")})`);
      }
      return;
    case "list":
      if (!Array.isArray(value)) {
        report.add(where, `« ${name} » doit être une liste`);
        return;
      }
      value.forEach((item, i) => checkValue(item, rule.item, name, [...where, `${name} ${entryLabel(item, i)}`], report));
      return;
    case "object":
      if (!isPlainObject(value)) {
        report.add(where, `« ${name} » doit être un objet`);
        return;
      }
      checkObject(value, rule.schema, where, report);
      return;
    case "record":
      if (!isPlainObject(value)) {
        report.add(where, `« ${name} » doit être un objet`);
        return;
      }
      for (const [k, v] of Object.entries(value)) checkValue(v, rule.value, `${name}.${k}`, where, report);
      return;
  }
}

function checkObject(value: Record<string, unknown>, schema: AnySchema, where: string[], report: Report): void {
  for (const [name, rule] of Object.entries(schema)) {
    if (!(name in value)) {
      if (!rule.optional) report.add(where, `champ « ${name} » manquant`);
      continue;
    }
    checkValue(value[name], rule, name, where, report);
  }
  for (const name of Object.keys(value)) {
    if (!(name in schema)) report.add(where, `champ « ${name} » inconnu (attendu : ${Object.keys(schema).join(", ")})`);
  }
}

/** Checks one data file against its schema. List entries of the top-level key are named "entrée N (id)". */
function checkFile(content: unknown, schema: AnySchema, file: string, report: Report): void {
  if (!isPlainObject(content)) {
    report.add([file], "le fichier doit contenir un objet JSON");
    return;
  }
  const at = [file];
  for (const [name, rule] of Object.entries(schema)) {
    const value = content[name];
    if (!(name in content)) {
      if (!rule.optional) report.add(at, `champ « ${name} » manquant`);
    } else if (rule.kind === "list" && Array.isArray(value)) {
      value.forEach((item, i) => checkValue(item, rule.item, name, [file, entryLabel(item, i)], report));
    } else {
      checkValue(value, rule, name, at, report);
    }
  }
  for (const name of Object.keys(content)) {
    if (!(name in schema)) report.add(at, `champ « ${name} » inconnu (attendu : ${Object.keys(schema).join(", ")})`);
  }
}

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

  // Entries the site links to by id (src/site/links.ts).
  const linked = (file: string, entries: { id: string; url: string | null }[], wanted: readonly string[], needUrl: boolean) => {
    for (const id of wanted) {
      const entry = entries.find((x) => x.id === id);
      if (!entry) report.add([file], `id « ${id} » utilisé par le site (src/site/links.ts) mais absent`);
      else if (needUrl && entry.url === null) report.add([file, id], "le site renvoie vers cette entrée, elle doit avoir une URL");
    }
  };
  linked("data/state-sites.json", d.state_sites, Object.values(STATE_SITE_IDS), true);
  linked("data/tools.json", d.tools, Object.values(TOOL_IDS), true);
  linked("data/tools.json", d.tools, [...AID_TOOL_IDS.understand, ...AID_TOOL_IDS.compare], false);

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
      `${d.tools.length} outils, ${d.ballot.items.length} objets en votation.`,
  );
  return 0;
}

/* ====================================================================== */
/* links                                                                   */
/* ====================================================================== */

const CONCURRENCY = 8;
const TIMEOUT_MS = 25_000;
const ATTEMPTS = 3;
const BACKOFF_MS = [1_000, 3_000];

type Verdict = "ok" | "redirected" | "elsewhere" | "blocked" | "broken";
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
      if (registeredDomain(new URL(url).hostname) !== registeredDomain(new URL(final).hostname)) {
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
      const reason = err.name === "TimeoutError" ? `pas de réponse en ${TIMEOUT_MS / 1000} s` : err.cause?.code || err.cause?.message || err.message;
      last = { url, verdict: "broken", status: 0, note: `${reason}, après ${attempt + 1} essai(s)` };
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
  redirected: "OK      ",
  ok: "OK      ",
};
const ORDER: Verdict[] = ["broken", "elsewhere", "blocked", "redirected", "ok"];

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
      `${count("broken")} cassé(s), ${count("elsewhere")} redirigé(s) ailleurs, ${count("blocked")} à vérifier à la main.`,
  );
  if (failing) console.log("Échec : corrigez les liens cassés ou redirigés ailleurs dans data/ (gardez l'ancienne adresse dans previous_urls).");
  return failing ? 1 : 0;
}

/* ====================================================================== */
/* seats                                                                   */
/* ====================================================================== */

/** Raw party name (lower case) -> abbreviation used on the site. */
const ALIASES: Record<string, string> = {
  udc: "UDC", svp: "UDC", ps: "PS", sp: "PS", pss: "PS", plr: "PLR", fdp: "PLR",
  "le centre": "Centre", "die mitte": "Centre", centre: "Centre", mitte: "Centre",
  verts: "Verts", "les vert-e-s": "Verts", "grüne": "Verts", gps: "Verts", "vert-e-s": "Verts",
  pvl: "PVL", glp: "PVL", "vert'libéraux": "PVL", pev: "PEV", evp: "PEV", mcg: "MCG",
  pst: "PST-POP", "pst-pop": "PST-POP", pda: "PST-POP", "sol.": "solidaritéS", "solidarités": "solidaritéS",
};

/** The separator that appears most in the header line. */
function sniffDelimiter(text: string): string {
  const header = text.split(/\r?\n/, 1)[0] ?? "";
  let best = ",";
  for (const d of [",", ";", "\t"]) if (header.split(d).length > header.split(best).length) best = d;
  return best;
}

/** RFC 4180 CSV: quoted fields, doubled quotes, line breaks inside quotes. */
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** The first column matching the first pattern that matches any column: patterns go from the most precise. */
function findColumn(headers: string[], patterns: RegExp[]): number | null {
  for (const p of patterns) {
    const i = headers.findIndex((h) => p.test(h.toLowerCase()));
    if (i >= 0) return i;
  }
  return null;
}

async function cmdSeats(url: string, showColumns: boolean, colName: number | null, colSeats: number | null): Promise<number> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) {
    console.error(`Téléchargement impossible : ${res.status} ${res.statusText} (${url})`);
    return 2;
  }
  const text = (await res.text()).replace(/^﻿/, "");
  const rows = parseCsv(text, sniffDelimiter(text));
  const headers = rows[0] ?? [];
  if (showColumns) {
    console.log("Colonnes :");
    headers.forEach((h, i) => console.log(`  ${i}: ${h}`));
    console.log("\nPremières lignes :");
    for (const l of rows.slice(1, 6)) console.log("  ", JSON.stringify(l));
    return 0;
  }
  // The 2023 OFS file (seen with --show on 2026-11-16) names them partei_bezeichnung_fr and anzahl_gewaehlte.
  const cn = colName ?? findColumn(headers, [/^partei_bezeichnung_fr$/, /parti.*(name|nom)/, /party.*name/, /partei.*name/, /^parti/, /^party/, /^partei/, /name/]);
  const cs = colSeats ?? findColumn(headers, [/^anzahl_gewaehlte$/, /mandat/, /sitze/, /seats/, /sieges/]);
  if (cn === null || cs === null) {
    console.error("Colonnes introuvables. Lancez avec --show puis --col-name N --col-seats N.");
    return 2;
  }
  const seatsRaw: Record<string, number> = {};
  for (const l of rows.slice(1)) {
    if (l.length <= Math.max(cn, cs)) continue;
    const name = (l[cn] ?? "").trim();
    const cell = (l[cs] ?? "").trim().replace(",", ".");
    const n = cell === "" ? NaN : Math.trunc(Number(cell));
    if (Number.isNaN(n)) continue;
    if (name && !(name in seatsRaw)) seatsRaw[name] = n; // first occurrence: Swiss total
  }
  const seats: Record<string, number> = {};
  for (const [k, v] of Object.entries(seatsRaw)) {
    const alias = ALIASES[k.toLowerCase()];
    if (alias) seats[alias] = v;
  }
  const output = {
    source: url,
    license: "opendata.swiss, mention de la source obligatoire (OFS)",
    retrieved_on: new Date().toISOString().slice(0, 10),
    columns: { name: headers[cn], seats: headers[cs] },
    seats_raw: seatsRaw,
    seats,
  };
  const out = join(ROOT, "data", SEATS_FILE);
  writeFileSync(out, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(`Écrit ${relative(ROOT, out)} : ${Object.keys(seats).length} partis reconnus sur ${Object.keys(seatsRaw).length}.`);
  const unknown = Object.keys(seatsRaw).filter((k) => !(k.toLowerCase() in ALIASES));
  if (unknown.length) console.log("Non reconnus (à ajouter dans ALIASES si utile) :", unknown.slice(0, 15).join(", "));
  console.log("Vérifiez : le total devrait faire 200 sièges ->", Object.values(seatsRaw).reduce((a, b) => a + b, 0));
  return 0;
}

/* ====================================================================== */

function integerOption(v: string | undefined, flag: string): number | null {
  if (v === undefined) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) throw new Error(`${flag} attend un numéro de colonne, trouvé « ${v} »`);
  return n;
}

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      data: { type: "string", default: "data" },
      all: { type: "boolean", default: false },
      url: { type: "string", default: SEATS_URL },
      show: { type: "boolean", default: false },
      "col-name": { type: "string" },
      "col-seats": { type: "string" },
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
    case "seats":
      return cmdSeats(values.url, values.show, integerOption(values["col-name"], "--col-name"), integerOption(values["col-seats"], "--col-seats"));
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
