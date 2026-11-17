/*
 * Tests of the reading of data/cantonal-parliaments.json (src/site/cantonal-parliaments.ts). Run: npm test.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { cantonRow, cantonSeats, plainLabel, seatCount } from "../src/site/cantonal-parliaments.ts";
import type { CantonalParliaments, Party, Territory } from "../src/types.ts";
import { checkCantonalParliaments, extractTable, unmappedSeats } from "./cantonal-parliaments.ts";
import type { Sheet } from "./xlsx.ts";

test("plainLabel drops footnote marks, non-breaking and outer spaces", () => {
  assert.equal(plainLabel("Vaud 7) "), "Vaud");
  assert.equal(plainLabel("\u00a0\u00a0VERT-E-S 9)"), "VERT-E-S");
  assert.equal(plainLabel("Année électorale 5)"), "Année électorale");
  assert.equal(plainLabel("Appenzell Rh. Int. 1)"), "Appenzell Rh. Int.");
  assert.equal(plainLabel("\u00a0\u00a0MCG (MCR)"), "MCG (MCR)");
  assert.equal(plainLabel("Genève "), "Genève");
});

test("seatCount reads numbers only", () => {
  assert.equal(seatCount("22"), 22);
  assert.equal(seatCount("0"), 0);
  assert.equal(seatCount("* \u00a0"), null);
  assert.equal(seatCount("… "), null);
  assert.equal(seatCount(undefined), null);
  assert.equal(seatCount("1.5"), null);
});

const table: CantonalParliaments = {
  request: "GET https://example.org/search",
  asset_url: "https://example.org/master",
  title: "t",
  table: "T 17.02.05.01.03",
  sheet: "actuel (2021-2026)",
  attribution: "a",
  license: "l",
  retrieved_on: "2026-11-17",
  columns: ["Année électorale 5)", "PLR 2)", "PS", "PEV", "\u00a0\u00a0MCG (MCR)", "Autres 4)", "Total"],
  rows: [
    { label: "Genève ", cells: { "Année électorale 5)": "2023", "PLR 2)": "22", PS: "18", PEV: "*", "\u00a0\u00a0MCG (MCR)": "14", "Autres 4)": "10", Total: "64" } },
    { label: "Jura", cells: { "Année électorale 5)": "2025", "PLR 2)": "6", PS: "0", Total: "6" } },
  ],
  notes: [],
  party_mapping: { GE: { PLR: "plr-ge", "MCG (MCR)": "mcg-ge", Autres: "ljs-ge" } },
};

test("cantonRow finds a canton by its name", () => {
  assert.equal(cantonRow(table, "Genève")?.label, "Genève ");
  assert.equal(cantonRow(table, "Vaud"), undefined);
});

test("cantonSeats gives the year, the total and the parties with seats, most seats first, mapped or not", () => {
  const ge = cantonSeats(table, "GE", table.rows[0]);
  assert.equal(ge.year, 2023);
  assert.equal(ge.total, 64);
  assert.deepEqual(ge.parties, [
    { column: "PLR", partyId: "plr-ge", seats: 22 },
    { column: "PS", partyId: null, seats: 18 },
    { column: "MCG (MCR)", partyId: "mcg-ge", seats: 14 },
    { column: "Autres", partyId: "ljs-ge", seats: 10 },
  ]);
  const ju = cantonSeats(table, "JU", table.rows[1]);
  assert.deepEqual(ju, { year: 2025, total: 6, parties: [{ column: "PLR", partyId: null, seats: 6 }] });
});

/* ---------- Extraction from the workbook and rules of `npm run check` (tools/cantonal-parliaments.ts) ---------- */

const sheet = (name: string, rows: Record<number, Record<string, string>>): Sheet => ({
  name,
  rows: new Map(Object.entries(rows).map(([r, cells]) => [Number(r), new Map(Object.entries(cells))])),
});
const ofsSheet = sheet("actuel (2021-2026)", {
  1: { A: "Elections des parlements cantonaux", U: "T 17.02.05.01.03" },
  2: { C: "Année électorale 5)", D: "PLR 2)", E: "PS", AA: "Total" },
  3: { A: "Total", D: "481", E: "453", AA: "2594" },
  4: { A: "Zurich ", C: "2023", D: "29", E: "36", AA: "180" },
  5: { A: "Jura", C: "2025", D: "6", AA: "6" },
  6: { A: "Genève ", C: "2023", D: "22", E: "*", AA: "22" },
  7: { A: "* = pas de candidature" },
  8: { A: "GE: Libertés et Justice sociale 10 mandats" },
});

test("extractTable reads the current sheet: columns from the year on, the cantons asked for, the notes", () => {
  const t = extractTable([sheet("2021-2025", {}), ofsSheet], ["Genève", "Jura"]);
  assert.equal(t.sheet, "actuel (2021-2026)");
  assert.equal(t.title, "Elections des parlements cantonaux");
  assert.equal(t.table, "T 17.02.05.01.03");
  assert.deepEqual(t.columns, ["Année électorale 5)", "PLR 2)", "PS", "Total"]);
  assert.deepEqual(t.rows, [
    { label: "Jura", cells: { "Année électorale 5)": "2025", "PLR 2)": "6", Total: "6" } },
    { label: "Genève ", cells: { "Année électorale 5)": "2023", "PLR 2)": "22", PS: "*", Total: "22" } },
  ]);
  assert.deepEqual(t.notes, ["* = pas de candidature", "GE: Libertés et Justice sociale 10 mandats"]);
});

test("extractTable fails clearly when the sheet or the year and total columns are missing", () => {
  assert.throws(() => extractTable([sheet("2021-2025", {})], []), /actuel/);
  assert.throws(() => extractTable([sheet("actuel", { 2: { C: "PLR" } })], []), /Année électorale/);
  assert.throws(() => extractTable([sheet("actuel", { 2: { C: "Année électorale", D: "PLR" } })], []), /Total/);
});

const territories: Territory[] = [
  { code: "CH", name: "Confédération" },
  { code: "GE", name: "Genève" },
  { code: "JU", name: "Jura" },
  { code: "ZH", name: "Zurich" },
];
const party = (id: string, territory: string) => ({ id, territory }) as Party;
const parties = [party("plr-ch", "CH"), party("plr-ge", "GE"), party("ps-ge", "GE"), party("plr-ju", "JU")];

function file(rows: CantonalParliaments["rows"], mapping: CantonalParliaments["party_mapping"] = {}): CantonalParliaments {
  return { ...table, columns: ["Année électorale 5)", "PLR 2)", "PS", "Total"], rows, party_mapping: mapping };
}
const ge = (plr: string, ps: string, total: string) => ({ label: "Genève ", cells: { "Année électorale 5)": "2023", "PLR 2)": plr, PS: ps, Total: total } });
const ju = { label: "Jura", cells: { "Année électorale 5)": "2025", "PLR 2)": "60", Total: "60" } };

test("checkCantonalParliaments accepts seats adding up to each covered parliament's size", () => {
  assert.deepEqual(checkCantonalParliaments(file([ge("60", "40", "100"), ju], { GE: { PLR: "plr-ge", PS: "ps-ge" } }), territories, parties), []);
  assert.deepEqual(unmappedSeats(file([ge("60", "40", "100"), ju], { GE: { PLR: "plr-ge" } }), territories, parties), ["GE : PS 40", "JU : PLR 60"]);
});

test("checkCantonalParliaments reports a missing canton, a wrong total or sum, and an unknown or foreign party", () => {
  const errors = checkCantonalParliaments(
    file([ge("60", "30", "100"), { label: "Zurich ", cells: {} }], { GE: { PLR: "plr-ju", PS: "ps-xx", PVL: "plr-ge" }, ZH: {} }),
    territories,
    parties,
  );
  assert.deepEqual(errors, [
    "ligne « Zurich  » : pas un canton couvert",
    "GE : la somme des sièges par parti (90) ne vaut pas le total (100)",
    "JU : ligne « Jura » absente",
    "party_mapping GE « PLR » : « plr-ju » est un parti de JU",
    "party_mapping GE « PS » : parti « ps-xx » absent de parties.json",
    "party_mapping GE « PVL » : colonne absente du tableau",
    "party_mapping ZH : pas un canton couvert",
  ]);
  assert.deepEqual(checkCantonalParliaments(file([ge("50", "40", "90"), ju]), territories, parties), ["GE : total 90 au lieu de 100 sièges"]);
});
