/*
 * « Signaler une erreur ou demander un retrait » (PRD-0001 US-24, US-27): shown wherever the site names a person
 * who is neither an elected official nor a public figure (media owners, donors), on the same card or step.
 */
import { escapeHtml as esc } from "./dom.ts";

/** The error and removal address of the owner (PRD-0001 §8): an e-mail keeps a removal request private. */
const REPORT_ADDRESS = "huni.victor@gmail.com";

/** The report box; `subject` starts the e-mail's subject, `what` says what to name (« le média ou la personne »). */
export function reportHtml(subject: string, what: string): string {
  const mailto = "mailto:" + REPORT_ADDRESS + "?subject=" + encodeURIComponent(subject);
  return (
    '<details class="report"><summary>Signaler une erreur ou demander un retrait</summary>' +
    "<p>Écrivez à <span class=\"report__address\">" + esc(REPORT_ADDRESS) + "</span> en indiquant " + esc(what) + ", l'erreur et si possible votre source.</p>" +
    "<p>Une personne nommée ici peut demander que son nom soit retiré : la demande reste privée et elle est traitée dans les 30 jours.</p>" +
    '<p><a class="btn btn--outline btn--sm" href="' + esc(mailto) + '"><span class="btn__text">Écrire un e-mail</span></a></p></details>'
  );
}
