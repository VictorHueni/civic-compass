/*
 * Tests of the fields kept for the maintainers only (tools/maintainer-fields.ts): removed from data/*.json
 * when the site is bundled. Run: npm test.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parseForSite } from "./maintainer-fields.ts";

test("parseForSite removes _readme, request, left_right and fingerprint at any depth, and keeps the other keys", () => {
  const text = JSON.stringify({
    _readme: "r",
    media_ownership: {
      holders: [{ id: "removed_1", kind: "person", removal: { fingerprint: "ab", date: "2026-11-18", reason: "person_request" } }],
      note: "kept",
    },
    parties: [{ id: "p", left_right: 3, name: "P" }],
    parliament: { request: "GET https://example.org", retrieved_on: "2026-11-18" },
  });
  assert.deepEqual(parseForSite(text), {
    media_ownership: {
      holders: [{ id: "removed_1", kind: "person", removal: { date: "2026-11-18", reason: "person_request" } }],
      note: "kept",
    },
    parties: [{ id: "p", name: "P" }],
    parliament: { retrieved_on: "2026-11-18" },
  });
});
