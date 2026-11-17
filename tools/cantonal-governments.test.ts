/*
 * Tests of the rules on data/cantonal-governments.json (tools/cantonal-governments.ts). Run: npm test.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { CantonalGovernment, CantonalGovernmentsFile, PartiesFile, Party, Territory, TerritoriesFile } from "../src/types.ts";
import { checkCantonalGovernments, staleMembers } from "./cantonal-governments.ts";

const territories: Territory[] = [
  { code: "CH", name: "Confédération" },
  { code: "JU", name: "Jura" },
  { code: "NE", name: "Neuchâtel" },
];
const parties = [{ id: "ps-ju", territory: "JU" }, { id: "plr-ne", territory: "NE" }] as Party[];
const member = (name: string, party: string, checked_on = "2026-11-17") => ({
  name, party, department: "D", role: null, source: "https://example.org/a", party_source: "https://example.org/b", checked_on,
});
const ju = (members: CantonalGovernment["members"]): CantonalGovernment => ({ canton: "JU", body: "Gouvernement", members });
const five = ["A", "B", "C", "D", "E"].map((n) => member(n, "ps-ju"));

test("checkCantonalGovernments accepts a full government of known parties of the canton", () => {
  assert.deepEqual(checkCantonalGovernments([ju(five)], territories, parties), []);
});

test("checkCantonalGovernments reports a wrong size, a duplicate, an unknown or foreign party, an uncovered canton", () => {
  const errors = checkCantonalGovernments(
    [ju([...five.slice(0, 3), member("A", "ps-xx"), member("F", "plr-ne")]), ju(five), { canton: "ZH", body: "Regierungsrat", members: [] }],
    territories,
    parties,
  );
  assert.deepEqual(errors, [
    "JU : A en double",
    "JU : A, parti « ps-xx » absent de parties.json",
    "JU : F, « plr-ne » est un parti de NE",
    "JU : canton en double",
    "ZH : pas un canton couvert",
    "ZH : taille du gouvernement inconnue (GOVERNMENT_SIZES, tools/cantonal-governments.ts)",
  ]);
});

test("staleMembers lists the members checked more than 180 days ago", () => {
  const g = ju([member("A", "ps-ju", "2026-05-21"), member("B", "ps-ju", "2026-05-20"), ...five.slice(2)]);
  assert.deepEqual(staleMembers([g], "2026-11-17"), ["JU : B, vérifié le 2026-05-20"]);
});

test("the committed file passes the rules", () => {
  const read = <T,>(f: string) => JSON.parse(readFileSync(new URL("../data/" + f, import.meta.url), "utf8")) as T;
  const { cantonal_governments } = read<CantonalGovernmentsFile>("cantonal-governments.json");
  const errors = checkCantonalGovernments(cantonal_governments, read<TerritoriesFile>("territories.json").territories, read<PartiesFile>("parties.json").parties);
  assert.deepEqual(errors, []);
});
