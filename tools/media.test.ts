/*
 * Tests of the media file data/media.json: its schema (src/types.ts) and its rules (tools/media.ts),
 * PRD-0001 US-23 and US-24. Run: npm test.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { DATA_FILES, type Holder, type Holding, type MediaFile, type Territory } from "../src/types.ts";
import { checkMedia, fingerprint, mediaSummary, staleMedia } from "./media.ts";
import { checkFile, Report } from "./schema.ts";

const SRC = "https://example.org/source";
const DAY = "2026-11-18";

/** A small valid media file: one medium, its publisher, one owner. Each test changes one thing in a copy. */
function mediaFile(): MediaFile {
  return {
    _readme: "r",
    media_ownership: {
      media: [
        {
          id: "m_a",
          name: "A",
          genre: "press",
          regions: ["GE"],
          publisher: "co_a",
          publisher_source: SRC,
          source: SRC,
          checked_on: DAY,
        },
      ],
      companies: [{ id: "co_a", name: "A SA", legal_form: "SA", seat: "Genève", uid: "CHE-100.000.001", source: SRC, checked_on: DAY }],
      holders: [{ id: "p_a", name: "Anne A", kind: "person", source: SRC, checked_on: DAY }],
      holdings: [{ holder: "p_a", held: "co_a", share: 51.5, source: SRC, checked_on: DAY }],
      fog: {
        edition: { label: "l", period: "2018 à 2025", ballots: 61, scale_min: -100, scale_max: 100, average: -4, source: SRC, checked_on: DAY },
        values: [{ medium: "m_a", measured_as: "a.ch", value: -5 }],
      },
    },
  };
}

function schemaErrors(content: unknown): string[] {
  const report = new Report();
  checkFile(content, DATA_FILES.media_ownership.schema, "data/media.json", report);
  return report.errors;
}

test("the media schema accepts a valid file, with a removed holder, a disputed holding and a company the register does not know", () => {
  const f = mediaFile();
  f.media_ownership.companies.push({ id: "co_x", name: "X SA", legal_form: "SA", seat: null, uid: null, source: SRC, checked_on: DAY });
  f.media_ownership.holders.push({
    id: "removed_1",
    kind: "person",
    source: SRC,
    checked_on: DAY,
    removal: { fingerprint: "0".repeat(64), date: DAY, reason: "person_request" },
  });
  f.media_ownership.holdings.push({ holder: "removed_1", held: "co_a", share: null, source: SRC, checked_on: DAY, dispute: "a", note: "n" });
  assert.deepEqual(schemaErrors(f), []);
});

test("the media schema names an unknown key of a holding", () => {
  const f = mediaFile() as unknown as { media_ownership: { holdings: Record<string, unknown>[] } };
  f.media_ownership.holdings[0].disputed = true;
  assert.match(schemaErrors(f).join("\n"), /champ « disputed » inconnu/);
});

test("the media schema names a share given as text and a check date that is not a real date", () => {
  const f = mediaFile() as unknown as { media_ownership: { holdings: Record<string, unknown>[] } };
  f.media_ownership.holdings[0].share = "51,5 %";
  f.media_ownership.holdings[0].checked_on = "2026-02-30";
  const errors = schemaErrors(f).join("\n");
  assert.match(errors, /« share » doit être un nombre/);
  assert.match(errors, /« checked_on » doit être une date/);
});

test("the media schema names a genre outside the four genres", () => {
  const f = mediaFile() as unknown as { media_ownership: { media: Record<string, unknown>[] } };
  f.media_ownership.media[0].genre = "Presse";
  assert.match(schemaErrors(f).join("\n"), /« genre » vaut Presse/);
});

/* ---------- Rules across entries (tools/media.ts), the decision table of the sheet's API tab ---------- */

const TERRITORIES = [{ code: "GE", name: "Genève" }, { code: "VD", name: "Vaud" }] as Territory[];
const rules = (f: MediaFile) => checkMedia(f.media_ownership, TERRITORIES);
const holding = (holder: string, held: string, share: number | null, extra: Partial<Holding> = {}): Holding => ({
  holder,
  held,
  share,
  source: SRC,
  checked_on: DAY,
  ...extra,
});
const person = (id: string, name: string): Holder => ({ id, name, kind: "person", source: SRC, checked_on: DAY });

/** TV Léman Bleu SA as Medienmonitor gives it: the same 24.66 % to ESH Médias on one page, to Philippe Hersant on another. */
function lemanBleu(disputed: boolean): MediaFile {
  const f = mediaFile();
  const o = f.media_ownership;
  o.holders.push(person("p_hersant", "Philippe Hersant"), person("p_barbier", "Stéphane Barbier-Mueller"), {
    id: "ge",
    name: "Ville de Genève",
    kind: "public",
    source: SRC,
    checked_on: DAY,
  });
  o.companies.push({ id: "esh", name: "ESH Médias SA", legal_form: "SA", seat: "Neuchâtel", uid: null, source: SRC, checked_on: DAY });
  const dispute = disputed ? { dispute: "tvlb-24.66", note: "Deux pages du Medienmonitor attribuent cette part à deux détenteurs." } : {};
  o.holdings = [
    holding("esh", "co_a", 24.66, dispute),
    holding("p_hersant", "co_a", 24.66, dispute),
    holding("p_barbier", "co_a", 50.75),
    holding("ge", "co_a", 17.06),
  ];
  return f;
}

test("checkMedia accepts the valid file", () => {
  assert.deepEqual(rules(mediaFile()), []);
});

test("checkMedia names a holding whose holder or held company does not exist, or whose held entry is not a company", () => {
  const f = mediaFile();
  f.media_ownership.holdings.push(holding("p_x", "co_a", 10), holding("p_a", "co_x", 10), holding("p_a", "p_a", 10));
  assert.deepEqual(rules(f), [
    "holding p_x → co_a : détenteur « p_x » introuvable",
    "holding p_a → co_x : « co_x » n'est pas une société de companies",
    "holding p_a → p_a : « p_a » n'est pas une société de companies",
  ]);
});

test("checkMedia counts a disputed share once: TV Léman Bleu SA makes 92.47 %, and 117.13 % without the dispute key", () => {
  assert.deepEqual(rules(lemanBleu(true)), []);
  assert.deepEqual(rules(lemanBleu(false)), ["co_a : les parts publiées font 117.13 % (plus de 100 %)"]);
});

test("checkMedia names a share below 0 or above 100", () => {
  const f = mediaFile();
  f.media_ownership.holdings = [holding("p_a", "co_a", -1)];
  f.media_ownership.holders.push(person("p_b", "Bea B"));
  f.media_ownership.holdings.push(holding("p_b", "co_a", 100.5));
  const errors = rules(f);
  assert.ok(errors.includes("holding p_a → co_a : part -1 hors de 0 à 100"), errors.join("\n"));
  assert.ok(errors.includes("holding p_b → co_a : part 100.5 hors de 0 à 100"), errors.join("\n"));
});

test("checkMedia names a dispute key on one holding only, across two companies, or without a note", () => {
  const f = lemanBleu(true);
  const o = f.media_ownership;
  o.companies.push({ id: "co_b", name: "B SA", legal_form: "SA", seat: "Vevey", uid: null, source: SRC, checked_on: DAY });
  o.holdings[1] = holding("p_hersant", "co_b", 24.66, { dispute: "tvlb-24.66", note: "n" });
  o.holdings.push(holding("p_barbier", "co_b", 1, { dispute: "seule" }));
  assert.deepEqual(rules(f), [
    "dispute « tvlb-24.66 » : porte sur plusieurs sociétés (co_a, co_b)",
    "dispute « seule » : une seule participation (il en faut au moins deux)",
    "holding p_barbier → co_b : dispute sans note qui nomme les sources",
  ]);
});

test("checkMedia names a medium without a publisher, or published by a person, family or public body", () => {
  const f = mediaFile();
  const o = f.media_ownership;
  o.media.push({ ...o.media[0], id: "m_b", publisher: "" }, { ...o.media[0], id: "m_c", publisher: "p_a" }, { ...o.media[0], id: "m_d", publisher: "x" });
  o.holders.push({ id: "assoc", name: "Fondation A", kind: "association", source: SRC, checked_on: DAY });
  o.media.push({ ...o.media[0], id: "m_e", publisher: "assoc" });
  assert.deepEqual(rules(f), [
    "m_b : pas d'éditeur",
    "m_c : l'éditeur « p_a » n'est ni une société ni une association ou fondation",
    "m_d : éditeur « x » introuvable",
  ]);
});

test("checkMedia names a region that is not a territory code, and a medium without region", () => {
  const f = mediaFile();
  f.media_ownership.media[0].regions = ["GE", "geneve"];
  f.media_ownership.media.push({ ...f.media_ownership.media[0], id: "m_b", regions: [] });
  assert.deepEqual(rules(f), ["m_a : région « geneve » inconnue de territories.json", "m_b : aucune région"]);
});

test("checkMedia names an id used twice across media, companies and holders", () => {
  const f = mediaFile();
  f.media_ownership.holders.push(person("co_a", "Homonyme"));
  assert.ok(rules(f).includes("id « co_a » en double (media, companies, holders)"));
});

test("checkMedia names a fög value of an unknown medium or a second value for one medium", () => {
  const f = mediaFile();
  f.media_ownership.fog.values.push({ medium: "m_x", measured_as: "x", value: 1 }, { medium: "m_a", measured_as: "a2", value: 2 });
  assert.deepEqual(rules(f), ["fög : média « m_x » introuvable", "fög : deux valeurs pour « m_a »"]);
});

test("the schema refuses a fact without a source", () => {
  const f = mediaFile() as unknown as { media_ownership: { holdings: Record<string, unknown>[]; companies: Record<string, unknown>[] } };
  delete f.media_ownership.holdings[0].source;
  f.media_ownership.companies[0].source = null;
  const errors = schemaErrors(f).join("\n");
  assert.match(errors, /champ « source » manquant/);
  assert.match(errors, /« source » ne peut pas être null/);
});

test("staleMedia lists every fact checked more than 180 days before today, and only those", () => {
  const f = mediaFile();
  const o = f.media_ownership;
  const old = "2026-05-21"; // 181 days before 2026-11-18
  o.holdings[0].checked_on = old;
  o.fog.edition.checked_on = old;
  o.companies[0].checked_on = "2026-05-22"; // 180 days: not yet stale
  assert.deepEqual(staleMedia(o, DAY), ["holding p_a → co_a, vérifié le 2026-05-21", "fög : édition 2018 à 2025, vérifiée le 2026-05-21"]);
  o.media[0].checked_on = old;
  o.holders[0].checked_on = old;
  assert.deepEqual(staleMedia(o, DAY), [
    "m_a (A), vérifié le 2026-05-21",
    "p_a (Anne A), vérifié le 2026-05-21",
    "holding p_a → co_a, vérifié le 2026-05-21",
    "fög : édition 2018 à 2025, vérifiée le 2026-05-21",
  ]);
});

test("mediaSummary counts the entries of each list for the line of npm run check", () => {
  assert.equal(mediaSummary(mediaFile().media_ownership), "1 médias, 1 sociétés, 1 autres détenteurs, 1 participations, 1 valeurs du fög");
});

test("fingerprint is the SHA-256 hex of the name in lower case, without accents, spaces collapsed", () => {
  const f = fingerprint("Éric  Dupont");
  assert.match(f, /^[0-9a-f]{64}$/);
  assert.equal(f, fingerprint("eric dupont"));
  assert.equal(f, fingerprint("  ERIC\tDupont "));
  assert.notEqual(f, fingerprint("Eric Dupond"));
  assert.equal(fingerprint("a"), "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", "plain SHA-256, no salt");
});

/** The valid file with one removal: the person behind it asked for "Bernard B" to be taken out. */
function withRemoval(): MediaFile {
  const f = mediaFile();
  f.media_ownership.holders.push({
    id: "removed_1",
    kind: "person",
    source: SRC,
    checked_on: DAY,
    removal: { fingerprint: fingerprint("Bernard B"), date: DAY, reason: "person_request" },
  });
  f.media_ownership.holdings.push({ holder: "removed_1", held: "co_a", share: 10, source: SRC, checked_on: DAY });
  return f;
}

test("checkMedia accepts a removed holder: no name, a removal record", () => {
  assert.deepEqual(checkMedia(withRemoval().media_ownership, TERRITORIES), []);
});

test("checkMedia fails when a named holder matches the fingerprint of a removal, and does not print the name", () => {
  const f = withRemoval();
  f.media_ownership.holders.push({ id: "p_back", name: "bernard  b", kind: "person", source: SRC, checked_on: DAY });
  const errors = checkMedia(f.media_ownership, TERRITORIES);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /p_back/);
  assert.match(errors[0], /retiré/);
  assert.doesNotMatch(errors[0], /bernard/i);
});

test("checkMedia fails on a holder with neither name nor removal, and on a holder with both", () => {
  const f = withRemoval();
  f.media_ownership.holders.push({ id: "p_nameless", kind: "person", source: SRC, checked_on: DAY });
  const both = f.media_ownership.holders.find((h) => h.id === "removed_1") as Holder;
  both.name = "Bernard B";
  const errors = checkMedia(f.media_ownership, TERRITORIES);
  assert.ok(errors.some((e) => /p_nameless/.test(e) && /ni nom ni retrait/.test(e)), errors.join("\n"));
  assert.ok(errors.some((e) => /removed_1/.test(e) && /nom et un retrait/.test(e)), errors.join("\n"));
  assert.ok(errors.every((e) => !/Bernard/.test(e)), "no message prints a removed name");
});

test("checkMedia fails on a removed holder whose id is not neutral: an id such as p_bernard_b would keep the name", () => {
  const f = withRemoval();
  const h = f.media_ownership.holders.find((x) => x.id === "removed_1") as Holder;
  h.id = "p_bernard_b";
  for (const x of f.media_ownership.holdings) if (x.holder === "removed_1") x.holder = "p_bernard_b";
  const errors = checkMedia(f.media_ownership, TERRITORIES);
  assert.equal(errors.length, 1, errors.join("\n"));
  assert.match(errors[0], /removed_/);
  assert.doesNotMatch(errors[0], /bernard/i, "the message does not repeat the id that holds the name");
});
