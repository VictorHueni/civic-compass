/*
 * Tests of the lines of a cantonal party's card (src/site/cantonal-standing.ts, PRD-0001 US-15). Run: npm test.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { cantonalStanding, governmentSources, grandCouncilSeats, siteName, sitsFor } from "../src/site/cantonal-standing.ts";
import type { CantonalGovernment, CantonalParliaments, GovernmentMember, Parliament, ParliamentPerson } from "../src/types.ts";

const table: CantonalParliaments = {
  request: "GET https://example.org/search",
  asset_url: "https://example.org/master",
  title: "t",
  table: "T 17.02.05.01.03",
  sheet: "actuel (2021-2026)",
  attribution: "Source : OFS",
  license: "l",
  retrieved_on: "2026-11-17",
  columns: ["Année électorale 5)", "PLR 2)", "PS", "PVL", "  MCG (MCR)", "Autres 4)", "Total"],
  rows: [{ label: "Genève ", cells: { "Année électorale 5)": "2023", "PLR 2)": "22", PS: "1", PVL: "0", "  MCG (MCR)": "14", "Autres 4)": "*", Total: "100" } }],
  notes: [],
  party_mapping: { GE: { PLR: "plr-ge", PS: "ps-ge", PVL: "pvl-ge", "MCG (MCR)": "mcg-ge", Autres: "ljs-ge" } },
};
const row = table.rows[0];

const member = (name: string, party: string, source = "https://www.ge.ch/ce", partySource = source): GovernmentMember => ({
  name,
  party,
  department: "d",
  role: null,
  source,
  party_source: partySource,
  checked_on: "2026-11-17",
});
const government: CantonalGovernment = {
  canton: "GE",
  body: "Conseil d'État",
  members: [member("A", "plr-ge"), member("B", "plr-ge"), member("C", "ps-ge"), member("D", "verts-ge")],
};

let nextId = 1;
const person = (council: string, canton: string, label: string): ParliamentPerson => ({
  id: nextId++,
  firstName: "F",
  lastName: "L",
  council: { abbreviation: council },
  party: { shortName: label },
  canton: { abbreviation: canton },
  activeFederalCouncilMandates: [],
});
const parliament = {
  attribution: "Source : Parlement",
  retrieved_on: "2026-11-16",
  persons: [
    person("CN", "GE", "PSS"),
    person("CN", "GE", "PSS"),
    person("CN", "GE", "MCG"),
    person("CN", "GE", "PLR"),
    person("CN", "VD", "PSS"),
    person("CE", "GE", "MCG"),
    person("CE", "GE", "PSS"),
  ],
  party_mapping: { PSS: "PS", PLR: "PLR" },
} as unknown as Parliament;

const standing = (id: string, abbr: string, g: CantonalGovernment | null = government) =>
  cantonalStanding({ id, abbr }, "GE", g ?? undefined, table, row, parliament);

test("a section of a CH party: government count, Grand Conseil seats with the year, the canton's federal seats", () => {
  const s = standing("ps-ge", "PS GE");
  assert.deepEqual(s.rows, [
    ["Conseil d'État", "1 sur 4"],
    ["Grand Conseil (élection 2023)", "1 siège sur 100"],
    ["Conseil national (GE)", "2 sur 4"],
    ["Conseil des États (GE)", "1 sur 2"],
  ]);
  assert.deepEqual([s.government, s.grandCouncil, s.federal], [true, true, true]);
});

test("a sourced zero is written out", () => {
  assert.deepEqual(standing("pvl-ge", "PVL GE").rows, [
    ["Conseil d'État", "Aucun membre sur 4"],
    ["Grand Conseil (élection 2023)", "Aucun siège sur 100"],
    ["Conseil national (GE)", "Aucun siège sur 4"],
    ["Conseil des États (GE)", "Aucun siège sur 2"],
  ]);
});

test("a party of the canton only takes the federal members whose label is its abbr (MCG)", () => {
  assert.deepEqual(standing("mcg-ge", "MCG").rows, [
    ["Conseil d'État", "Aucun membre sur 4"],
    ["Grand Conseil (élection 2023)", "14 sièges sur 100"],
    ["Conseil national (GE)", "1 sur 4"],
    ["Conseil des États (GE)", "1 sur 2"],
  ]);
  const mcg = sitsFor(parliament, { id: "mcg-ge", abbr: "MCG" }, "GE");
  const ps = sitsFor(parliament, { id: "ps-ge", abbr: "PS GE" }, "GE");
  assert.equal(parliament.persons.filter(mcg).length, 2);
  assert.equal(parliament.persons.filter(ps).length, 4);
});

test("no sourced data, no line: a party without an OFS number, a canton without a government", () => {
  // "Autres" holds "*" (no list) for ljs-ge; eag-ge has no column at all.
  assert.equal(grandCouncilSeats(table, "GE", row, "ljs-ge"), null);
  assert.equal(grandCouncilSeats(table, "GE", row, "eag-ge"), null);
  const s = standing("eag-ge", "EàG", null);
  assert.deepEqual(s.rows, [
    ["Conseil national (GE)", "Aucun siège sur 4"],
    ["Conseil des États (GE)", "Aucun siège sur 2"],
  ]);
  assert.deepEqual([s.government, s.grandCouncil, s.federal], [false, false, true]);
  const noMembers = standing("ps-ge", "PS GE", { ...government, members: [] });
  assert.equal(noMembers.government, false);
  const noRow = cantonalStanding({ id: "ps-ge", abbr: "PS GE" }, "GE", undefined, table, undefined, parliament);
  assert.equal(noRow.grandCouncil, false);
});

test("a canton with no federal member of a chamber shows no line for it", () => {
  const s = cantonalStanding({ id: "ps-ju", abbr: "PS JU" }, "JU", undefined, table, undefined, parliament);
  assert.deepEqual(s.rows, []);
  assert.equal(s.federal, false);
});

test("the government's sources: one page per site, the official page first", () => {
  const g: CantonalGovernment = {
    canton: "VD",
    body: "Conseil d'État",
    members: [
      member("A", "ps-vd", "https://www.vd.ch/ce", "https://ps-vd.ch/conseil-detat/"),
      member("B", "plr-vd", "https://www.vd.ch/def/chef-de-departement", "https://www.vd.ch/ce"),
    ],
  };
  assert.deepEqual(governmentSources(g), ["https://www.vd.ch/ce", "https://ps-vd.ch/conseil-detat/"]);
  assert.equal(siteName("https://www.vd.ch/dadn/cheffe-de-departement"), "vd.ch");
  assert.equal(siteName("https://ps-vd.ch/conseil-detat/"), "ps-vd.ch");
});
