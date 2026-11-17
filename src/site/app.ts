/*
 * Routing, menu, territory picker (canton map), parties hemicycle, decision aids and official sites.
 * The ballot page (ballot.ts) and the institutions page (institutions.ts) re-render through onRender().
 */
import { $, SVG_NS, escapeHtml as esc, host, normalize, swissDate } from "./dom.ts";
import { STATE_SITE_IDS, TOOLS_PAGE_IDS } from "./links.ts";
import { allCantons, ballot, cantonalGovernments, cantonalParliaments, cantons, federal, parliament, stateSiteUrl, tools, type Level } from "./referential.ts";
import { cantonRow } from "./cantonal-parliaments.ts";
import { cantonalStanding, governmentSources, siteName } from "./cantonal-standing.ts";
import { isFederalCouncillor, mainLabel, membersOf, partyLabel, partyMembers } from "./parliament.ts";
import { presidencyFact } from "./presidency.ts";
import type { CantonBallot } from "../types.ts";

export type LevelKind = "federal" | "canton";
/** Route segments: #<page>/<territory>, territory "ch" or a canton code in lower case. */
const PAGES = ["ballot", "parties", "tools", "state", "institutions"] as const;
type Page = (typeof PAGES)[number];
/** Id of the block of each page in index.html. */
const PAGE_IDS: Record<Page, string> = { ballot: "page-ballot", parties: "page-parties", tools: "page-tools", state: "page-state", institutions: "page-institutions" };
/** French routes used until 2026-11-16, still accepted so old links and bookmarks keep working. */
const LEGACY_PAGES: Record<string, Page> = { votation: "ballot", partis: "parties", aides: "tools", etat: "state" };
/** Territory segment of the Confederation; "federal" is its legacy spelling. */
const CH = "ch";
const LEGACY_CH = "federal";
/** localStorage keys of the last territory, and the keys they replaced (read once, then removed). */
const SCOPE_KEY = "civic-compass.scope";
const CANTON_KEY = "civic-compass.canton";
const LEGACY_KEYS: [string, string][] = [[SCOPE_KEY, "boussole-niveau"], [CANTON_KEY, "boussole-canton"]];

let level: LevelKind = "federal";
let canton = "GE"; // last canton chosen
let index = 0;
let query = "";
let page: Page = "ballot";
const renderListeners: (() => void)[] = [];

export function cantonName(code: string): string {
  for (const [c, name] of allCantons) if (c === code) return name;
  return code;
}
/** "de Genève", "d'Argovie", "du Jura" */
export function ofCanton(code: string): string {
  const n = cantonName(code);
  return code === "JU" || code === "VS" ? "du " + n : (/^[AEIOUÉ]/.test(n) ? "d'" : "de ") + n;
}
function isCovered(code: string): boolean {
  return !!cantons[code];
}
function current(): Level {
  return level === "federal" ? federal : (cantons[canton] as Level);
}
function levelCode(): string {
  return level === "federal" ? "CH" : canton;
}

/** The territory currently chosen. */
export function scope(): { level: LevelKind; canton: string } {
  return { level, canton };
}
/** Called after every render, for the pages rendered elsewhere. */
export function onRender(listener: () => void): void {
  renderListeners.push(listener);
}

/* ---------- Territory (Confederation or a canton), chosen on the map ---------- */
interface Route {
  page?: Page;
  level?: LevelKind;
  canton?: string;
}
function isPage(p: string | undefined): p is Page {
  return (PAGES as readonly string[]).indexOf(p as string) > -1;
}
function parseHash(hash: string): Route {
  const parts = (hash || "").replace(/^#\/?/, "").toLowerCase().split("/");
  const p = parts[0] && parts[0] in LEGACY_PAGES ? LEGACY_PAGES[parts[0]] : parts[0];
  let s = parts[1] === LEGACY_CH ? CH : parts[1];
  const r: Route = {};
  if (isPage(p)) {
    r.page = p;
  } else if (p === CH || p === LEGACY_CH || (p && isCovered(p.toUpperCase()))) {
    r.page = "ballot";
    s = p === LEGACY_CH ? CH : p;
  }
  if (s === CH) {
    r.level = "federal";
  } else if (s && isCovered(s.toUpperCase())) {
    r.level = "canton";
    r.canton = s.toUpperCase();
  }
  return r;
}
function scopeKey(): string {
  return level === "federal" ? CH : canton.toLowerCase();
}
function updateAddress(): void {
  if (history.replaceState) {
    try {
      history.replaceState(null, "", "#" + page + "/" + scopeKey());
    } catch {}
  }
}
function remember(): void {
  try {
    localStorage.setItem(SCOPE_KEY, scopeKey());
    localStorage.setItem(CANTON_KEY, canton);
  } catch {}
}
function updateBar(): void {
  renderStateMenu();
  $("scope-val").textContent = level === "federal" ? "Confédération" : cantonName(canton);
  document.querySelectorAll("#menu a[data-page]").forEach((l) => {
    if (l.getAttribute("data-page") === page) l.setAttribute("aria-current", "page");
    else l.removeAttribute("aria-current");
  });
  PAGES.forEach((p) => {
    $(PAGE_IDS[p]).hidden = p !== page;
  });
}
function apply(kind: LevelKind, code: string | null): void {
  level = kind;
  if (code) canton = code;
  index = 0;
  remember();
  updateAddress();
  updateBar();
  renderAll();
}
function renderAll(): void {
  if (page === "parties") {
    renderTitle();
    renderHemicycle();
    renderDetail();
  }
  if (page === "state") renderStateSites();
  if (page === "tools") renderTools();
  renderListeners.forEach((f) => f());
}

/* ---------- Menu "Voir ce que fait l'État": official sites for the territory ---------- */
function cantonBallot(code: string): CantonBallot | undefined {
  return ballot.cantons[code];
}
function renderStateMenu(): void {
  const fed = level === "federal";
  const c = current();
  const first = c.stateSites[0]?.url as string;
  const cant = cantonBallot(canton) || { url: first };
  function find(word: string, fallback: string): string {
    const l = c.stateSites.filter((x) => x.name.toLowerCase().indexOf(word) > -1)[0];
    return l ? l.url : fallback;
  }
  const items: [string, string][] = [
    ["Lire une loi", fed ? stateSiteUrl(STATE_SITE_IDS.laws) : first],
    ["Voir les résultats", fed ? stateSiteUrl(STATE_SITE_IDS.chancellery) : find("votations", cant.url)],
    ["Consulter les chiffres", stateSiteUrl(STATE_SITE_IDS.statistics)],
  ];
  // "Qui gouverne et qui siège" replaces the external "Trouver un élu" link (PRD-0001 US-13).
  $("menu-state").innerHTML =
    '<li><a href="#institutions" data-page="institutions"><b>Qui gouverne et qui siège</b><small>Gouvernement, parlements, élus</small></a></li>' +
    items
      .map(
        (x) =>
          '<li><a href="' + esc(x[1]) + '" target="_blank" rel="noopener noreferrer"><b>' + esc(x[0]) +
          ' <span aria-hidden="true">↗</span></b><small>' + esc(host(x[1])) + "</small></a></li>",
      )
      .join("") + '<li><a href="#state" data-page="state"><b>Tous les sites</b><small>Liste complète et recherche</small></a></li>';
}

/* ---------- Menu (hamburger on phones, unfolded on computers) ---------- */
function closeMenu(): void {
  document.body.classList.remove("menu-open");
  $("menu-btn").setAttribute("aria-expanded", "false");
}

/* ---------- Canton map (sheet sliding up from the bottom) ---------- */
/** Tile grid of the 26 cantons: [column, row]. */
const GRID: Record<string, [number, number]> = {
  SH: [4, 0], TG: [5, 0], BS: [1, 1], BL: [2, 1], AG: [3, 1], ZH: [4, 1], SG: [5, 1], AR: [6, 1], AI: [7, 1],
  JU: [0, 2], SO: [1, 2], LU: [2, 2], ZG: [3, 2], SZ: [4, 2], GL: [5, 2], NE: [0, 3], BE: [1, 3], OW: [2, 3], NW: [3, 3], UR: [4, 3], GR: [5, 3],
  VD: [0, 4], FR: [1, 4], GE: [0, 5], VS: [2, 5], TI: [4, 5],
};
let returnFocus: HTMLElement | null = null;
function renderTiles(): void {
  let h = "";
  Object.keys(GRID).forEach((k) => {
    const ok = isCovered(k);
    const g = GRID[k] as [number, number];
    const on = level === "canton" && canton === k;
    const vote = cantonBallot(k)?.items.length;
    h += '<button type="button" class="tile' + (ok ? " is-available" : "") + (on ? " is-on" : "") + '" style="grid-column:' + (g[0] + 1) + ";grid-row:" + (g[1] + 1) + '" data-c="' + k + '"' + (ok ? "" : " disabled") +
      ' aria-label="' + esc(cantonName(k)) + (ok ? "" : ", bientôt") + (vote ? ", objet cantonal en votation" : "") + '">' + k + (vote ? '<i aria-hidden="true"></i>' : "") + "</button>";
  });
  $("tiles").innerHTML = h;
  $("scope-ch").className = "scope-all" + (level === "federal" ? " is-on" : "");
}
function openPicker(): void {
  returnFocus = $("scope-btn");
  renderTiles();
  $("picker").hidden = false;
  document.body.style.overflow = "hidden";
  $("scope-ch").focus();
}
function closePicker(): void {
  $("picker").hidden = true;
  document.body.style.overflow = "";
  if (returnFocus) returnFocus.focus();
}

/* ---------- Hemicycle ---------- */
const CX = 180, CY = 178, R = 172, r = 88, GAP = 1.6;
function point(radius: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [CX + radius * Math.cos(a), CY - radius * Math.sin(a)];
}
function svgEl(name: string, attrs: Record<string, string | number>, parent?: Element): SVGElement {
  const e = document.createElementNS(SVG_NS, name);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(e);
  return e;
}
function partyList() {
  return current().parties;
}
function renderTitle(): void {
  $("scope-title").textContent =
    level === "federal"
      ? "Partis représentés au niveau fédéral. Touchez un parti, ou glissez vers la gauche et la droite."
      : "Principaux partis du canton " + ofCanton(canton) + ". Touchez un parti, ou glissez vers la gauche et la droite.";
  $("scope-note").textContent = level === "federal" ? "" : (cantons[canton]?.note || "");
}
function renderHemicycle(): void {
  const list = partyList();
  const n = list.length;
  const w = 180 / n;
  const box = $("hemicycle");
  box.innerHTML = "";
  const svg = svgEl("svg", { viewBox: "0 0 360 200", role: "group", "aria-label": "Hémicycle des partis, de gauche à droite" }, box);
  list.forEach((p, i) => {
    const a0 = 180 - i * w - GAP / 2, a1 = 180 - (i + 1) * w + GAP / 2;
    const o0 = point(R, a0), o1 = point(R, a1), i1 = point(r, a1), i0 = point(r, a0);
    const d = "M" + String(o0) + " A" + R + " " + R + " 0 0 1 " + String(o1) + " L" + String(i1) + " A" + r + " " + r + " 0 0 0 " + String(i0) + " Z";
    const g = svgEl("g", {
      class: "sect" + (i === index ? " is-active" : ""),
      role: "button",
      tabindex: "0",
      "aria-pressed": String(i === index),
      "aria-label": p.name + ", " + p.position + ", position " + (i + 1) + " sur " + n,
    }, svg);
    svgEl("path", { d }, g);
    const mid = 180 - (i + 0.5) * w;
    const pos = point((R + r) / 2, mid);
    const rot = mid > 90 ? 180 - mid : -mid;
    const t = svgEl("text", { transform: "translate(" + pos[0].toFixed(1) + " " + pos[1].toFixed(1) + ") rotate(" + rot.toFixed(1) + ")", "text-anchor": "middle", "dominant-baseline": "central" }, g);
    t.textContent = p.short;
    const choose = () => {
      index = i;
      renderHemicycle();
      renderDetail();
    };
    g.addEventListener("click", choose);
    g.addEventListener("keydown", (e) => {
      const key = (e as KeyboardEvent).key;
      if (key === "Enter" || key === " ") {
        e.preventDefault();
        choose();
      }
    });
  });
  const c1 = svgEl("text", { x: CX, y: CY - 30, "text-anchor": "middle", class: "center-name" }, svg);
  c1.textContent = list[index]?.short ?? "";
  const c2 = svgEl("text", { x: CX, y: CY - 8, "text-anchor": "middle", class: "center-rank" }, svg);
  c2.textContent = index + 1 + " sur " + n;
  const g1 = svgEl("text", { x: 4, y: 196, class: "axis-label" }, svg);
  g1.textContent = "← Gauche";
  const g2 = svgEl("text", { x: 356, y: 196, "text-anchor": "end", class: "axis-label" }, svg);
  g2.textContent = "Droite →";
}

/**
 * Federal Council members, National Council and Council of States seats of a CH party, current
 * composition. Members elected under a regional label are named: "27 sièges, dont 1 PLD Bâle-Ville".
 */
function federalStanding(abbr: string): [string, string][] {
  const seatCount = (n: number) => (n ? n + (n > 1 ? " sièges" : " siège") : "Aucun siège");
  const main = mainLabel(parliament, abbr);
  const chamber = (council: "CN" | "CE") => {
    const members = partyMembers(parliament, membersOf(parliament, council), abbr);
    const regional = new Map<string, number>();
    for (const m of members) {
      if (partyLabel(m) === main) continue;
      const key = partyLabel(m) + (m.canton ? " " + cantonName(m.canton.abbreviation) : "");
      regional.set(key, (regional.get(key) ?? 0) + 1);
    }
    return seatCount(members.length) + (regional.size ? ", dont " + [...regional].map(([k, n]) => n + " " + k).join(", ") : "");
  };
  const councillors = partyMembers(parliament, parliament.persons.filter(isFederalCouncillor), abbr);
  return [
    ["Conseil fédéral", councillors.length ? councillors.map((m) => m.firstName + " " + m.lastName).join(", ") : "Aucun membre"],
    ["Conseil national", chamber("CN")],
    ["Conseil des États", chamber("CE")],
  ];
}

/** The terms of use of the Parliament's data require the source and the download date next to the figures. */
function parliamentSource(): string {
  return '<a href="' + esc(stateSiteUrl(STATE_SITE_IDS.parliament)) + '" target="_blank" rel="noopener noreferrer">' +
    esc(parliament.attribution.replace(/^Source : /, "")) + "</a>, données du " + swissDate(parliament.retrieved_on);
}

/** Adds the lines of a party of a canton to `facts`; returns the sources that name them (none: empty list). */
function cantonalLines(p: { id: string; abbr: string; territory: string }, facts: [string, string][]): string[] {
  const code = p.territory;
  const government = cantonalGovernments.find((g) => g.canton === code);
  const row = cantonRow(cantonalParliaments, cantons[code]?.name ?? "");
  const standing = cantonalStanding(p, code, government, cantonalParliaments, row, parliament);
  facts.push(...standing.rows);
  const parts: string[] = [];
  if (standing.government && government) {
    const checked = government.members.map((m) => m.checked_on).sort()[0];
    parts.push(esc(government.body) + " : " + governmentSources(government).map((u) => '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(siteName(u)) + "</a>").join(", ") +
      ", vérifié le " + swissDate(checked));
  }
  if (standing.grandCouncil) parts.push("Grand Conseil : " + esc(cantonalParliaments.attribution.replace(/^Source : /, "")) + ", données du " + swissDate(cantonalParliaments.retrieved_on));
  if (standing.federal) parts.push("Élus fédéraux : " + parliamentSource());
  return parts;
}

function renderDetail(): void {
  const list = partyList();
  const p = list[index];
  if (!p) return;
  const facts: [string, string][] = [["Position", p.position]];
  const sources: string[] = [];
  // A fact is shown only once it has a source (PRD-0001 goal 2).
  const presidency = presidencyFact(p);
  if (presidency) {
    facts.push(presidency.row);
    sources.push('Présidence : <a href="' + esc(presidency.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(presidency.source.site) + "</a>, vérifié le " + swissDate(presidency.source.checked_on));
  }
  const founded = p.facts?.founded?.source ? p.facts.founded.value : null;
  if (founded !== null) facts.push(["Fondé en", String(founded)]);
  // Who sits for the party today (US-15): a party of the Confederation from the Parliament's data;
  // a party of a canton also from its government (kept by hand) and its Grand Conseil (OFS).
  if (p.territory === "CH") {
    const federalRows = federalStanding(p.abbr);
    facts.push(...federalRows);
    if (federalRows.length) sources.push("Élus : " + parliamentSource());
  } else {
    sources.push(...cantonalLines(p, facts));
  }
  const source = sources.length ? '<p class="fact-sheet__source">' + sources.join(". ") + ".</p>" : "";
  const dl = facts.map((f) => '<div class="fact-sheet__row"><dt>' + esc(f[0]) + "</dt><dd>" + esc(f[1]) + "</dd></div>").join("");
  let link: string;
  if (p.url) {
    link = '<a class="fact-sheet__link" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer"><span>Site du parti<small>' + esc(host(p.url)) + '</small></span><span aria-hidden="true">↗</span></a>';
  } else {
    link = '<a class="fact-sheet__link fact-sheet__link--search" href="https://duckduckgo.com/?q=' + encodeURIComponent(p.name) + '" target="_blank" rel="noopener noreferrer"><span>Chercher le site du parti<small>recherche sur le web</small></span><span aria-hidden="true">↗</span></a>';
  }
  $("detail").innerHTML = '<h3 class="fact-sheet__name">' + esc(p.name) + "</h3>" + '<p class="fact-sheet__desc">' + esc(p.description) + "</p>" + '<dl class="fact-sheet__facts">' + dl + "</dl>" + source + link;
  ($("prev") as HTMLButtonElement).disabled = index === 0;
  ($("next") as HTMLButtonElement).disabled = index === list.length - 1;
}
function move(delta: number): void {
  const ni = Math.max(0, Math.min(partyList().length - 1, index + delta));
  if (ni === index) return;
  index = ni;
  renderHemicycle();
  renderDetail();
}

function card(name: string, note: string, url: string, badge: string): string {
  return '<li><a class="link-card" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
    '<span class="link-card__head"><span class="link-card__name">' + esc(name) + '</span><span class="badge badge--gray">' + esc(badge) + "</span></span>" +
    '<span class="link-card__note">' + esc(note) + '</span><span class="host">' + esc(host(url)) + "</span></a></li>";
}

/* ---------- Decision aids: understand, compare, decide ---------- */
function renderTools(): void {
  const cant = cantonBallot(canton) || null;
  const groups: [string, string, readonly string[]][] = [
    ["Comprendre", "Saisir l'objet avant de voter.", TOOLS_PAGE_IDS.understand],
    ["Comparer", "Se situer face aux partis et aux élus.", TOOLS_PAGE_IDS.compare],
  ];
  let h = '<h2 id="t-tools">Aides à décider</h2><p class="panel__desc">Trois étapes pour se faire une opinion.</p>';
  groups.forEach((g, i) => {
    const items = tools.filter((o) => g[2].indexOf(o.id) > -1);
    h += '<section class="panel"><h3 class="step-title"><span>' + (i + 1) + "</span> " + g[0] + '</h3><p class="panel__desc">' + g[1] + '</p><ul class="link-cards">' +
      items.map((o) => card(o.name, o.description, o.url, "CH")).join("") + "</ul></section>";
  });
  const cantUrl = level === "canton" && cant ? cant.url : stateSiteUrl(STATE_SITE_IDS.portal);
  const cantName = level === "canton" ? "Votations du canton " + cantonName(canton) : "ch.ch, droits politiques";
  h += '<section class="panel"><h3 class="step-title"><span>3</span> Décider</h3><p class="panel__desc">Voter est simple : par correspondance ou dans sa commune.</p><ul class="link-cards">' +
    card(cantName, "Matériel de vote, dates et marche à suivre.", cantUrl, levelCode()) +
    '<li><a class="link-card" href="#ballot"><span class="link-card__head"><span class="link-card__name">Prochaine votation</span><span class="badge badge--gray">Ici</span></span><span class="link-card__note">Les objets, les mots d\'ordre et le parcours complet.</span></a></li></ul></section>';
  $("tools").innerHTML = h;
}

function renderStateSites(): void {
  const nq = normalize(query);
  let html = "";
  $("state-desc").textContent = "Sources officielles : " + (level === "federal" ? "Confédération." : "canton " + ofCanton(canton) + ".");
  const sites = current().stateSites.filter((l) => !nq || normalize(l.name + " " + l.description + " " + l.url).indexOf(nq) > -1);
  if (sites.length) html = '<ul class="link-cards">' + sites.map((l) => card(l.name, l.description, l.url, levelCode())).join("") + "</ul>";
  $("state-sites").innerHTML = html || '<p class="empty-state">Aucun résultat. Essayez un autre mot.</p>';
}

/** Wires the events, restores the territory (address, then last visit) and renders. */
export function start(): void {
  $("menu-btn").addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    $("menu-btn").setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
  window.addEventListener("hashchange", () => {
    const d = parseHash(location.hash);
    if (d.page && d.page !== page) page = d.page;
    if (d.level && (d.level !== level || (d.canton && d.canton !== canton))) {
      level = d.level;
      if (d.canton) canton = d.canton;
      // Keep the chosen party when the new list is long enough (the old script threw here otherwise).
      index = Math.max(0, Math.min(index, current().parties.length - 1));
      remember();
    }
    updateBar();
    renderAll();
  });
  $("menu").addEventListener("click", (e) => {
    const t = e.target as Element | null;
    if (t && t.closest && t.closest("a")) {
      closeMenu();
      window.scrollTo(0, 0);
    }
  });

  $("scope-btn").addEventListener("click", openPicker);
  $("picker-backdrop").addEventListener("click", closePicker);
  $("picker-close").addEventListener("click", closePicker);
  $("scope-ch").addEventListener("click", () => {
    closePicker();
    apply("federal", null);
  });
  $("tiles").addEventListener("click", (e) => {
    const t = e.target as Element | null;
    const b = t && t.closest ? (t.closest(".tile") as HTMLButtonElement | null) : null;
    if (!b || b.disabled) return;
    closePicker();
    apply("canton", b.getAttribute("data-c"));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("picker").hidden) closePicker();
  });

  $("prev").onclick = () => move(-1);
  $("next").onclick = () => move(1);
  const zone = $("spectrum-zone");
  let x0: number | null = null;
  zone.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      move(-1);
      e.preventDefault();
    }
    if (e.key === "ArrowRight") {
      move(1);
      e.preventDefault();
    }
  });
  zone.addEventListener("touchstart", (e) => {
    x0 = (e.touches[0] as Touch).clientX;
  }, { passive: true });
  zone.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = (e.changedTouches[0] as Touch).clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
  }, { passive: true });
  $("q").addEventListener("input", (e) => {
    query = (e.target as HTMLInputElement).value;
    renderStateSites();
  });

  try {
    // Move a territory saved under the old keys, so a returning visitor keeps it.
    for (const [key, legacy] of LEGACY_KEYS) {
      const old = localStorage.getItem(legacy);
      if (old !== null && localStorage.getItem(key) === null) localStorage.setItem(key, old);
      localStorage.removeItem(legacy);
    }
    const last = localStorage.getItem(CANTON_KEY);
    if (last && isCovered(last)) canton = last;
  } catch {}
  const d0 = parseHash(location.hash);
  let s0: Route | null = null;
  try {
    s0 = parseHash("#ballot/" + (localStorage.getItem(SCOPE_KEY) || ""));
  } catch {}
  if (d0.level) {
    level = d0.level;
    if (d0.canton) canton = d0.canton;
  } else if (s0 && s0.level) {
    level = s0.level;
    if (s0.canton) canton = s0.canton;
  }
  if (d0.page) page = d0.page;
  updateBar();
  updateAddress();
  renderAll();
}
