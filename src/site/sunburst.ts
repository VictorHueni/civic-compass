/*
 * The geometry of Soleil (PRD-0001 US-21): the sectors of its three rings and their labels, computed from the
 * rings of media-model.ts. The centre ring is the kind of the top owner (colour only, no label), the middle ring
 * the top owner, the outer ring the media; each medium weighs the same. Angles in degrees, 0 at the top, clockwise.
 *
 * Pure functions, without DOM, shared by the second script (media-graph.ts) and the tests.
 */
import type { Ring, TopKind } from "./media-model.ts";

/** One sector: a kind (level 0), a top owner (1) or a medium (2). */
export interface Arc {
  id: string;
  level: 0 | 1 | 2;
  /** The id of the sector it lies in; null on the centre ring. */
  parent: string | null;
  /** The kind of the top owner above it, for its colour. */
  kind: TopKind;
  start: number;
  end: number;
  r0: number;
  r1: number;
  /** The centre of the drawing, at (centre, centre). */
  centre: number;
  /** The SVG path of the sector, in a square of side `size`. */
  d: string;
}

/** Where a label goes: along the radius, from the inner edge, text upright. */
export interface Label {
  x: number;
  y: number;
  /** Rotation in degrees, between -90 and 90. */
  rotate: number;
  anchor: "start" | "end";
  /** The room along the radius, for the page to shorten a long name. */
  width: number;
}

/** The inner and outer radius of each ring, as a share of the drawing's radius (the approved mockup's levels). */
const RADII: [number, number][] = [
  [0.06, 0.13],
  [0.13, 0.4],
  [0.4, 0.97],
];
/** Below this angle a sector gets no label: none on the centre ring, which the owner found unreadable on a phone. */
const MIN_LABEL_ANGLE = [Infinity, 14, 4];

const round = (n: number) => Math.round(n * 100) / 100;

function point(c: number, angle: number, r: number): string {
  const a = (angle * Math.PI) / 180;
  return round(c + r * Math.sin(a)) + " " + round(c - r * Math.cos(a));
}

/** An annular sector; a full turn is drawn as two half turns out and two back in, as one closed path. */
function sectorPath(c: number, start: number, end: number, r0: number, r1: number): string {
  if (end - start >= 360 - 1e-9) {
    return (
      `M${point(c, 0, r1)}A${r1} ${r1} 0 1 1 ${point(c, 180, r1)}A${r1} ${r1} 0 1 1 ${point(c, 0, r1)}` +
      `L${point(c, 0, r0)}A${r0} ${r0} 0 1 0 ${point(c, 180, r0)}A${r0} ${r0} 0 1 0 ${point(c, 0, r0)}Z`
    );
  }
  const large = end - start > 180 ? 1 : 0;
  return (
    `M${point(c, start, r1)}A${r1} ${r1} 0 ${large} 1 ${point(c, end, r1)}` +
    `L${point(c, end, r0)}A${r0} ${r0} 0 ${large} 0 ${point(c, start, r0)}Z`
  );
}

/** The sectors of the three rings, centre first, for a drawing of side `size`. */
export function arcs(rings: Ring[], size: number): Arc[] {
  const c = size / 2;
  const total = rings.reduce((n, r) => n + r.owners.reduce((k, o) => k + o.media.length, 0), 0);
  const step = total ? 360 / total : 0;
  const out: Arc[] = [];
  const add = (id: string, level: 0 | 1 | 2, parent: string | null, kind: TopKind, start: number, count: number) => {
    const [f0, f1] = RADII[level];
    const end = start + count * step;
    out.push({ id, level, parent, kind, start, end, r0: f0 * c, r1: f1 * c, centre: c, d: sectorPath(c, start, end, f0 * c, f1 * c) });
    return end;
  };
  let at = 0;
  for (const ring of rings) {
    let ownerAt = at;
    for (const owner of ring.owners) {
      let mediumAt = ownerAt;
      for (const medium of owner.media) mediumAt = add(medium, 2, owner.id, ring.kind, mediumAt, 1);
      ownerAt = add(owner.id, 1, ring.kind, ring.kind, ownerAt, owner.media.length);
    }
    at = add(ring.kind, 0, null, ring.kind, at, ring.owners.reduce((k, o) => k + o.media.length, 0));
  }
  return out.sort((a, b) => a.level - b.level || a.start - b.start);
}

/** The label of a sector wide enough to hold one, else null. */
export function labelled(arc: Arc): Label | null {
  const mid = (arc.start + arc.end) / 2;
  if (arc.end - arc.start < MIN_LABEL_ANGLE[arc.level]) return null;
  const c = arc.centre;
  const pad = (arc.r1 - arc.r0) * 0.06;
  const a = (mid * Math.PI) / 180;
  const r = arc.r0 + pad;
  const right = mid <= 180;
  return {
    x: round(c + r * Math.sin(a)),
    y: round(c - r * Math.cos(a)),
    rotate: round(right ? mid - 90 : mid - 270),
    anchor: right ? "start" : "end",
    width: round(arc.r1 - arc.r0 - 2 * pad),
  };
}
