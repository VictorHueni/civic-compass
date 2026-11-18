/*
 * Campaign financing from the Federal Audit Office (CDF), PRD-0001 US-26 to US-28.
 *
 * readFinancing reads one ballot item's XLSX export (two sheets: the budgeted receipts per committee and the
 * donations above CHF 15,000). The export is checked by column name; anything it does not expect makes it throw
 * « réponse inattendue du CDF », never guess. Of a person who gave, only first name and name are kept (PRD-0001 §3).
 */
import type { Campaign, Donation, Donor, FinancedItem, Recommendation } from "../src/types.ts";
import type { Sheet } from "./xlsx.ts";

function unexpected(what: string): Error {
  return new Error(`réponse inattendue du CDF : ${what}`);
}

/** An Excel serial date (days since 1899-12-30, the time as a fraction) as YYYY-MM-DD, in UTC. */
export function excelDate(serial: string): string {
  const days = Number(serial);
  if (serial.trim() === "" || !Number.isFinite(days) || days < 61) throw unexpected(`date « ${serial} »`);
  return new Date(Date.UTC(1899, 11, 30) + Math.floor(days) * 86_400_000).toISOString().slice(0, 10);
}

const COMMON = [
  "Base de données",
  "Période de déclaration",
  "Date",
  "ID acteur",
  "Acteur/trice",
  "Type d'acteur",
  "ID campagne",
  "Campagne",
  "ID déclaration",
  "Déclaration",
];
const RECEIPTS = {
  name: "Recettes totales",
  headers: [
    ...COMMON,
    "Montant total des recettes (en CHF)",
    "Recettes provenant de libéralités monétaires (en CHF)",
    "Valeur des recettes provenant de libéralités non-monétaires (en CHF)",
    "Recettes générées par des événements (en CHF)",
    "Recettes provenant de la vente de biens et de services (en CHF)",
    "Fonds propres monétaires (en CHF)",
  ],
};
const DONATIONS = {
  name: "Libéralités",
  headers: [
    ...COMMON,
    "ID libéralité",
    "Nom de l'auteur/e de la libéralité",
    "Prénom de l'auteur/e de la libéralité",
    "Commune de résidence",
    "Suisse de l'étranger",
    "Société de l'auteur/e de la libéralité",
    "Commune du siège social",
    "Nature de la libéralité",
    "Type de prestation",
    "Description de la prestation",
    "Valeur (en CHF)",
    "Date d'octroi de la libéralité",
  ],
};
const BUDGET = "Déclaration des recettes budgétées";
const DONATIONS_DECLARATION = "Déclaration de libéralités supérieures à 15 000 francs";
const SIDES: Record<string, Recommendation> = {
  "Adoption de l'objet de la votation populaire": "yes",
  "Rejet de l'objet de la votation populaire": "no",
};
const KINDS: Record<string, Donation["kind"]> = { Monétaire: "money", "Non-monétaire": "in_kind" };

/** Column letter of the n-th column, from 0 (A..Z, then AA..). */
function column(n: number): string {
  return n < 26 ? String.fromCharCode(65 + n) : column(Math.floor(n / 26) - 1) + column(n % 26);
}

/** The data rows of the named sheet, as header -> text, once its header row is exactly the expected one. */
function rowsOf(sheets: Sheet[], expected: { name: string; headers: string[] }): Map<string, string>[] {
  const sheet = sheets.find((s) => s.name === expected.name);
  if (!sheet) throw unexpected(`feuille « ${expected.name} » absente (trouvé : ${sheets.map((s) => s.name).join(", ")})`);
  const header = sheet.rows.get(1) ?? new Map<string, string>();
  expected.headers.forEach((h, i) => {
    const found = header.get(column(i));
    if (found !== h) throw unexpected(`feuille « ${expected.name} », colonne ${column(i)} : « ${found ?? ""} » au lieu de « ${h} »`);
  });
  const extra = [...header.keys()].filter((c) => !expected.headers.some((_, i) => column(i) === c));
  if (extra.length > 0) throw unexpected(`feuille « ${expected.name} », colonnes en plus : ${extra.join(", ")}`);
  return [...sheet.rows.entries()]
    .filter(([r]) => r > 1)
    .sort(([a], [b]) => a - b)
    .map(([, row]) => new Map(expected.headers.map((h, i) => [h, row.get(column(i)) ?? ""])));
}

function amount(text: string, what: string): number {
  const n = Number(text);
  if (text.trim() === "" || !Number.isFinite(n)) throw unexpected(`${what} : montant « ${text} »`);
  return n;
}
function integer(text: string, what: string): number {
  const n = Number(text);
  if (!Number.isInteger(n)) throw unexpected(`${what} : identifiant « ${text} »`);
  return n;
}
function side(text: string): Recommendation {
  const s = SIDES[text];
  if (!s) throw unexpected(`campagne « ${text} »`);
  return s;
}

/** One donor; a person keeps first name and name only, never the commune or « Suisse de l'étranger ». */
function donor(row: Map<string, string>, what: string): Donor {
  const name = row.get("Nom de l'auteur/e de la libéralité") ?? "";
  const firstName = row.get("Prénom de l'auteur/e de la libéralité") ?? "";
  const company = row.get("Société de l'auteur/e de la libéralité") ?? "";
  if (company && !name && !firstName) return { type: "company", name: company };
  if (!company && name && firstName) return { type: "person", first_name: firstName, name };
  throw unexpected(`${what} : ni une société ni une personne`);
}

/** What one export says: the budgets declared before the vote and the donations; null when it holds no budget. */
export type ReadFinancing = Pick<FinancedItem, "declared_on" | "campaigns" | "donations"> & {
  /** Declarations other than the budget (final accounts, after the vote), counted and left out. */
  left_out: number;
};

export function readFinancing(sheets: Sheet[]): ReadFinancing | null {
  const receipts = rowsOf(sheets, RECEIPTS);
  const given = rowsOf(sheets, DONATIONS);
  let leftOut = 0;
  const campaigns: Campaign[] = [];
  let declaredOn: string | null = null;
  for (const row of receipts) {
    const what = `déclaration ${row.get("ID déclaration")}`;
    const s = side(row.get("Campagne") ?? "");
    if (row.get("Déclaration") !== BUDGET) {
      leftOut++;
      continue;
    }
    declaredOn ??= excelDate(row.get("Base de données") ?? "");
    campaigns.push({
      actor_id: integer(row.get("ID acteur") ?? "", what),
      actor: row.get("Acteur/trice") ?? "",
      actor_type: row.get("Type d'acteur") ?? "",
      side: s,
      total: amount(row.get("Montant total des recettes (en CHF)") ?? "", what),
      money_donations: amount(row.get("Recettes provenant de libéralités monétaires (en CHF)") ?? "", what),
      in_kind_donations: amount(row.get("Valeur des recettes provenant de libéralités non-monétaires (en CHF)") ?? "", what),
      events: amount(row.get("Recettes générées par des événements (en CHF)") ?? "", what),
      sales: amount(row.get("Recettes provenant de la vente de biens et de services (en CHF)") ?? "", what),
      own_funds: amount(row.get("Fonds propres monétaires (en CHF)") ?? "", what),
    });
  }
  const donations: Donation[] = [];
  for (const row of given) {
    const what = `libéralité ${row.get("ID libéralité")}`;
    side(row.get("Campagne") ?? "");
    if (row.get("Déclaration") !== DONATIONS_DECLARATION) {
      leftOut++;
      continue;
    }
    const kind = KINDS[row.get("Nature de la libéralité") ?? ""];
    if (!kind) throw unexpected(`${what} : nature « ${row.get("Nature de la libéralité")} »`);
    donations.push({
      id: integer(row.get("ID libéralité") ?? "", what),
      actor_id: integer(row.get("ID acteur") ?? "", what),
      donor: donor(row, what),
      value: amount(row.get("Valeur (en CHF)") ?? "", what),
      kind,
      given_on: excelDate(row.get("Date d'octroi de la libéralité") ?? ""),
    });
  }
  if (declaredOn === null) return null;
  return { declared_on: declaredOn, campaigns, donations, left_out: leftOut };
}
