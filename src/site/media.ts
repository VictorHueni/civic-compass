/*
 * The media page (PRD-0001 US-20): every medium of French-speaking Switzerland grouped by genre, each opening its
 * card; the card of a company or holder (who holds it, what it holds); "Signaler une erreur ou demander un retrait"
 * under the card of a medium, a person or a family (US-24, brought forward so that no owner is named without a way
 * to report it). What a card says comes from media-model.ts; this module only writes it.
 */
import { $, escapeHtml as esc, host, swissDate } from "./dom.ts";
import { cardLines, formatShare, type CardLine, type SourceRef } from "./media-model.ts";
import { mediaOwnership as m } from "./referential.ts";
import type { Holding, MediaGenre } from "../types.ts";

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

function render(): void {
  $("media-body").innerHTML =
    '<p class="panel__desc">Qui édite chaque titre de Suisse romande et qui possède l\'éditeur. Une ligne absente veut dire qu\'aucune source ne la donne.</p>' +
    '<div id="media-card" class="detail media-card" aria-live="polite"><p class="panel__desc">Touchez un média pour voir sa fiche.</p></div>' +
    GENRES.map(([genre, label]) => {
      const ids = m.media.filter((x) => x.genre === genre).map((x) => x.id);
      return '<section class="panel"><h3>' + esc(label) + " <small>(" + ids.length + ')</small></h3><ul class="media-list">' + ids.map(listEntry).join("") + "</ul></section>";
    }).join("") +
    '<p class="scope-note">Sources : <a href="https://www.medienmonitor-schweiz.ch/beteiligungen/" target="_blank" rel="noopener noreferrer">Medienmonitor Schweiz</a> (Publicom pour l\'OFCOM), qui ne garantit ni l\'exhaustivité ni l\'exactitude de ses données ; ' +
    'registre du commerce (<a href="https://register.ld.admin.ch/" target="_blank" rel="noopener noreferrer">données liées de Zefix</a> et FOSC) et page de chaque média pour les éditeurs ; ' +
    '<a href="' + esc(m.fog.edition.source) + '" target="_blank" rel="noopener noreferrer">fög, Université de Zurich</a> pour la tonalité des votations.</p>';
}

export function start(): void {
  render();
  $("media-body").addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-go]");
    const id = target?.getAttribute("data-go");
    if (id) showCard(id);
  });
}
