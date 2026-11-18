/*
 * `npm run campaign-financing` (PRD-0001 US-28): for each ballot item with a CDF id, downloads the Federal Audit
 * Office's XLSX export (budgets and donations above CHF 15,000), reads it (tools/financing.ts), applies the removals
 * asked by donors (data/donor-removals.json, fingerprints only) and writes data/campaign-financing.json with each
 * request, the date and the CDF's own disclaimer. No key is needed.
 *
 * The documented download is the export; the disclaimer and the tree of items come from the portal's JSON
 * (undocumented): the tree only feeds a warning, never a failure.
 *
 * Messages are in French: the maintainers read them in French. They never hold a donor's name.
 */
import { join } from "node:path";
import { DATA_FILES, type Ballot, type CampaignFinancingFile, type Donation, type FinancedItem, type Removal } from "../src/types.ts";
import { readFinancing, removalOf } from "./financing.ts";
import { readWorkbook } from "./xlsx.ts";

const PORTAL = "https://politikfinanzierung.efk.admin.ch";
export const SOURCE_PAGE = `${PORTAL}/app/fr/`;
/** The portal's texts; the disclaimer it shows next to campaign financing is under DISCLAIMER_KEY, in French. */
export const TRANSLATIONS = `${PORTAL}/api/frontend/v1/translations`;
export const DISCLAIMER_KEY = "FE|Information|Campaign financing";
/** The portal's tree of ballot items, each root « JJ.MM.AAAA titre » with its id. */
export const TREE = `${PORTAL}/api/frontend/v1/fr/campaign_financings`;

/** The documented XLSX export of one ballot item, with the budgets. */
export function exportUrl(id: number): string {
  return `${PORTAL}/api/frontend/latest/fr/downloads/financings/${id}?with_budget=true`;
}

/** What the command needs from the outside, so that the tests can replace the network and the disk. */
export interface FinancingDeps {
  fetch: typeof fetch;
  /** YYYY-MM-DD. */
  today: string;
  write: (path: string, content: string) => void;
  log: (line: string) => void;
}

const README =
  "Généré par « npm run campaign-financing » depuis les exports du Contrôle fédéral des finances (CDF, politikfinanzierung.efk.admin.ch), " +
  "un par objet de data/ballot.json (financing_id) : ne pas modifier à la main, relancer la commande. Budgets déclarés avant le vote et " +
  "libéralités de plus de 15 000 francs, montants en CHF tels que publiés. D'une personne qui donne, seuls le prénom et le nom sont gardés ; " +
  "un donateur retiré à sa demande (data/donor-removals.json) devient « removed ». disclaimer : l'avertissement du CDF, repris tel quel.";

async function get(deps: FinancingDeps, url: string): Promise<Response> {
  const r = await deps.fetch(url);
  if (!r.ok) throw new Error(`le CDF répond ${r.status} pour ${url}`);
  return r;
}

/** The CDF's disclaimer, as its portal shows it in French. */
async function disclaimer(deps: FinancingDeps): Promise<string> {
  const json = (await (await get(deps, TRANSLATIONS)).json()) as { data?: { fr?: Record<string, unknown> } };
  const text = json?.data?.fr?.[DISCLAIMER_KEY];
  if (typeof text !== "string" || !text.trim()) throw new Error(`réponse inattendue du CDF : avertissement « ${DISCLAIMER_KEY} » absent de ${TRANSLATIONS}`);
  return text;
}

/** The portal's items of the ballot's date that no ballot item names, as warning lines; never throws. */
async function unnamedItems(b: Ballot, deps: FinancingDeps): Promise<string[]> {
  const [y, m, d] = b.date.split("-");
  const prefix = `${d}.${m}.${y} `;
  const named = new Set(b.items.map((i) => i.financing_id));
  try {
    const json = (await (await get(deps, TREE)).json()) as { data?: { tree_roots?: { id?: unknown; label?: unknown }[] } };
    const roots = json?.data?.tree_roots;
    if (!Array.isArray(roots)) throw new Error("réponse inattendue");
    return roots
      .filter((r) => typeof r.label === "string" && r.label.startsWith(prefix) && typeof r.id === "number" && !named.has(r.id))
      .map((r) => `Attention : le CDF publie l'objet ${r.id} « ${r.label} », qu'aucun objet de data/ballot.json ne nomme (financing_id).`);
  } catch (e) {
    return [`Attention : arbre des objets du CDF illisible (${(e as Error).message}) ; objets non nommés pas vérifiés.`];
  }
}

/** A person's donation whose name matches a removal becomes « removed », keeping value, receiver and date. */
function applyRemovals(donations: Donation[], removed: Set<string>): { donations: Donation[]; count: number } {
  let count = 0;
  const out = donations.map((d) => {
    if (!removalOf(d.donor, removed)) return d;
    count++;
    return { ...d, donor: { type: "removed" as const } };
  });
  return { donations: out, count };
}

/**
 * Downloads, reads and writes. Exit 0: written; 1: written, but a ballot item has no CDF id; 2: a download or an
 * export failed, nothing written. data/ballot.json and data/donor-removals.json are only read.
 */
export async function runCampaignFinancing(b: Ballot, removals: Removal[], dataDir: string, deps: FinancingDeps): Promise<number> {
  const removed = new Set(removals.map((r) => r.fingerprint));
  const missing = b.items.filter((i) => i.financing_id === null);
  const items: FinancedItem[] = [];
  const notes: string[] = [];
  let text: string;
  let removedCount = 0;
  try {
    text = await disclaimer(deps);
    for (const i of b.items) {
      if (i.financing_id === null) continue;
      const request = exportUrl(i.financing_id);
      const sheets = readWorkbook(Buffer.from(await (await get(deps, request)).arrayBuffer()));
      const read = readFinancing(sheets);
      if (!read) {
        notes.push(`${i.id} (CDF ${i.financing_id}) : aucune déclaration de budget publiée, objet laissé de côté.`);
        continue;
      }
      if (read.left_out > 0) notes.push(`${i.id} (CDF ${i.financing_id}) : ${read.left_out} déclaration(s) autre(s) que le budget laissée(s) de côté.`);
      const { donations, count } = applyRemovals(read.donations, removed);
      removedCount += count;
      items.push({ ballot_item: i.id, financing_id: i.financing_id, request, declared_on: read.declared_on, campaigns: read.campaigns, donations });
    }
  } catch (e) {
    deps.log(`Échec : ${(e as Error).message}. Rien écrit.`);
    return 2;
  }

  const file: CampaignFinancingFile = {
    _readme: README,
    campaign_financing: { source_page: SOURCE_PAGE, disclaimer: text, retrieved_on: deps.today, items },
  };
  deps.write(join(dataDir, DATA_FILES.campaign_financing.file), JSON.stringify(file, null, 2) + "\n");
  const committees = items.reduce((n, i) => n + i.campaigns.length, 0);
  const donations = items.flatMap((i) => i.donations);
  const persons = donations.filter((d) => d.donor.type === "person").length;
  deps.log(
    `Écrit data/${DATA_FILES.campaign_financing.file} : ${items.length} objets, ${committees} comités, ${donations.length} dons ` +
      `(${persons} de personnes, ${removedCount} donateur${removedCount > 1 ? "s" : ""} retiré${removedCount > 1 ? "s" : ""}).`,
  );
  for (const line of [...notes, ...(await unnamedItems(b, deps))]) deps.log(line);
  for (const i of missing) deps.log(`${i.id} : pas de financing_id dans data/ballot.json, objet non lu ; ajouter son id du CDF ou null avec une raison.`);
  return missing.length > 0 ? 1 : 0;
}
