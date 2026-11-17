/*
 * Tests of the rules on the presidencies kept by hand in data/parties.json (tools/party-presidencies.ts). Run: npm test.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { Party } from "../src/types.ts";
import { checkPresidencies, stalePresidencies } from "./party-presidencies.ts";

const party = (id: string, names: string[], checked_on = "2026-11-17") =>
  ({ id, facts: { presidency: { names, source: "https://example.org/", evidence: "…", checked_on } } }) as Party;

test("checkPresidencies accepts one name or a co-presidency, and parties without a presidency", () => {
  assert.deepEqual(checkPresidencies([party("ps-ch", ["A", "B"]), party("udc-ch", ["C"]), { id: "pst-ch" } as Party]), []);
});

test("checkPresidencies reports an empty list, a blank name and a duplicate name", () => {
  assert.deepEqual(checkPresidencies([party("a", []), party("b", ["A", " "]), party("c", ["A", "A"])]), [
    "a : presidency.names est vide",
    "b : presidency.names contient un nom vide",
    "c : A en double dans presidency.names",
  ]);
});

test("stalePresidencies lists the presidencies checked more than 180 days ago", () => {
  const parties = [party("ps-ch", ["A", "B"], "2026-05-20"), party("udc-ch", ["C"], "2026-05-21"), { id: "pst-ch" } as Party];
  assert.deepEqual(stalePresidencies(parties, "2026-11-17"), ["ps-ch : A et B, vérifié le 2026-05-20"]);
});
