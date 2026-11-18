/*
 * The media page (PRD-0001 US-20, US-21): the two drawings, Réseau and Soleil, with their switch and the search
 * by name; every medium of French-speaking Switzerland grouped by genre, each opening its card; the card of a
 * company or holder (who holds it, what it holds); the people and families that link several media; "Signaler une
 * erreur ou demander un retrait" under the card of a medium, a person or a family (US-24, brought forward so that
 * no owner is named without a way to report it). What the page says comes from media-model.ts; this module only
 * writes it. The drawings come from the second script, media-graph.ts, added on first opening of the page.
 */
import { $, escapeHtml as esc, host, swissDate } from "./dom.ts";
import { bridges, cardLines, formatShare, rings, search, type CardLine, type SourceRef, type TopKind } from "./media-model.ts";
import { onRender } from "./app.ts";
import { mediaOwnership as m } from "./referential.ts";
import type { Holding, MediaGenre } from "../types.ts";
import type { GraphEdge, GraphNode, GraphView, MediaGraph } from "./media-graph.ts";

/** The error and removal address of the owner (PRD-0001 §8): an e-mail keeps a removal request private. */
const REPORT_ADDRESS = "huni.victor@gmail.com";

const GENRES: [MediaGenre, string][] = [
  ["press", "Presse"],
  ["radio", "Radio"],
  ["television", "Télévision"],
  ["online", "En ligne"],
];
const KINDS: Record<string, string> = {
  person: "Personne",
  family: "Famille",
  public: "Collectivité publique",
  association: "Association, fondation",
};

/** The kinds of the centre ring of Soleil, as its legend names them. */
const TOP_KINDS: Record<TopKind, string> = {
  people: "Personne ou famille",
  public: "Collectivité publique",
  association: "Association, fondation",
  company: "Société sans propriétaire publié",
};

type View = "network" | "sun";
const VIEWS: Record<View, { button: string; label: string; hint: string }> = {
  network: {
    button: "Réseau",
    label: "Réseau des propriétaires des médias de Suisse romande",
    hint: "Tous les détenteurs, minoritaires compris. Glissez et pincez pour explorer, touchez un nœud pour sa fiche.",
  },
  sun: {
    button: "Soleil",
    label: "Soleil : le propriétaire principal de chaque média de Suisse romande",
    hint: "Au bord le média, au milieu son propriétaire principal, au centre le type de propriétaire. Touchez une part pour zoomer, le centre pour revenir.",
  },
};

function nameOf(id: string): string {
  return (m.companies.find((c) => c.id === id) ?? m.holders.find((h) => h.id === id) ?? m.media.find((x) => x.id === id))?.name ?? "actionnaire privé";
}

/** "Medienmonitor Schweiz", "Registre du commerce"...: the name of a source page, else its host. */
function sourceName(url: string): string {
  const h = host(url);
  if (h.includes("medienmonitor")) return "Medienmonitor Schweiz";
  if (h.includes("ld.admin.ch")) return "Registre du commerce";
  if (h.includes("foeg")) return "fög";
  if (h.includes("tx.group")) return "Rapport annuel de TX Group";
  return h;
}

function sourcesLine(sources: SourceRef[]): string {
  const items = sources.map(
    (s) => '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(sourceName(s.url)) + "</a>, vérifié le " + esc(swissDate(s.checked_on)),
  );
  return '<p class="fact-sheet__source">Source' + (items.length > 1 ? "s" : "") + " : " + items.join(" ; ") + "</p>";
}

function lineHtml(l: CardLine): string {
  return (
    '<div class="media-line"><p class="media-line__label">' + esc(l.label) + '</p><p class="media-line__text">' + esc(l.text) + "</p>" +
    l.notes.map((n) => '<p class="media-line__note">' + esc(n) + "</p>").join("") +
    sourcesLine(l.sources) + "</div>"
  );
}

function reportHtml(name: string): string {
  const mailto = "mailto:" + REPORT_ADDRESS + "?subject=" + encodeURIComponent("Médias : " + name);
  return (
    '<details class="media-report"><summary>Signaler une erreur ou demander un retrait</summary>' +
    "<p>Écrivez à <span class=\"media-report__address\">" + esc(REPORT_ADDRESS) + "</span> en indiquant le média ou la personne, l'erreur et si possible votre source.</p>" +
    "<p>Une personne nommée ici peut demander que son nom soit retiré : la demande reste privée et elle est traitée dans les 30 jours.</p>" +
    '<p><a class="btn btn--outline btn--sm" href="' + esc(mailto) + '"><span class="btn__text">Écrire un e-mail</span></a></p></details>'
  );
}

function goButton(id: string, label: string): string {
  return '<button type="button" class="media-go" data-go="' + esc(id) + '">' + esc(label) + "</button>";
}

function mediumCard(id: string): string {
  const x = m.media.find((y) => y.id === id);
  if (!x) return "";
  const genre = GENRES.find((g) => g[0] === x.genre)?.[1] ?? "";
  return (
    '<p class="media-card__kind">Média · ' + esc(genre) + '</p><h3 class="fact-sheet__name">' + esc(x.name) + "</h3>" +
    (x.note ? '<p class="media-line__note">' + esc(x.note) + "</p>" : "") +
    cardLines(m, id).map(lineHtml).join("") +
    '<p class="media-card__more">' + goButton(x.publisher, "Voir la fiche de l'éditeur") + "</p>" +
    reportHtml(x.name)
  );
}

function holdingRow(h: Holding, other: string, withNote: boolean): string {
  const share = h.share === null ? "part non publiée" : formatShare(h.share);
  const disputed = h.dispute === undefined ? "" : ", sources en désaccord";
  return (
    "<li>" + goButton(other, nameOf(other)) + '<span class="media-share">' + esc(share + disputed) + "</span>" +
    (withNote && h.note ? '<p class="media-line__note">' + esc(h.note) + "</p>" : "") +
    sourcesLine([{ url: h.source, checked_on: h.checked_on }]) + "</li>"
  );
}

function ownerCard(id: string): string {
  const company = m.companies.find((c) => c.id === id);
  const holder = m.holders.find((h) => h.id === id);
  const e = company ?? holder;
  if (!e) return "";
  const kind = company ? "Société" : KINDS[holder?.kind ?? ""] ?? "";
  const facts = [e.legal_form, e.seat, e.uid ? "IDE " + e.uid : null].filter((f) => f);
  const heldBy = m.holdings.filter((h) => h.held === id).sort((a, b) => (b.share ?? -1) - (a.share ?? -1));
  const holds = m.holdings.filter((h) => h.holder === id);
  const publishes = m.media.filter((x) => x.publisher === id);
  return (
    '<p class="media-card__kind">' + esc(kind) + '</p><h3 class="fact-sheet__name">' + esc(e.name ?? "actionnaire privé") + "</h3>" +
    (facts.length ? '<p class="fact-sheet__desc">' + esc(facts.join(", ")) + "</p>" : "") +
    (e.note ? '<p class="media-line__note">' + esc(e.note) + "</p>" : "") +
    sourcesLine([{ url: e.source, checked_on: e.checked_on }]) +
    (heldBy.length ? '<h4 class="media-card__h">Détenu par</h4><ul class="media-holdings">' + heldBy.map((h) => holdingRow(h, h.holder, true)).join("") + "</ul>" : "") +
    (holds.length ? '<h4 class="media-card__h">Détient</h4><ul class="media-holdings">' + holds.map((h) => holdingRow(h, h.held, h.dispute !== undefined)).join("") + "</ul>" : "") +
    (publishes.length ? '<h4 class="media-card__h">Édite</h4><ul class="media-holdings">' + publishes.map((x) => "<li>" + goButton(x.id, x.name) + "</li>").join("") + "</ul>" : "") +
    (holder && (holder.kind === "person" || holder.kind === "family") ? reportHtml(e.name ?? "actionnaire privé") : "")
  );
}

/** Opens the card of a medium, a company or a holder, and brings it into view. */
export function showCard(id: string): void {
  const card = $("media-card");
  card.innerHTML = m.media.some((x) => x.id === id) ? mediumCard(id) : ownerCard(id);
  card.scrollIntoView({ block: "start" });
}

function listEntry(id: string): string {
  const x = m.media.find((y) => y.id === id);
  if (!x) return "";
  const lines = cardLines(m, id)
    .map((l) => '<span class="media-entry__line"><b>' + esc(l.label) + "</b> " + esc(l.text) + "</span>")
    .join("");
  return '<li><button type="button" class="media-entry" data-go="' + esc(id) + '"><span class="media-entry__name">' + esc(x.name) + "</span>" + lines + "</button></li>";
}

function names(): { id: string; name: string }[] {
  return [...m.media, ...m.companies, ...m.holders].map((e) => ({ id: e.id, name: e.name ?? "actionnaire privé" }));
}

function legendHtml(view: View): string {
  if (view === "network") {
    const items: [string, string][] = [
      ["media", "Média"],
      ["company", "Société"],
      ["person", "Personne ou famille"],
      ["public", "Collectivité publique"],
      ["association", "Association, fondation"],
      ["disputed", "Sources en désaccord"],
    ];
    return items.map(([k, label]) => '<span><i class="media-key media-key--' + k + '"></i>' + esc(label) + "</span>").join("");
  }
  return (
    rings(m).map((r) => '<span><i class="media-dot media-dot--' + r.kind + '"></i>' + esc(TOP_KINDS[r.kind]) + "</span>").join("") +
    "<span>Couleur : qui est au sommet de la chaîne</span>"
  );
}

function bridgesHtml(): string {
  const list = bridges(m);
  if (!list.length) return '<p class="panel__desc">Aucune personne ni famille ne relie plusieurs médias.</p>';
  return '<div class="media-chips">' + list.map((b) => '<button type="button" class="media-chip" data-go="' + esc(b.id) + '">' + esc(nameOf(b.id)) + " · " + b.media.length + "</button>").join("") + "</div>";
}

function render(): void {
  const options = names()
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
    .map((e) => '<option value="' + esc(e.name) + '"></option>')
    .join("");
  $("media-body").innerHTML =
    '<p class="panel__desc">Journaux, radios, télévisions et sites d\'information de Suisse romande : qui les édite, qui les possède.</p>' +
    '<div class="media-switch" role="group" aria-label="Représentation">' +
    (Object.keys(VIEWS) as View[]).map((v) => '<button type="button" data-view="' + v + '" aria-pressed="' + (v === view) + '">' + esc(VIEWS[v].button) + "</button>").join("") +
    "</div>" +
    '<p class="media-hint" id="media-hint"></p>' +
    '<form class="media-search" id="media-search" role="search"><label for="media-q" class="sr-only">Chercher un média, une société ou une personne</label>' +
    '<input id="media-q" type="search" list="media-names" placeholder="Chercher un média, une société, une personne" autocomplete="off">' +
    '<datalist id="media-names">' + options + "</datalist>" +
    '<button type="submit" class="btn btn--outline btn--sm"><span class="btn__text">Voir</span></button></form>' +
    '<figure class="media-graph"><div id="media-pane" class="media-pane" role="img"></div><figcaption class="media-legend" id="media-legend"></figcaption></figure>' +
    '<div id="media-card" class="detail media-card" aria-live="polite"><p class="panel__desc">Touchez un média ou un propriétaire pour voir sa fiche.</p></div>' +
    '<section class="panel"><h3>Ils relient plusieurs médias</h3><p class="panel__desc">Personnes et familles présentes dans la chaîne de propriété d\'au moins deux médias.</p>' + bridgesHtml() + "</section>" +
    '<section class="panel"><h3>Tous les médias</h3><p class="panel__desc">Qui édite chaque titre et qui possède l\'éditeur. Une ligne absente veut dire qu\'aucune source ne la donne.</p>' +
    GENRES.map(([genre, label]) => {
      const ids = m.media.filter((x) => x.genre === genre).map((x) => x.id);
      return '<h4 class="media-genre">' + esc(label) + " <small>(" + ids.length + ')</small></h4><ul class="media-list">' + ids.map(listEntry).join("") + "</ul>";
    }).join("") +
    "</section>" +
    '<p class="scope-note">Sources : <a href="https://www.medienmonitor-schweiz.ch/beteiligungen/" target="_blank" rel="noopener noreferrer">Medienmonitor Schweiz</a> (Publicom pour l\'OFCOM), qui ne garantit ni l\'exhaustivité ni l\'exactitude de ses données ; ' +
    'registre du commerce (<a href="https://register.ld.admin.ch/" target="_blank" rel="noopener noreferrer">données liées de Zefix</a> et FOSC) et page de chaque média pour les éditeurs ; ' +
    '<a href="' + esc(m.fog.edition.source) + '" target="_blank" rel="noopener noreferrer">fög, Université de Zurich</a> pour la tonalité des votations.</p>';
}

let graphScript: Promise<MediaGraph> | null = null;

/**
 * Adds js/media-graph.js (Cytoscape and the drawings) to the page once, and resolves with the functions it
 * registers. A classic script added by the page, so that it also loads from disk (file://). A failed load can be
 * retried.
 */
export function loadGraph(): Promise<MediaGraph> {
  graphScript ??= new Promise<MediaGraph>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "js/media-graph.js";
    script.onload = () => (window.civicMediaGraph ? resolve(window.civicMediaGraph) : reject(new Error("js/media-graph.js n'a rien enregistré")));
    script.onerror = () => {
      graphScript = null;
      script.remove();
      reject(new Error("js/media-graph.js n'a pas pu être chargé"));
    };
    document.head.appendChild(script);
  });
  return graphScript;
}

let view: View = "network";
let drawing: GraphView | null = null;
/** The view drawn in the pane, or null before the first drawing and after a failed load. */
let drawn: View | null = null;

function graphNodes(): GraphNode[] {
  return [
    ...m.media.map((x) => ({ id: x.id, label: x.name, kind: "media" })),
    ...m.companies.map((c) => ({ id: c.id, label: c.name, kind: "company" })),
    ...m.holders.map((h) => ({ id: h.id, label: h.name ?? "actionnaire privé", kind: h.kind as string })),
  ];
}

function graphEdges(): GraphEdge[] {
  return [
    ...m.holdings.map((h) => ({ holder: h.holder, held: h.held, label: h.share === null ? "" : formatShare(h.share), disputed: h.dispute !== undefined })),
    ...m.media.map((x) => ({ holder: x.publisher, held: x.id, label: "", disputed: false })),
  ];
}

/** Opens a card from the drawing: the drawing already shows what was tapped. */
function tapped(id: string): void {
  showCard(id);
}

/** Opens a card from a list, a chip or the search, and brings the same node or sector forward in the drawing. */
function open(id: string): void {
  drawing?.focus(id);
  showCard(id);
}

/** Draws the chosen view, loading the second script first; only on a shown page, so that the drawing has a size. */
function draw(): void {
  if ($("page-media").hidden || drawn === view) return;
  const pane = $("media-pane");
  const wanted = view;
  pane.setAttribute("aria-label", VIEWS[wanted].label);
  $("media-hint").textContent = VIEWS[wanted].hint;
  $("media-legend").innerHTML = legendHtml(wanted);
  drawing?.destroy();
  drawing = null;
  drawn = wanted;
  pane.innerHTML = '<p class="media-pane__note">Chargement du dessin…</p>';
  loadGraph().then(
    (g) => {
      if (view !== wanted) return;
      pane.innerHTML = "";
      const byId = Object.fromEntries(names().map((e) => [e.id, e.name]));
      drawing = wanted === "network" ? g.network(pane, graphNodes(), graphEdges(), tapped) : g.sun(pane, rings(m), byId, tapped);
    },
    () => {
      drawn = null;
      pane.innerHTML = '<p class="media-pane__note">Le dessin n\'a pas pu être chargé. Les listes ci-dessous donnent les mêmes informations.</p>';
    },
  );
}

export function start(): void {
  render();
  $("media-body").addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const id = target.closest<HTMLElement>("[data-go]")?.getAttribute("data-go");
    if (id) open(id);
    const next = target.closest<HTMLElement>("[data-view]")?.getAttribute("data-view") as View | null | undefined;
    if (next && next !== view) {
      view = next;
      document.querySelectorAll("#media-body [data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.getAttribute("data-view") === view)));
      draw();
    }
  });
  $("media-body").addEventListener("submit", (e) => {
    e.preventDefault();
    const query = ($("media-q") as HTMLInputElement).value;
    const id = search(m, query);
    if (id) open(id);
    else if (query.trim()) {
      $("media-card").innerHTML =
        '<p class="media-card__kind">Recherche</p><h3 class="fact-sheet__name">Aucun résultat</h3>' +
        "<p class=\"panel__desc\">Rien ne correspond à « " + esc(query.trim()) + " ». Essayez le nom d'un journal, d'une radio, d'une société ou d'une personne.</p>";
    }
  });
  onRender(draw);
  draw();
}
