/*
 * The second script of the site (PRD-0001 US-21, §8 graph libraries), bundled by `npm run build` into
 * dist/js/media-graph.js: the two drawings of the media page, Réseau with Cytoscape.js and its fcose layout, Soleil
 * in the site's own SVG from the geometry of sunburst.ts. They are kept out of site.js so that the rest of the site
 * keeps its weight. The media page adds this script once, on first use, and calls the functions it registers on
 * `window.civicMediaGraph`. The data stays in site.js: each call hands over what to draw and the callback a tap
 * calls with the id of the medium, company or holder tapped.
 *
 * The drawings carry no fact the lists of the page do not: keyboard and screen-reader users reach every fact there.
 */
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import type { Ring } from "./media-model.ts";
import { arcs, labelled, type Arc } from "./sunburst.ts";

cytoscape.use(fcose);

/** A medium, a company or a holder, as drawn. `kind`: media, company, person, family, public or association. */
export interface GraphNode {
  id: string;
  label: string;
  kind: string;
}

/** A holding, or a publisher publishing a medium: from the holder to what it holds. */
export interface GraphEdge {
  holder: string;
  held: string;
  /** The share as shown ("24,66 %"), or "" when none is published. */
  label: string;
  disputed: boolean;
}

/** A drawing on the page. */
export interface GraphView {
  /** Brings forward the node or sector of `id` and what it is linked to; does nothing for an id not drawn. */
  focus(id: string): void;
  /** Removes the drawing from its box. */
  destroy(): void;
}

/** What this script registers on `window.civicMediaGraph`. */
export interface MediaGraph {
  network(box: HTMLElement, nodes: GraphNode[], edges: GraphEdge[], onTap: (id: string) => void): GraphView;
  sun(box: HTMLElement, rings: Ring[], names: Record<string, string>, onTap: (id: string) => void): GraphView;
}

declare global {
  interface Window {
    civicMediaGraph?: MediaGraph;
  }
}

const SVG_NS = "http://www.w3.org/2000/svg";
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Réseau ---------- */

/** The colours of a kind, from the custom properties of css/site.css, so that the legend and the drawing agree. */
function colours(box: HTMLElement, kind: string): { line: string; fill: string } {
  const css = getComputedStyle(box);
  const k = kind === "family" ? "person" : kind;
  return { line: css.getPropertyValue(`--media-${k}`).trim(), fill: css.getPropertyValue(`--media-${k}-fill`).trim() };
}

const SHAPES: [string, cytoscape.Css.NodeShape][] = [
  ["media", "round-rectangle"],
  ["company", "rectangle"],
  ["person", "ellipse"],
  ["family", "ellipse"],
  ["public", "diamond"],
  ["association", "cut-rectangle"],
];

function networkStyle(box: HTMLElement): cytoscape.StylesheetJson {
  const css = getComputedStyle(box);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "font-family": "Noto Sans, Hind, sans-serif",
        "font-size": 10,
        color: v("--cc-text"),
        "text-wrap": "wrap",
        "text-max-width": "96px",
        "text-valign": "center",
        "text-halign": "center",
        width: "label",
        height: "label",
        padding: "7px",
        "border-width": 1.5,
      },
    },
    { selector: 'node[kind = "media"]', style: { "font-size": 12, "font-weight": "bold", "border-width": 2.5, padding: "9px" } },
    ...SHAPES.map(([kind, shape]) => {
      const c = colours(box, kind);
      return { selector: `node[kind = "${kind}"]`, style: { shape, "border-color": c.line, "background-color": c.fill } };
    }),
    { selector: 'node[kind = "family"]', style: { "border-style": "double", "border-width": 4 } },
    { selector: 'node[kind = "public"]', style: { padding: "16px" } },
    {
      selector: "edge",
      style: {
        width: 1.4,
        "line-color": v("--media-edge"),
        "target-arrow-color": v("--media-edge"),
        "target-arrow-shape": "triangle",
        "arrow-scale": 0.8,
        "curve-style": "bezier",
        label: "data(label)",
        "font-size": 9,
        color: v("--cc-muted"),
        "text-background-color": v("--cc-surface"),
        "text-background-opacity": 1,
        "text-background-padding": "2px",
      },
    },
    { selector: "edge[?disputed]", style: { "line-style": "dashed" } },
    { selector: ".faded", style: { opacity: 0.14 } },
    { selector: "node.focus", style: { "border-width": 4, "border-color": v("--media-media") } },
    { selector: "edge.focus", style: { width: 2.4, "line-color": v("--media-media"), "target-arrow-color": v("--media-media"), color: v("--cc-text") } },
  ];
}

function network(box: HTMLElement, nodes: GraphNode[], edges: GraphEdge[], onTap: (id: string) => void): GraphView {
  const cy = cytoscape({
    container: box,
    style: networkStyle(box),
    minZoom: 0.2,
    maxZoom: 3,
    elements: [
      ...nodes.map((n) => ({ data: { id: n.id, label: n.label, kind: n.kind } })),
      ...edges.map((e, i) => ({ data: { id: "h" + i, source: e.holder, target: e.held, label: e.label, disputed: e.disputed } })),
    ],
  });
  cy.layout({
    name: "fcose",
    quality: "proof",
    randomize: true,
    animate: false,
    nodeRepulsion: 9000,
    idealEdgeLength: 62,
    nodeSeparation: 60,
    packComponents: true,
    padding: 20,
  } as cytoscape.LayoutOptions).run();
  // fcose lays out wide; a phone's box is tall: turn the drawing a quarter so that it fills the box.
  const bb = cy.elements().boundingBox();
  if (box.clientHeight > box.clientWidth * 1.15 && bb.w > bb.h) cy.nodes().positions((n) => ({ x: n.position("y"), y: n.position("x") }));
  cy.fit(undefined, 16);
  cy.on("tap", "node", (e) => onTap(e.target.id()));
  cy.on("tap", (e) => {
    if (e.target === cy) cy.elements().removeClass("faded focus");
  });

  return {
    focus(id) {
      const node = cy.getElementById(id);
      if (!node.length) return;
      const near = node.predecessors().union(node.successors()).union(node);
      cy.elements().removeClass("faded focus");
      cy.elements().not(near).addClass("faded");
      near.edges().addClass("focus");
      node.addClass("focus");
      const b = near.boundingBox();
      const zoom = Math.min(1.1, (cy.width() - 60) / Math.max(b.w, 1), (cy.height() - 60) / Math.max(b.h, 1));
      cy.animate({ zoom, center: { eles: near } }, { duration: reducedMotion() ? 0 : 300 });
    },
    destroy: () => cy.destroy(),
  };
}

/* ---------- Soleil ---------- */

const SUN_SIZE = 360;
const LABEL_FONT = [0, 10, 11];

/** A name shortened to the room of its sector, with "…" when cut. */
function fit(name: string, width: number, font: number): string {
  const max = Math.max(1, Math.floor(width / (font * 0.56)));
  return name.length <= max ? name : name.slice(0, Math.max(1, max - 1)).trimEnd() + "…";
}

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function sun(box: HTMLElement, rings: Ring[], names: Record<string, string>, onTap: (id: string) => void): GraphView {
  const root = svg("svg", { viewBox: `0 0 ${SUN_SIZE} ${SUN_SIZE}`, class: "sun", "aria-hidden": "true" });
  box.appendChild(root);
  let shown = rings;

  /** Draws the rings, or one part of them: a kind, or one owner. */
  function draw(part: Ring[]): void {
    shown = part;
    root.replaceChildren();
    for (const a of arcs(part, SUN_SIZE)) {
      const g = svg("g", { class: `sun__sector sun__sector--${a.kind} sun__sector--l${a.level}`, "data-id": a.id, "data-level": a.level });
      g.appendChild(svg("path", { d: a.d }));
      const l = labelled(a);
      if (l) {
        const t = svg("text", { x: l.x, y: l.y, "text-anchor": l.anchor, "dominant-baseline": "central", transform: `rotate(${l.rotate} ${l.x} ${l.y})`, "font-size": LABEL_FONT[a.level] });
        t.textContent = fit(names[a.id] ?? a.id, l.width, LABEL_FONT[a.level]);
        g.appendChild(t);
      }
      root.appendChild(g);
    }
    const hole = svg("circle", { cx: SUN_SIZE / 2, cy: SUN_SIZE / 2, r: SUN_SIZE * 0.03 - 1, class: "sun__centre" });
    root.appendChild(hole);
  }

  /** The part of the rings that holds `id`: its kind (level 0), its owner (level 1 or 2), else null. */
  function partOf(arc: Arc): Ring[] | null {
    if (arc.level === 0) return rings.filter((r) => r.kind === arc.id);
    const ownerId = arc.level === 1 ? arc.id : arc.parent;
    for (const r of rings) {
      const owner = r.owners.find((o) => o.id === ownerId);
      if (owner) return [{ kind: r.kind, owners: [owner] }];
    }
    return null;
  }

  function arcOf(id: string): Arc | undefined {
    return arcs(rings, SUN_SIZE).find((a) => a.id === id && a.level > 0);
  }

  function highlight(id: string): void {
    root.querySelectorAll(".sun__sector").forEach((g) => g.classList.toggle("sun__sector--focus", g.getAttribute("data-id") === id));
  }

  root.addEventListener("click", (e) => {
    const target = e.target as Element;
    if (target.closest(".sun__centre")) {
      draw(rings);
      return;
    }
    const g = target.closest(".sun__sector");
    const id = g?.getAttribute("data-id");
    if (!g || !id) return;
    const level = Number(g.getAttribute("data-level"));
    const arc = arcs(shown, SUN_SIZE).find((a) => a.id === id && a.level === level);
    const part = arc && partOf(arc);
    if (part) draw(part);
    if (level > 0) {
      highlight(id);
      onTap(id);
    }
  });

  draw(rings);
  return {
    focus(id) {
      const arc = arcOf(id);
      const part = arc && partOf(arc);
      if (!part) return;
      draw(part);
      highlight(id);
    },
    destroy: () => root.remove(),
  };
}

window.civicMediaGraph = { network, sun };
