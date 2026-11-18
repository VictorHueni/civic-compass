/*
 * Tests of src/site/media-model.ts (PRD-0001 US-20 and US-21): the lines of a medium's card, per the decision table
 * "the lines of a medium's card and list entry" of docs/plans/active/transparency-media/ (API tab); the media a
 * holder reaches, the people and families that link several media, the rings of Soleil and the search by name.
 * Run: npm test.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { bridges, cardLines, chainTop, fogBox, hasCard, mainHolder, reach, rings, search } from "../src/site/media-model.ts";
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
 * A group with a top (TX-like: family > group > publisher > two titles), a title with no named owner,
 * a disputed share (Léman Bleu), an association that publishes itself, and a loop the data should never hold.
 */
function fixture(): MediaOwnership {
  const lb = "Deux pages du Medienmonitor attribuent cette part à deux détenteurs.";
  return {
    media: [
      medium("m_tx", "pub"),
      medium("m_tx2", "pub"),
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

test("reach lists the media a holder reaches through any chain, in file order, and stops on a loop", () => {
  const m = fixture();
  assert.deepEqual(reach(m, "family"), ["m_tx", "m_tx2"]);
  assert.deepEqual(reach(m, "pub"), ["m_tx", "m_tx2"]);
  assert.deepEqual(reach(m, "hersant"), ["m_lb"]);
  assert.deepEqual(reach(m, "assoc"), ["m_assoc"]);
  assert.deepEqual(reach(m, "m_lb"), ["m_lb"]);
  assert.deepEqual(reach(m, "loop_b"), ["m_loop"]);
  assert.deepEqual(reach(m, "unknown"), []);
});

test("bridges names the people and families in the chain of at least two media, and no company", () => {
  const m = fixture();
  assert.deepEqual(bridges(m), [{ id: "family", media: ["m_tx", "m_tx2"] }]);
  m.holdings.push(holding("barbier", "pub", null));
  assert.deepEqual(
    bridges(m).map((b) => b.id),
    ["barbier", "family"],
    "three media before two; Group AG and Publications SA reach two media but are companies",
  );
});

test("rings gives the kind of top owner, the top owner and its media; each medium under its main holder's chain", () => {
  assert.deepEqual(rings(fixture()), [
    {
      kind: "people",
      owners: [
        { id: "family", media: ["m_tx", "m_tx2"] },
        { id: "barbier", media: ["m_lb"] },
      ],
    },
    { kind: "association", owners: [{ id: "assoc", media: ["m_assoc"] }] },
    {
      kind: "company",
      owners: [
        { id: "loop_b", media: ["m_loop"] },
        { id: "lonely", media: ["m_alone"] },
      ],
    },
  ]);
});

test("rings puts a public body in its own ring, between people and associations", () => {
  const m = fixture();
  m.holdings.push(holding("ville", "lonely", 100));
  assert.deepEqual(
    rings(m).map((r) => r.kind),
    ["people", "public", "association", "company"],
  );
});

test("search finds a name without accents or case, an exact name before a partial one, else null", () => {
  const m = fixture();
  assert.equal(search(m, "stephane"), "barbier");
  assert.equal(search(m, "  TV BLEU sa "), "tvlb");
  m.companies.unshift(company("gh", "Group AG Holding"));
  assert.equal(search(m, "group ag"), "group", "the exact name wins over an earlier partial one");
  assert.equal(search(m, "group"), "gh", "else the first partial match in file order");
  assert.equal(search(m, "ville de geneve"), "ville");
  assert.equal(search(m, "nothing like it"), null);
  assert.equal(search(m, "   "), null);
});

test("on the real data/media.json, every medium is in the outer ring exactly once, and « Leman » finds Léman Bleu", () => {
  const file = JSON.parse(readFileSync(new URL("../data/media.json", import.meta.url), "utf8")) as MediaFile;
  const m = file.media_ownership;
  const outer = rings(m).flatMap((r) => r.owners.flatMap((o) => o.media));
  assert.deepEqual([...outer].sort(), m.media.map((x) => x.id).sort());
  assert.equal(search(m, "Leman"), "m_leman_bleu");
  for (const b of bridges(m)) {
    assert.ok(b.media.length >= 2, b.id);
    assert.ok(m.holders.some((h) => h.id === b.id && (h.kind === "person" || h.kind === "family")), b.id);
  }
});

/** The fixture with the fög edition of February 2026 and one measured title. */
function withFog(): MediaOwnership {
  const m = fixture();
  m.fog = {
    edition: {
      label: "Tonalité de la couverture des votations fédérales, fög / Université de Zurich",
      period: "2018 à 2025",
      ballots: 61,
      scale_min: -100,
      scale_max: 100,
      average: -4,
      source: "https://example.org/foeg.pdf",
      checked_on: DAY,
    },
    values: [{ medium: "m_tx", measured_as: "tx.ch", value: -5 }],
  };
  return m;
}

test("fogBox gives a measured title its value under the fög's label, the scale, the ballots, the average and the source", () => {
  const box = fogBox(withFog(), "m_tx");
  assert.ok(box.measured);
  assert.equal(box.label, "Tonalité des votations");
  assert.equal(box.edition, "Tonalité de la couverture des votations fédérales, fög / Université de Zurich");
  assert.equal(box.value, -5);
  assert.equal(box.shown, "−5", "a true minus sign, as the fög prints it");
  assert.equal(box.about, "Tonalité de la couverture de 61 votations fédérales (2018 à 2025) pour tx.ch.");
  assert.equal(box.scale, "Échelle de −100 (soutien aux projets de centre-gauche) à +100 (soutien aux projets de centre-droite).");
  assert.deepEqual([box.min, box.max, box.average], [-100, 100, -4]);
  assert.equal(box.averageText, "Moyenne des médias étudiés : −4.");
  assert.equal(box.disclaimer, "Ce n'est pas une position politique du média.");
  assert.deepEqual(box.source, { url: "https://example.org/foeg.pdf", checked_on: DAY });
});

test("fogBox says « Pas de mesure du fög pour ce média » for a title the fög does not measure, never a guess", () => {
  const box = fogBox(withFog(), "m_alone");
  assert.deepEqual(box, { measured: false, label: "Tonalité des votations", text: "Pas de mesure du fög pour ce média." });
});

test("« gauche » and « droite » only describe the ends of the scale, never the title: not in its value, label or card lines", () => {
  const m = withFog();
  const box = fogBox(m, "m_tx");
  assert.ok(box.measured);
  const { scale, ...rest } = box;
  assert.match(scale, /gauche.*droite/);
  for (const text of [JSON.stringify(rest), JSON.stringify(fogBox(m, "m_alone")), JSON.stringify(cardLines(m, "m_tx"))]) {
    assert.doesNotMatch(text, /gauche|droite/i);
  }
});

test("on the real data/media.json, the seven measured titles and RTS's two outlets show a value, and La Liberté shows none", () => {
  const file = JSON.parse(readFileSync(new URL("../data/media.json", import.meta.url), "utf8")) as MediaFile;
  const m = file.media_ownership;
  const shown: Record<string, string> = {};
  for (const x of m.media) {
    const box = fogBox(m, x.id);
    if (box.measured) shown[x.id] = box.shown;
  }
  assert.deepEqual(shown, { m_matin_dimanche: "−11", m_lematin: "−9", m_tdg: "−7", m_le_temps: "−6", m_24heures: "−5", m_20minutes: "−3", m_rts_1: "−2", m_rts_ch: "−2" });
  assert.equal(fogBox(m, "m_la_liberte").measured, false);
});

/** The fixture with a person who asked for removal: no name, a removal record, two holdings kept. */
function withRemoved(): MediaOwnership {
  const m = fixture();
  m.holders.push({ id: "anon", kind: "person", source: SRC, checked_on: DAY, removal: { fingerprint: "0".repeat(64), date: DAY, reason: "person_request" } });
  m.holdings.push(holding("anon", "lonely", 60), holding("anon", "pub", null));
  return m;
}

test("a holder removed on request shows as « actionnaire privé » with its share, never a name", () => {
  const m = withRemoved();
  assert.equal(line(m, "m_alone", "Propriétaire")?.text, "actionnaire privé (60 %)");
  assert.equal(line(m, "m_tx", "Propriétaire")?.text, "Group AG (100 %), actionnaire privé");
});

test("a removed holder has no card, is not found by the search, and is not in « Ils relient plusieurs médias »", () => {
  const m = withRemoved();
  assert.equal(hasCard(m, "anon"), false);
  for (const id of ["m_tx", "pub", "barbier", "assoc"]) assert.equal(hasCard(m, id), true, id);
  assert.equal(hasCard(m, "nobody"), false);
  assert.deepEqual(reach(m, "anon"), ["m_tx", "m_tx2", "m_alone"], "it still reaches three media");
  assert.ok(!bridges(m).some((b) => b.id === "anon"));
  assert.equal(search(m, "actionnaire privé"), null);
});

test("Soleil keeps the media under a removed top owner: the outer ring stays complete", () => {
  const m = withRemoved();
  const people = rings(m).find((r) => r.kind === "people");
  assert.deepEqual(people?.owners.find((o) => o.id === "anon"), { id: "anon", media: ["m_alone"] });
  assert.equal(rings(m).flatMap((r) => r.owners.flatMap((o) => o.media)).length, m.media.length);
});
