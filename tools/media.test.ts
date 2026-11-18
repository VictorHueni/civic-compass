/*
 * Tests of the media file data/media.json: its schema (src/types.ts) and its rules (tools/media.ts),
 * PRD-0001 US-23 and US-24. Run: npm test.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { DATA_FILES, type MediaFile } from "../src/types.ts";
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

test("the media schema accepts a valid file, with a removed holder and a disputed holding", () => {
  const f = mediaFile();
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
