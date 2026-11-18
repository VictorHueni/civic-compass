/*
 * The second script of the site (PRD-0001 US-21, §8 graph libraries), bundled by `npm run build` into
 * dist/js/media-graph.js: Cytoscape.js and its fcose layout, kept out of site.js so that the rest of the site keeps
 * its weight. The media page adds this script once, on first use, and calls the functions it registers on
 * `window.civicMediaGraph`. The data stays in site.js: each call hands over what to draw and the callback a tap
 * calls with the id of the medium, company or holder tapped.
 */
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";

cytoscape.use(fcose);

/** A medium, a company or a holder, as drawn. */
export interface GraphNode {
  id: string;
  label: string;
  kind: string;
}

/** A holding, from the holder to what it holds. */
export interface GraphEdge {
  holder: string;
  held: string;
  label: string;
  disputed: boolean;
}

/** What this script registers on `window.civicMediaGraph`. */
export interface MediaGraph {
  /** Draws the holdings network into `box`, replacing what it held; returns a function that removes the drawing. */
  network(box: HTMLElement, nodes: GraphNode[], edges: GraphEdge[], onTap: (id: string) => void): () => void;
}

declare global {
  interface Window {
    civicMediaGraph?: MediaGraph;
  }
}

function network(box: HTMLElement, nodes: GraphNode[], edges: GraphEdge[], onTap: (id: string) => void): () => void {
  const cy = cytoscape({
    container: box,
    elements: [
      ...nodes.map((n) => ({ data: { id: n.id, label: n.label, kind: n.kind } })),
      ...edges.map((e, i) => ({ data: { id: "h" + i, source: e.holder, target: e.held, label: e.label, disputed: e.disputed } })),
    ],
    layout: { name: "fcose", animate: false, randomize: true } as cytoscape.LayoutOptions,
    style: [
      { selector: "node", style: { label: "data(label)", "font-size": 10, "text-wrap": "wrap", "text-max-width": "90px" } },
      { selector: "edge", style: { "curve-style": "bezier", "target-arrow-shape": "triangle", width: 1 } },
    ],
  });
  cy.on("tap", "node", (e) => onTap(e.target.id()));
  return () => cy.destroy();
}

window.civicMediaGraph = { network };
