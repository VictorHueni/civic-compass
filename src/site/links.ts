/*
 * Ids of the referential entries the site links to by name (menus, ballot page, decision aids).
 * The URLs themselves live only in data/*.json. `npm run check` fails if an id is missing,
 * and if an entry linked directly has no URL.
 */

/** Entries of data/state-sites.json. */
export const STATE_SITE_IDS = {
  laws: "fedlex-ch",
  parliament: "parlement-federal-ch",
  chancellery: "chancellerie-federale-ch",
  statistics: "office-federal-de-la-statistique-ch",
  portal: "ch-ch-ch",
} as const;

/** Entries of data/tools.json linked directly. */
export const TOOL_IDS = {
  easyvote: "easyvote",
  smartvote: "smartvote",
  smartmonitor: "smartmonitor",
  swissvotes: "swissvotes",
} as const;

/** Entries of data/tools.json listed on the "Aides à décider" page, shown in the order of tools.json. */
export const TOOLS_PAGE_IDS = {
  understand: ["easyvote", "annee-politique-suisse"],
  compare: ["smartvote", "smartmonitor", "politpro", "swissvotes"],
} as const;
