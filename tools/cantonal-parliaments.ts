/*
 * Cantonal parliaments from the OFS table je-f-17.02.05.01.03 (Research-0002 Q4, owner rulings 1, 5 and 6):
 * what `npm run cantonal-parliaments` reads in the workbook, and the rules `npm run check` applies to
 * data/cantonal-parliaments.json. The download itself is in tools/cli.ts.
 */
import { TOTAL_COLUMN, YEAR_COLUMN, cantonRow, cantonSeats, plainLabel } from "../src/site/cantonal-parliaments.ts";
import type { CantonalParliaments, CantonalParliamentRow, Party, Territory } from "../src/types.ts";
import type { Sheet } from "./xlsx.ts";

const DAM = "https://dam-api.bfs.admin.ch/hub/api/dam/assets";

export const CANTONAL_PARLIAMENTS = {
  orderNr: "je-f-17.02.05.01.03",
  search: `${DAM}?orderNr=je-f-17.02.05.01.03&language=fr`,
  asset: (damId: number) => `${DAM}/${damId}`,
  master: (damId: number) => `${DAM}/${damId}/master`,
  /** The sheet of the latest election of each canton ("actuel (2021-2026)" on 2026-11-17). */
  sheetPrefix: "actuel",
  /** Terms of use of the asset; the command stops if they change. */
  terms: "OPEN-BY",
  attribution: "Source : OFS, statistique des élections cantonales",
  license: "Conditions OPEN-BY de l'OFS : utilisation libre, la source doit être indiquée",
  /** Seats of each covered parliament (Research-0002 Q4: OFS totals, cantonal pages and OpenParlData agree). */
  sizes: { GE: 100, VD: 150, VS: 130, NE: 100, JU: 60, FR: 110 } as Record<string, number>,
};

/**
 * OFS column (label without footnote mark) -> party of the canton in parties.json (Research-0002 Q4).
 * A column absent here has no party on the site for that canton and is shown under its OFS label:
 * VD "Sol." and "Autres", VS "Autres", NE "Le Centre", FR "Autres". GE "Autres" is LJS only (OFS note 4).
 */
const common = (c: string) => ({ PLR: `plr-${c}`, PS: `ps-${c}`, UDC: `udc-${c}`, "Le Centre": `centre-${c}`, "VERT-E-S": `verts-${c}`, PVL: `pvl-${c}` });
export const CANTONAL_PARTIES: Record<string, Record<string, string>> = {
  GE: { ...common("ge"), "MCG (MCR)": "mcg-ge", Autres: "ljs-ge" },
  VD: { ...common("vd"), PST: "pop-vd" },
  VS: { PLR: "plr-vs", PS: "ps-vs", UDC: "udc-vs", "Le Centre": "centre-vs", "VERT-E-S": "verts-vs" },
  NE: { PLR: "plr-ne", PS: "ps-ne", UDC: "udc-ne", "VERT-E-S": "verts-ne", PVL: "pvl-ne", PST: "pop-ne" },
  JU: { PLR: "plr-ju", PS: "ps-ju", UDC: "udc-ju", "Le Centre": "centre-ju", "VERT-E-S": "verts-ju", PCS: "pcsi-ju", PST: "cs-pop-ju" },
  FR: { ...common("fr"), PCS: "cg-pcs-fr" },
};

/** The table as read from the workbook, before the source fields are added. */
export type CantonalTable = Pick<CantonalParliaments, "title" | "table" | "sheet" | "columns" | "rows" | "notes">;

function columnIndex(letters: string): number {
  return [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
}

/**
 * Reads the current sheet: the column labels from the election year to the end, the rows of the cantons named
 * (by their name in data/territories.json), and the notes under the table. Labels and cells stay unchanged.
 */
export function extractTable(sheets: Sheet[], cantonNames: string[]): CantonalTable {
  const sheet = sheets.find((s) => s.name.startsWith(CANTONAL_PARLIAMENTS.sheetPrefix));
  if (!sheet) throw new Error(`feuille « ${CANTONAL_PARLIAMENTS.sheetPrefix}… » introuvable (feuilles : ${sheets.map((s) => s.name).join(", ")})`);
  const rowNumbers = [...sheet.rows.keys()].sort((a, b) => a - b);

  let headerRow = 0;
  let yearColumn = "";
  for (const r of rowNumbers) {
    for (const [col, text] of sheet.rows.get(r) ?? []) {
      if (plainLabel(text) === YEAR_COLUMN) [headerRow, yearColumn] = [r, col];
    }
    if (headerRow) break;
  }
  if (!headerRow) throw new Error(`colonne « ${YEAR_COLUMN} » introuvable dans la feuille « ${sheet.name} »`);
  const header = [...(sheet.rows.get(headerRow) ?? [])]
    .filter(([col]) => columnIndex(col) >= columnIndex(yearColumn))
    .sort(([a], [b]) => columnIndex(a) - columnIndex(b));
  const columns = header.map(([, label]) => label);
  if (new Set(columns).size !== columns.length) throw new Error(`colonnes en double dans la feuille « ${sheet.name} »`);
  if (!columns.some((c) => plainLabel(c) === TOTAL_COLUMN)) throw new Error(`colonne « ${TOTAL_COLUMN} » introuvable dans la feuille « ${sheet.name} »`);

  const first = sheet.rows.get(rowNumbers[0]) ?? new Map<string, string>();
  const rows: CantonalParliamentRow[] = [];
  const notes: string[] = [];
  for (const r of rowNumbers.filter((n) => n > headerRow)) {
    const cells = sheet.rows.get(r) ?? new Map<string, string>();
    const label = cells.get("A");
    if (label === undefined) continue;
    const inTable = header.some(([col]) => cells.has(col));
    if (inTable && cantonNames.includes(plainLabel(label))) {
      rows.push({ label, cells: Object.fromEntries(header.filter(([col]) => cells.has(col)).map(([col, l]) => [l, cells.get(col) as string])) });
    } else if (!inTable && cells.size === 1) {
      notes.push(label);
    }
  }
  return {
    title: first.get("A") ?? "",
    table: [...first.values()].find((t) => /^T\s*\d/.test(t)) ?? "",
    sheet: sheet.name,
    columns,
    rows,
    notes,
  };
}

/** Cantons covered by the site: those with parties in parties.json (data/territories.json). */
export function coveredCantons(territories: Territory[], parties: Party[]): Territory[] {
  return territories.filter((t) => t.code !== "CH" && parties.some((p) => p.territory === t.code));
}

/** Rules on the generated file: one row per covered canton, seats adding up to the parliament's size, known parties of the canton. */
export function checkCantonalParliaments(p: CantonalParliaments, territories: Territory[], parties: Party[]): string[] {
  const errors: string[] = [];
  const covered = coveredCantons(territories, parties);
  const plainColumns = new Set(p.columns.map(plainLabel));
  for (const name of [YEAR_COLUMN, TOTAL_COLUMN]) if (!plainColumns.has(name)) errors.push(`colonne « ${name} » absente`);
  for (const row of p.rows) {
    if (!covered.some((t) => t.name === plainLabel(row.label))) errors.push(`ligne « ${row.label} » : pas un canton couvert`);
    for (const col of Object.keys(row.cells)) if (!p.columns.includes(col)) errors.push(`ligne « ${row.label} » : colonne « ${col} » absente de columns`);
  }
  for (const t of covered) {
    const size = CANTONAL_PARLIAMENTS.sizes[t.code];
    const row = cantonRow(p, t.name);
    if (size === undefined) errors.push(`${t.code} : taille du parlement inconnue (CANTONAL_PARLIAMENTS.sizes, tools/cantonal-parliaments.ts)`);
    if (!row) {
      errors.push(`${t.code} : ligne « ${t.name} » absente`);
      continue;
    }
    const s = cantonSeats(p, t.code, row);
    const sum = s.parties.reduce((n, x) => n + x.seats, 0);
    if (s.year === null || s.year < 1968 || s.year > new Date().getFullYear()) errors.push(`${t.code} : année électorale « ${row.cells[p.columns.find((c) => plainLabel(c) === YEAR_COLUMN) ?? ""]} » invalide`);
    if (s.total !== size) errors.push(`${t.code} : total ${s.total} au lieu de ${size} sièges`);
    if (sum !== s.total) errors.push(`${t.code} : la somme des sièges par parti (${sum}) ne vaut pas le total (${s.total})`);
  }
  for (const [code, mapping] of Object.entries(p.party_mapping)) {
    if (!covered.some((t) => t.code === code)) errors.push(`party_mapping ${code} : pas un canton couvert`);
    for (const [column, id] of Object.entries(mapping)) {
      if (!plainColumns.has(column)) errors.push(`party_mapping ${code} « ${column} » : colonne absente du tableau`);
      const party = parties.find((x) => x.id === id);
      if (!party) errors.push(`party_mapping ${code} « ${column} » : parti « ${id} » absent de parties.json`);
      else if (party.territory !== code) errors.push(`party_mapping ${code} « ${column} » : « ${id} » est un parti de ${party.territory}`);
    }
  }
  return errors;
}

/** Per covered canton, the columns with seats but no party on the site: "VD : Sol. 1, Autres 5". */
export function unmappedSeats(p: CantonalParliaments, territories: Territory[], parties: Party[]): string[] {
  return coveredCantons(territories, parties).flatMap((t) => {
    const row = cantonRow(p, t.name);
    const free = row ? cantonSeats(p, t.code, row).parties.filter((x) => !x.partyId) : [];
    return free.length ? [`${t.code} : ${free.map((x) => `${x.column} ${x.seats}`).join(", ")}`] : [];
  });
}

/** "GE 2023 (100), VD 2022 (150)…" */
export function cantonalSummary(p: CantonalParliaments, territories: Territory[], parties: Party[]): string {
  return coveredCantons(territories, parties)
    .map((t) => {
      const row = cantonRow(p, t.name);
      const s = row ? cantonSeats(p, t.code, row) : null;
      return `${t.code} ${s?.year ?? "?"} (${s?.total ?? "?"})`;
    })
    .join(", ");
}
