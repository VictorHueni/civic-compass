/* Small helpers shared by the pages. */

export const SVG_NS = "http://www.w3.org/2000/svg";

export function $(id: string): HTMLElement {
  return document.getElementById(id) as HTMLElement;
}

export function escapeHtml(s: unknown): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

/** "2026-11-17" -> "17.11.2026" */
export function swissDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return d + "." + m + "." + y;
}

/** "https://www.ge.ch/" -> "ge.ch" */
export function host(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}
