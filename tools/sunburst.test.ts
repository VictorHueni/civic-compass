/*
 * Tests of the geometry of Soleil (src/site/sunburst.ts, PRD-0001 US-21): the sectors of the three rings and their
 * labels, per the code tab of docs/plans/active/transparency-media/. Run: npm test.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { arcs, labelled, type Arc } from "../src/site/sunburst.ts";
import type { Ring } from "../src/site/media-model.ts";

const RINGS: Ring[] = [
  {
    kind: "people",
    owners: [
      { id: "family", media: ["a", "b", "c", "d", "e"] },
      { id: "raemy", media: ["f", "g", "h"] },
    ],
  },
  { kind: "association", owners: [{ id: "ssr", media: ["i", "j", "k", "l", "m", "n", "o"] }] },
  {
    kind: "company",
    owners: [
      { id: "esh", media: ["p", "q", "r"] },
      { id: "lonely", media: ["s"] },
    ],
  },
];
const SIZE = 360;
const level = (all: Arc[], n: number) => all.filter((a) => a.level === n);
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

test("the sectors of each ring cover 360° from the top, clockwise, without gap or overlap", () => {
  const all = arcs(RINGS, SIZE);
  for (const n of [0, 1, 2]) {
    const ring = level(all, n);
    assert.ok(close(ring[0].start, 0), `level ${n} starts at the top`);
    for (let i = 1; i < ring.length; i++) assert.ok(close(ring[i].start, ring[i - 1].end), `level ${n}, sector ${i}`);
    assert.ok(close(ring[ring.length - 1].end, 360), `level ${n} ends at 360°`);
  }
  assert.deepEqual(
    level(all, 0).map((a) => a.id),
    ["people", "association", "company"],
  );
  assert.equal(level(all, 2).length, 19, "one outer sector per medium");
});

test("a sector's angle is proportional to its media; a child's arc lies inside its parent's", () => {
  const all = arcs(RINGS, SIZE);
  const byId = new Map(all.map((a) => [a.id, a]));
  assert.ok(close(byId.get("family")!.end - byId.get("family")!.start, (360 * 5) / 19));
  for (const a of all.filter((x) => x.parent !== null)) {
    const p = byId.get(a.parent!)!;
    assert.equal(p.level, a.level - 1, a.id);
    assert.ok(a.start >= p.start - 1e-9 && a.end <= p.end + 1e-9, `${a.id} inside ${p.id}`);
  }
  assert.equal(byId.get("f")!.parent, "raemy");
  assert.equal(byId.get("raemy")!.parent, "people");
  assert.equal(byId.get("s")!.kind, "company", "every sector carries the kind of its top owner, for its colour");
});

test("the rings are nested: centre, owners, media, each within the radius of the drawing", () => {
  const all = arcs(RINGS, SIZE);
  const [c, o, m] = [0, 1, 2].map((n) => level(all, n)[0]);
  assert.ok(c.r0 > 0 && c.r0 < c.r1 && close(c.r1, o.r0) && o.r0 < o.r1 && close(o.r1, m.r0) && m.r0 < m.r1);
  assert.ok(m.r1 <= SIZE / 2);
});

test("a single sector in a ring is a full circle, drawn as a closed path", () => {
  const all = arcs([RINGS[1]], SIZE);
  for (const a of all) {
    assert.ok(close(a.end - a.start, a.level === 2 ? 360 / 7 : 360), a.id);
    assert.match(a.d, /^M[^Z]+Z$/, a.id);
  }
});

test("no label on the centre ring, nor on a sector below the threshold of its ring", () => {
  const all = arcs(RINGS, SIZE);
  for (const a of level(all, 0)) assert.equal(labelled(a), null, a.id);
  const narrow = arcs([{ kind: "company", owners: Array.from({ length: 100 }, (_, i) => ({ id: "o" + i, media: ["m" + i] })) }], SIZE);
  for (const a of narrow.filter((x) => x.level > 0)) assert.equal(labelled(a), null, a.id + " is 3.6° wide");
  assert.ok(labelled(all.find((a) => a.id === "family")!));
  assert.ok(labelled(all.find((a) => a.id === "s")!));
});

test("a label runs along the radius, upright: its rotation stays within ±90°, anchored at the inner edge", () => {
  for (const a of arcs(RINGS, SIZE).filter((x) => x.level > 0)) {
    const l = labelled(a);
    if (!l) continue;
    assert.ok(l.rotate >= -90 && l.rotate <= 90, `${a.id}: ${l.rotate}`);
    const mid = (a.start + a.end) / 2;
    assert.equal(l.anchor, mid <= 180 ? "start" : "end", a.id);
    const r = Math.hypot(l.x - SIZE / 2, l.y - SIZE / 2);
    assert.ok(r > a.r0 && r < a.r0 + (a.r1 - a.r0) / 4, `${a.id} starts near the inner edge`);
    assert.ok(l.width > 0 && l.width < a.r1 - a.r0, a.id);
  }
});
