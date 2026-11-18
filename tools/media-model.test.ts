/*
 * Tests of the lines of a medium's card (src/site/media-model.ts, PRD-0001 US-20 and US-21): the decision table
 * "the lines of a medium's card and list entry" of docs/plans/active/transparency-media/ (API tab). Run: npm test.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { cardLines, chainTop, mainHolder } from "../src/site/media-model.ts";
import type { Company, Holder, Holding, MediaFile, MediaOwnership, Medium } from "../src/types.ts";

const SRC = "https://example.org/mm";
const REG = "https://example.org/register";
const IMPRINT = "https://example.org/imprint";
const DAY = "2026-11-18";

const medium = (id: string, publisher: string): Medium => ({
  id,
  name: id.toUpperCase(),
  genre: "press",
  regions: ["GE"],
  publisher,
  publisher_source: IMPRINT,
  source: SRC,
  checked_on: DAY,
});
const company = (id: string, name: string, seat: string | null = "Genève"): Company => ({
  id,
  name,
  legal_form: "SA",
  seat,
  uid: null,
  source: REG,
  checked_on: DAY,
});
const person = (id: string, name: string): Holder => ({ id, name, kind: "person", source: SRC, checked_on: DAY });
const holding = (holder: string, held: string, share: number | null, extra: Partial<Holding> = {}): Holding => ({
  holder,
  held,
  share,
  source: SRC,
  checked_on: DAY,
  ...extra,
});

/**
 * A group with a top (TX-like: family > group > publisher > title), a title with no named owner,
 * a disputed share (Léman Bleu), an association that publishes itself, and a loop the data should never hold.
 */
function fixture(): MediaOwnership {
  const lb = "Deux pages du Medienmonitor attribuent cette part à deux détenteurs.";
  return {
    media: [
      medium("m_tx", "pub"),
      medium("m_alone", "lonely"),
      medium("m_lb", "tvlb"),
      medium("m_assoc", "assoc"),
      medium("m_loop", "loop_a"),
    ],
    companies: [
      company("pub", "Publications SA", "Lausanne"),
      company("group", "Group AG", "Zürich"),
      company("lonely", "Seule SA", null),
      company("tvlb", "TV Bleu SA", "Carouge (GE)"),
      company("esh", "ESH SA", "Neuchâtel"),
      company("loop_a", "Boucle A SA"),
      company("loop_b", "Boucle B SA"),
    ],
    holders: [
      { id: "family", name: "Famille fondatrice", kind: "family", source: SRC, checked_on: DAY },
      person("barbier", "Stéphane Barbier-Mueller"),
      person("hersant", "Philippe Hersant"),
      { id: "ville", name: "Ville de Genève", kind: "public", source: SRC, checked_on: DAY },
      { id: "assoc", name: "Association A", kind: "association", legal_form: "association", seat: "Sierre", source: SRC, checked_on: DAY },
    ],
    holdings: [
      holding("group", "pub", 100),
      holding("family", "group", 66.84),
      holding("barbier", "tvlb", 50.75),
      holding("esh", "tvlb", 24.66, { dispute: "lb", note: lb }),
      holding("hersant", "tvlb", 24.66, { dispute: "lb", note: lb }),
      holding("ville", "tvlb", 17.06),
      holding("loop_b", "loop_a", null),
      holding("loop_a", "loop_b", null),
    ],
    fog: {
      edition: { label: "l", period: "p", ballots: 1, scale_min: -100, scale_max: 100, average: 0, source: SRC, checked_on: DAY },
      values: [],
    },
  };
}

const line = (m: MediaOwnership, id: string, label: string) => cardLines(m, id).find((l) => l.label === label);

test("cardLines gives the publisher's name, legal form and seat, sourced to the register and to the imprint", () => {
  const editeur = line(fixture(), "m_tx", "Éditeur");
  assert.equal(editeur?.text, "Publications SA, société anonyme, Lausanne");
  assert.deepEqual(editeur?.sources, [
    { url: REG, checked_on: DAY },
    { url: IMPRINT, checked_on: DAY },
  ]);
});

test("cardLines leaves out a seat the register does not know, and names an association that publishes itself", () => {
  assert.equal(line(fixture(), "m_alone", "Éditeur")?.text, "Seule SA, société anonyme");
  assert.equal(line(fixture(), "m_assoc", "Éditeur")?.text, "Association A, association, Sierre");
});

test("cardLines gives no Propriétaire line when no source names a holder, never « inconnu »", () => {
  for (const id of ["m_alone", "m_assoc"]) {
    const lines = cardLines(fixture(), id);
    assert.equal(lines.find((l) => l.label === "Propriétaire"), undefined, id);
    assert.ok(!JSON.stringify(lines).includes("inconnu"), id);
  }
});

test("cardLines names each holder of the publisher with its share, largest first, joined by commas", () => {
  const m = fixture();
  assert.equal(line(m, "m_tx", "Propriétaire")?.text, "Group AG (100 %)");
  m.holdings.push(holding("barbier", "pub", null));
  assert.equal(line(m, "m_tx", "Propriétaire")?.text, "Group AG (100 %), Stéphane Barbier-Mueller");
});

test("cardLines shows both disputed holders, each with « sources en désaccord », and the note once", () => {
  const owner = line(fixture(), "m_lb", "Propriétaire");
  assert.equal(
    owner?.text,
    "Stéphane Barbier-Mueller (50,75 %), ESH SA (24,66 %, sources en désaccord), Philippe Hersant (24,66 %, sources en désaccord), Ville de Genève (17,06 %)",
  );
  assert.deepEqual(owner?.notes, ["Deux pages du Medienmonitor attribuent cette part à deux détenteurs."]);
  assert.deepEqual(owner?.sources, [{ url: SRC, checked_on: DAY }]);
});

test("mainHolder is the holder of the largest published share; a lone holder without a share counts as the whole", () => {
  const m = fixture();
  assert.equal(mainHolder(m, "tvlb"), "barbier");
  assert.equal(mainHolder(m, "pub"), "group");
  assert.equal(mainHolder(m, "lonely"), null);
  m.holdings.push(holding("ville", "lonely", null));
  assert.equal(mainHolder(m, "lonely"), "ville");
  m.holdings.push(holding("barbier", "lonely", null));
  assert.equal(mainHolder(m, "lonely"), null, "two holders, no share published: no main holder");
});

test("chainTop follows the main holders up to the top, and stops on a loop", () => {
  const m = fixture();
  assert.equal(chainTop(m, "pub"), "family");
  assert.equal(chainTop(m, "tvlb"), "barbier");
  assert.equal(chainTop(m, "esh"), "esh");
  assert.ok(["loop_a", "loop_b"].includes(chainTop(m, "loop_a")));
});

test("cardLines adds « Au sommet » only when the chain goes above the holders of the publisher", () => {
  const m = fixture();
  const top = line(m, "m_tx", "Au sommet");
  assert.equal(top?.text, "Famille fondatrice");
  assert.deepEqual(top?.sources, [{ url: SRC, checked_on: DAY }]);
  assert.equal(line(m, "m_lb", "Au sommet"), undefined);
  assert.equal(line(m, "m_alone", "Au sommet"), undefined);
  assert.deepEqual(
    cardLines(m, "m_tx").map((l) => l.label),
    ["Éditeur", "Propriétaire", "Au sommet"],
  );
});

test("on the real data/media.json, every medium has an Éditeur line, and 24 heures reaches TX Group's founding family", () => {
  const file = JSON.parse(readFileSync(new URL("../data/media.json", import.meta.url), "utf8")) as MediaFile;
  const m = file.media_ownership;
  for (const x of m.media) assert.ok(line(m, x.id, "Éditeur")?.text, x.id);
  assert.equal(line(m, "m_24heures", "Au sommet")?.text, "Famille fondatrice de TX Group");
  assert.match(line(m, "m_leman_bleu", "Propriétaire")?.text ?? "", /Philippe Hersant \(24,66 %, sources en désaccord\)/);
});
