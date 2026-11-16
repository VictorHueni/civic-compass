/* Small helpers shared by the pages. */

export const SVG_NS = "http://www.w3.org/2000/svg";

export function $(id: string): HTMLElement {
  return document.getElementById(id) as HTMLElement;
}

export function escapeHtml(s: unknown): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

/** Lower case, without accents, for the search. */
export function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** "https://www.ge.ch/" -> "ge.ch" */
export function host(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}
