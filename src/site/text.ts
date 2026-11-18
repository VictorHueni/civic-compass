/* Text helpers without DOM, shared by the pages and the pure modules that the tools also compile. */

/** Lower case, without accents, for the search. */
export function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
