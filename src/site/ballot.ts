/*
 * Ballot page: list of the items, then one page per item with three steps
 * (Comprendre, Comparer, Décider).
 */
import { $, escapeHtml as esc, host } from "./dom.ts";
import { cantonName, onRender, scope } from "./app.ts";
import { STATE_SITE_IDS, TOOL_IDS } from "./links.ts";
import { ballot, federal, stateSiteUrl, toolUrl } from "./referential.ts";
import type { CantonBallot, Recommendation } from "../types.ts";

let item = -1; // -1: the list of items
let step = 0;
let partyIndex = -1;
const STEPS = ["Comprendre", "Comparer", "Décider"];
const LABEL: Record<Recommendation, string> = { yes: "Oui", no: "Non" };

function days(): number {
  const d = new Date(ballot.date + "T00:00:00");
  let n = new Date();
  n = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  return Math.round((d.getTime() - n.getTime()) / 86400000);
}
function cantonBallot(): CantonBallot {
  return ballot.cantons[scope().canton] || { items: [], url: stateSiteUrl(STATE_SITE_IDS.portal) };
}
function link(url: string, title: string, note?: string): string {
  return '<a class="fact-sheet__link" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"><span>' + esc(title) + "<small>" + esc(note || host(url)) + '</small></span><span aria-hidden="true">↗</span></a>';
}

/* ---------- 1. Next ballot + 2. item page + 3. steps ---------- */
const DAY_LABEL = "Dimanche 29 novembre 2026";
function cantonalHtml(): string {
  const cant = cantonBallot();
  const sc = scope();
  if (sc.level !== "canton") return "";
  return '<p class="cantonal-note">' + (cant.items.length
    ? "<b>" + esc(cantonName(sc.canton)) + " vote aussi sur :</b> " + cant.items.map(esc).join(" ; ") + ' <a href="' + esc(cant.url) + '" target="_blank" rel="noopener noreferrer">Détails</a>'
    : "<b>" + esc(cantonName(sc.canton)) + ' :</b> aucun objet cantonal retrouvé. <a href="' + esc(cant.url) + '" target="_blank" rel="noopener noreferrer">Vérifier sur le site du canton</a>') + "</p>";
}
function renderBallot(): void {
  if (item < 0) return renderList();
  const o = ballot.items[item];
  if (!o) return;
  const n = ballot.items.length;
  const tabs = STEPS.map((e, i) => '<button type="button" role="tab" class="step' + (i === step ? " is-on" : "") + '" data-step="' + i + '" aria-selected="' + (i === step) + '">' + e + "</button>").join("");
  const previous = ballot.items[item - 1];
  const next = ballot.items[item + 1];
  $("ballot").innerHTML =
    '<button type="button" class="back-link" data-item="-1">← Les ' + n + " objets</button>" +
    '<p class="kicker">Objet ' + (item + 1) + " sur " + n + "</p>" +
    '<h1 id="t-ballot" class="h-page">' + esc(o.title) + '</h1><p class="lede">' + esc(o.question) + "</p>" +
    '<div role="tablist" class="steps" aria-label="Étapes">' + tabs + '</div><div class="step__body" id="step-body"></div>' +
    '<nav class="item-nav" aria-label="Autres objets">' +
    (previous ? '<button type="button" data-item="' + (item - 1) + '">← ' + esc(previous.short) + "</button>" : "<span></span>") +
    (next ? '<button type="button" data-item="' + (item + 1) + '">' + esc(next.short) + " →</button>" : "<span></span>") + "</nav>";
  renderStep();
}
function renderList(): void {
  const j = days();
  const n = ballot.items.length;
  const countdown = j > 1 ? "dans " + j + " jours" : j === 1 ? "demain" : j === 0 ? "aujourd'hui" : "scrutin passé";
  const lis = ballot.items
    .map((x, i) => '<li><button type="button" class="ballot-item" data-item="' + i + '"><span class="ballot-item__number" aria-hidden="true">' + (i + 1) + '</span><span class="ballot-item__text"><b>' + esc(x.short) + "</b><span>" + esc(x.question) + '</span></span><span class="ballot-item__arrow" aria-hidden="true">→</span></button></li>')
    .join("");
  $("ballot").innerHTML =
    '<p class="kicker">' + DAY_LABEL + " · " + countdown + "</p>" +
    '<h1 id="t-ballot" class="h-page">' + n + " objets à trancher</h1>" +
    '<p class="lede">Touchez un objet pour comprendre l\'enjeu, comparer les positions et décider. ' + esc(ballot.voting_material) + "</p>" + cantonalHtml() +
    '<ol class="ballot-list">' + lis + "</ol>";
}
function renderStep(): void {
  const o = ballot.items[item];
  if (!o) return;
  const sc = scope();
  const cant = cantonBallot();
  let h: string;
  if (step === 0) {
    h = '<div class="outcomes"><div class="outcome outcome--yes"><h4>Si vous votez OUI</h4><p>' + esc(o.yes) + '</p></div><div class="outcome outcome--no"><h4>Si vous votez NON</h4><p>' + esc(o.no) + "</p></div></div>" +
      (o.federal_council ? '<p class="recommendation">Conseil fédéral et Parlement : <b>' + (o.federal_council === "yes" ? "OUI" : "NON") + "</b></p>" : '<p class="recommendation">Recommandation du Conseil fédéral : voir la brochure officielle.</p>') +
      '<p class="mini">Résumé indicatif. La brochure officielle fait foi.</p>' +
      link(o.url, "Page officielle de l'objet", "admin.ch") + link(ballot.brochure, "Brochure officielle (PDF)", "Explications du Conseil fédéral") +
      link(toolUrl(TOOL_IDS.easyvote), "easyvote", "Expliqué simplement") + link(toolUrl(TOOL_IDS.vimentis), "Vimentis", "Explications neutres");
  } else if (step === 1) {
    h = '<p class="mini">Mots d\'ordre des partis nationaux. Seuls ceux retrouvés dans une source sont indiqués, les autres sont à confirmer sur le site du parti.</p>' +
      '<div id="mini-hemi" class="hemicycle hemicycle--mini"></div><div id="mini-detail" class="mini-detail" aria-live="polite"></div>' +
      link(toolUrl(TOOL_IDS.smartvote), "smartvote", "Comparer avec vos propres opinions") + link(toolUrl(TOOL_IDS.smartmonitor), "smartmonitor", "Comment les élus ont réellement voté") + link(toolUrl(TOOL_IDS.swissvotes), "Swissvotes", "Mots d'ordre et historique des votations");
  } else {
    h = '<ol class="decide-steps"><li>Vérifiez que vous avez reçu le matériel de vote (' + esc(ballot.voting_material.replace("Le matériel de vote est reçu", "reçu")) + ").</li>" +
      "<li>Votez par correspondance, ou dans votre commune le dimanche 29 novembre.</li><li>En cas de doute, contactez la chancellerie de votre commune ou de votre canton.</li></ol>" +
      link(cant.url, sc.level === "canton" ? "Votations du canton " + cantonName(sc.canton) : "Votations de votre canton", host(cant.url)) + link(stateSiteUrl(STATE_SITE_IDS.portal), "ch.ch", "Comment voter, droits politiques");
  }
  $("step-body").innerHTML = h;
  if (step === 1) miniHemicycle();
}
function miniHemicycle(): void {
  const list = federal.parties;
  const n = list.length;
  const w = 180 / n;
  const o = ballot.items[item];
  if (!o) return;
  const CX = 180, CY = 178, R = 172, r = 100;
  function point(rr: number, d: number): [number, number] {
    const a = (d * Math.PI) / 180;
    return [CX + rr * Math.cos(a), CY - rr * Math.sin(a)];
  }
  let s = '<svg viewBox="0 0 360 195" role="group" aria-label="Positions des partis sur cet objet">';
  list.forEach((p, i) => {
    const a0 = 180 - i * w - 1, a1 = 180 - (i + 1) * w + 1;
    const o0 = point(R, a0), o1 = point(R, a1), i1 = point(r, a1), i0 = point(r, a0);
    const pos = o.parties[p.abbr] || o.parties[p.short];
    const mid = 180 - (i + 0.5) * w, tp = point((R + r) / 2, mid), rot = mid > 90 ? 180 - mid : -mid;
    s += '<g class="mini-sector mini-sector--' + (pos || "unknown") + (i === partyIndex ? " is-on" : "") + '" data-i="' + i + '" role="button" tabindex="0" aria-label="' + esc(p.name) + " : " + (pos ? LABEL[pos] : "à confirmer") + '">' +
      '<path d="M' + String(o0) + " A" + R + " " + R + " 0 0 1 " + String(o1) + " L" + String(i1) + " A" + r + " " + r + " 0 0 0 " + String(i0) + ' Z"/>' +
      '<text transform="translate(' + tp[0].toFixed(1) + " " + tp[1].toFixed(1) + ") rotate(" + rot.toFixed(1) + ')" text-anchor="middle" dominant-baseline="central">' + esc(p.short) + "</text></g>";
  });
  s += '</svg><ul class="legend-list"><li><i class="legend-key legend-key--yes"></i>Oui</li><li><i class="legend-key legend-key--no"></i>Non</li><li><i class="legend-key legend-key--unknown"></i>À confirmer</li></ul>';
  $("mini-hemi").innerHTML = s;
  $("mini-hemi").querySelectorAll(".mini-sector").forEach((g) => {
    const f = () => {
      partyIndex = +(g.getAttribute("data-i") as string);
      miniHemicycle();
    };
    g.addEventListener("click", f);
    g.addEventListener("keydown", (e) => {
      const key = (e as KeyboardEvent).key;
      if (key === "Enter" || key === " ") {
        e.preventDefault();
        f();
      }
    });
  });
  const d = $("mini-detail");
  const p = list[partyIndex];
  if (!p) {
    d.innerHTML = "Touchez un parti pour voir sa position.";
  } else {
    const pos = o.parties[p.abbr];
    d.innerHTML = "<b>" + esc(p.name) + "</b> : " + (pos ? '<span class="stance stance--' + pos + '">' + LABEL[pos] + "</span>" : "à confirmer") +
      (p.url ? ' · <a href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">site du parti ↗</a>' : "");
  }
}

/** Wires the item and step buttons, follows the territory changes and renders. */
export function start(): void {
  document.addEventListener("click", (e) => {
    const target = e.target as Element | null;
    const t = target && target.closest ? target.closest("[data-item],[data-step]") : null;
    if (!t) return;
    if (t.hasAttribute("data-item")) {
      item = +(t.getAttribute("data-item") as string);
      partyIndex = -1;
      step = 0;
      renderBallot();
      if (item >= 0) window.scrollTo(0, 0);
    } else if (t.hasAttribute("data-step")) {
      step = +(t.getAttribute("data-step") as string);
      renderBallot();
    }
  });
  onRender(renderBallot);
  renderBallot();
}
