/*
 * Tests of the members a legend line of a federal chamber lists (src/site/parliament.ts, PRD-0001 US-19). Run: npm test.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { groupMembers, memberLine, seatGroups } from "../src/site/parliament.ts";
import type { Parliament, ParliamentPerson } from "../src/types.ts";

let nextId = 1;
const person = (firstName: string, lastName: string, canton: string, label: string, council = "CN"): ParliamentPerson => ({
  id: nextId++,
  firstName,
  lastName,
  council: { abbreviation: council },
  party: { shortName: label },
  canton: { abbreviation: canton },
  activeFederalCouncilMandates: [],
});
const persons = [
  person("Zoé", "Martin", "VD", "PLR"),
  person("Anne", "Martin", "VD", "PLR"),
  person("Luc", "Blanc", "VD", "PLR"),
  person("Paul", "Roux", "BS", "PLD"),
  person("Eva", "Keller", "GE", "PLR"),
  person("Jon", "Muster", "ZG", "Al"),
  person("Ida", "Rossi", "TI", "Lega"),
  person("Max", "Frei", "SH", "-"),
  person("Ugo", "Bern", "BE", "PSS", "CE"),
];
const parliament = {
  attribution: "Source : Parlement",
  retrieved_on: "2026-11-17",
  persons,
  party_mapping: { PLR: "PLR", PLD: "PLR", PSS: "PS", Al: "Verts" },
} as unknown as Parliament;
const order = ["Verts", "PS", "PLR"];
const cn = persons.filter((p) => p.council?.abbreviation === "CN");

test("a party's members, by canton then by name, a regional label named", () => {
  assert.deepEqual(groupMembers(parliament, cn, "PLR", order).map(memberLine), [
    "Paul Roux (BS, PLD)",
    "Eva Keller (GE)",
    "Luc Blanc (VD)",
    "Anne Martin (VD)",
    "Zoé Martin (VD)",
  ]);
});

test("the members of a group match its seats in the legend", () => {
  for (const g of seatGroups(parliament, cn, order)) assert.equal(groupMembers(parliament, cn, g.abbr, order).length, g.seats, String(g.abbr));
});

test("'Autres' names each member's label, 'sans parti' when the API records none", () => {
  assert.deepEqual(groupMembers(parliament, cn, null, order).map(memberLine), ["Max Frei (SH, sans parti)", "Ida Rossi (TI, Lega)"]);
});

test("a party with a regional label only under it keeps the main label silent", () => {
  assert.deepEqual(groupMembers(parliament, cn, "Verts", order).map(memberLine), ["Jon Muster (ZG)"]);
});

test("only the persons given are listed", () => {
  assert.deepEqual(groupMembers(parliament, cn, "PS", order), []);
});
