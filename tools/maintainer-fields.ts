/*
 * Fields of data/*.json kept for the maintainers only: removed from the bundle, the site never reads them.
 * Kept apart from tools/build.ts, which empties dist/ and builds as soon as it is imported, so that it can be tested.
 */

/**
 * _readme: notes to editors; request: the query behind a generated file; left_right: kept for a later use;
 * fingerprint: the hash of a name removed on request (US-24), which the page must not carry.
 */
export const MAINTAINER_ONLY = new Set(["_readme", "left_right", "request", "fingerprint"]);

/** The JSON text of a data file as the site gets it: every maintainer-only key removed, at any depth. */
export function parseForSite(text: string): unknown {
  return JSON.parse(text, (key, value) => (MAINTAINER_ONLY.has(key) ? undefined : value));
}
