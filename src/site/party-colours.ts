/*
 * Party colours, palette B2 (PRD-0001 §8, settled on 2026-11-17). A party keeps its colour on every
 * page; at most 8 colours per chart, so the parties without one fold into "Autres". Yellow and aqua
 * are light on white: a chart always comes with its legend and figures.
 *
 * Grands Conseils (owner, 2026-11-17, rule A): in each canton, the party without a colour that holds the
 * most seats takes the 8th colour (MCG in GE, POP in NE...), the others fold into "Autres". The 8th colour
 * passes the colour checks against each colour of B2. The same colour names a different party from one
 * canton to another, so the legend is mandatory there too.
 */

/** By `abbr` of a CH party in parties.json. */
const PARTY_COLOURS: Record<string, string> = {
  Verts: "#eda100",
  PS: "#e34948",
  PVL: "#6250d6",
  Centre: "#eb6834",
  PEV: "#1baf7a",
  PLR: "#2a78d6",
  UDC: "#008300",
};
export const OTHERS_COLOUR = "#898781";
export const EIGHTH_COLOUR = "#b8338f";

/** The parties that have a colour of their own. */
export function hasColour(abbr: string): boolean {
  return abbr in PARTY_COLOURS;
}
/** The colour of a party, or the one of "Autres" (abbr null, or a party without a colour). */
export function partyColour(abbr: string | null): string {
  return (abbr !== null && PARTY_COLOURS[abbr]) || OTHERS_COLOUR;
}
