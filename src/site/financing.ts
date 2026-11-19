/*
 * The step « Suivre l'argent » of a ballot item (PRD-0001 US-26): who funds the campaign, from the budgets the
 * committees declared to the Federal Audit Office before the vote, and the donations above CHF 15,000 by receiving
 * committee, with « Signaler une erreur ou demander un retrait » on the same step (US-27: a donor who is a person is
 * never named without it). What the step says comes from financing-model.ts; this module only writes it.
 */
import { escapeHtml as esc, swissDate } from "./dom.ts";
import { amount, chf, financingView, PRIVATE_DONOR, type ReceiverView, type SideView } from "./financing-model.ts";
import { countOf } from "./cantonal-standing.ts";
import { STATE_SITE_IDS } from "./links.ts";
import { campaignFinancing, stateSiteUrl } from "./referential.ts";
import { reportHtml } from "./report.ts";
import type { Recommendation } from "../types.ts";

const SIDE: Record<Recommendation, { label: string; title: string; none: string }> = {
  yes: { label: "POUR", title: "Pour", none: "Aucun comité n'a déclaré de budget pour le oui." },
  no: { label: "CONTRE", title: "Contre", none: "Aucun comité n'a déclaré de budget pour le non." },
};

function cdfLink(): string {
  return (
    '<a class="fact-sheet__link" href="' + esc(stateSiteUrl(STATE_SITE_IDS.financing)) + '" target="_blank" rel="noopener noreferrer">' +
    "<span>Tous les détails sur le site du CDF<small>Contrôle fédéral des finances</small></span><span aria-hidden=\"true\">↗</span></a>"
  );
}

function sideBox(s: SideView): string {
  return (
    '<div class="money-side money-side--' + s.side + '"><p class="money-side__label">' + SIDE[s.side].label + "</p>" +
    '<p class="money-side__total">' + chf(s.total) + '</p><p class="money-side__count">' + countOf(s.committees.length, "comité", "comités") + "</p></div>"
  );
}

function committeeRows(s: SideView): string {
  const rows = s.committees.length
    ? s.committees
        .map(
          (c) =>
            '<li class="money-row"><p class="money-row__top"><span>' + esc(c.actor) + "</span><b>" + amount(c.total) + "</b></p>" +
            '<span class="money-bar" aria-hidden="true"><span class="money-bar__fill money-bar__fill--' + s.side + '" style="width:' + c.width + '%"></span></span></li>',
        )
        .join("")
    : '<li class="money-row">' + SIDE[s.side].none + "</li>";
  return '<h3 class="money-h money-h--' + s.side + '">' + SIDE[s.side].title + '</h3><ul class="money-rows">' + rows + "</ul>";
}

function receiverBlock(r: ReceiverView): string {
  const lines = r.lines
    .map((l) => {
      const from = l.donor === PRIVATE_DONOR ? "d'" : "de ";
      const count = l.count > 1 ? ' <span class="money-muted">(' + countOf(l.count, "don", "dons") + ")</span>" : "";
      return '<li class="money-gift"><span><span class="money-muted">' + from + "</span>" + esc(l.donor) + count + "</span><b>" + amount(l.value) + "</b></li>";
    })
    .join("");
  return (
    '<div class="money-side money-side--' + r.side + ' money-receiver"><p class="money-side__label">' + SIDE[r.side].label + "</p>" +
    "<p>Reçu par <b>" + esc(r.actor) + '</b></p><p class="money-muted">' + chf(r.total) + ", " + countOf(r.count, "don", "dons") + "</p>" +
    '<ul class="money-gifts">' + lines + "</ul></div>"
  );
}

/** The step's content for one ballot item; `subject` names the item in the error report's e-mail. */
export function financingHtml(ballotItemId: string, subject: string): string {
  const v = financingView(campaignFinancing, ballotItemId);
  if (v.state === "none") {
    return '<p class="mini">Aucune déclaration publiée par le CDF pour cet objet (consulté le ' + swissDate(v.retrieved_on) + "). Seules les campagnes de plus de 50" + " " + "000 francs doivent déclarer leur budget.</p>" + cdfLink();
  }
  const d = v.donations;
  const gifts = d.count
    ? '<p class="money-muted">' + countOf(d.count, "don déclaré", "dons déclarés") + ", " + chf(d.total) + " au total, reçus par " + countOf(d.receivers, "comité", "comités") + ".</p>" +
      v.receivers.map(receiverBlock).join("") +
      (v.without.length ? "<p>Les comités sans don de plus de 15" + " " + "000 francs (" + v.without.map(esc).join(", ") + ") n'apparaissent pas ici.</p>" : "")
    : "<p>Aucun don de plus de 15" + " " + "000 francs déclaré.</p>";
  return (
    '<section class="money" aria-labelledby="t-money"><h2 id="t-money" class="money-title">Qui finance la campagne ?</h2>' +
    "<p>Budgets que les comités ont déclarés avant le vote. Seules les campagnes de plus de 50" + " " + "000 francs doivent les déclarer. Ce sont des budgets, pas des dépenses.</p>" +
    '<div class="money-sides">' + v.sides.map(sideBox).join("") + "</div>" +
    v.sides.map(committeeRows).join("") +
    '<h3 class="money-h">Les dons de plus de 15' + " " + "000 francs, par comité qui les reçoit</h3>" + gifts +
    '<p class="mini">Source : Contrôle fédéral des finances, financement de la politique, déclarations du ' + swissDate(v.declared_on) + ", consultées le " + swissDate(v.retrieved_on) + ". " + esc(v.disclaimer) + "</p>" +
    cdfLink() + reportHtml("Financement : " + subject, "l'objet, le comité ou le donateur") + "</section>"
  );
}
