/*
 * Tests of the presidency line of a party's card (src/site/presidency.ts). Run: npm test.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { Party } from "../src/types.ts";
import { namesText, presidencyFact } from "../src/site/presidency.ts";

const presidency = { names: ["Mattea Meyer", "Cédric Wermuth"], source: "https://www.sp-ps.ch/fr/personnes/presidence/", evidence: "…", checked_on: "2026-11-17" };

test("namesText joins one, two or three names the French way", () => {
  assert.equal(namesText(["A"]), "A");
  assert.equal(namesText(["A", "B"]), "A et B");
  assert.equal(namesText(["A", "B", "C"]), "A, B et C");
});

test("presidencyFact gives the card line and its source, named by site", () => {
  assert.deepEqual(presidencyFact({ facts: { presidency } } as Party), {
    row: ["Présidence", "Mattea Meyer et Cédric Wermuth"],
    source: { url: "https://www.sp-ps.ch/fr/personnes/presidence/", site: "sp-ps.ch", checked_on: "2026-11-17" },
  });
});

test("presidencyFact gives nothing for a party without a sourced presidency", () => {
  assert.equal(presidencyFact({} as Party), null);
  assert.equal(presidencyFact({ facts: {} } as Party), null);
});
