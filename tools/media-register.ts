/*
 * The register check of the media publishers (PRD-0001 US-25): for each company or holder of data/media.json with a
 * UID, the commercial register's linked open data (Zefix on lindas.admin.ch, SPARQL, no credentials) gives the legal
 * name, legal form and seat; the comparison lists what differs from the hand-kept file. It never edits that file.
 *
 * The linked register holds active companies only: a UID it does not list is a deleted company or a wrong UID, and
 * a company in liquidation shows it at the end of its legal name ("en liquidation").
 *
 * Messages are in French: the maintainers read them in French.
 */

export const ENDPOINT = "https://lindas.admin.ch/query";
/** The dataset and its terms, as the register's linked data declares them (dcterms:rights). */
export const DATASET = "https://register.ld.admin.ch/.well-known/dataset/foj-zefix";
export const TERMS = "OGD Open use. Must provide the source.";
export const TERMS_URL = "https://ld.admin.ch/vocabulary/TermsOfUse/Provide-the-Source";
export const ATTRIBUTION = "Zefix, Index central des raisons de commerce, Office fédéral de la justice, données liées LINDAS";

/** What the register says of one UID. */
export interface RegisterEntry {
  /** CHE-123.456.789, as the hand-kept file writes it. */
  uid: string;
  name: string;
  /** The legal form as the register names it in French ("Société anonyme"). */
  legal_form: string;
  seat: string | null;
}

/** A company or holder of the hand-kept file, as far as the register can check it. */
export interface Registered {
  id: string;
  name?: string;
  legal_form?: string;
  seat?: string | null;
  uid?: string | null;
}

/** "CHE-103.365.013" -> "CHE103365013", the value the register stores. */
function uidValue(uid: string): string {
  return uid.replace(/[-.\s]/g, "");
}

/** "CHE103365013" -> "CHE-103.365.013". */
function uidShown(value: string): string {
  const d = value.replace(/^CHE/, "");
  return `CHE-${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}`;
}

/** The SPARQL query: legal name, legal form in French and seat of each UID, joined on the UID's value. */
export function registerQuery(uids: string[]): string {
  return [
    "PREFIX schema: <http://schema.org/>",
    "SELECT ?uid ?name ?form ?seat WHERE {",
    `  VALUES ?uid { ${uids.map((u) => `"${uidValue(u)}"`).join(" ")} }`,
    "  ?id schema:value ?uid .",
    "  ?c schema:identifier ?id ; a <https://schema.ld.admin.ch/ZefixOrganisation> ; schema:legalName ?name ;",
    "     schema:additionalType ?lf ; <https://schema.ld.admin.ch/municipality> ?m .",
    '  OPTIONAL { ?lf schema:name ?form . FILTER(lang(?form) = "fr") }',
    "  OPTIONAL { ?m schema:name ?seat }",
    "}",
  ].join("\n");
}

/** The request as one GET address, kept in the generated file so that anyone can run it again. */
export function requestUrl(uids: string[]): string {
  return ENDPOINT + "?query=" + encodeURIComponent(registerQuery(uids));
}

type Binding = Record<string, { value?: unknown } | undefined>;

/** Reads a SPARQL JSON result into one entry per UID; throws on any other shape. */
export function readAnswer(answer: unknown): RegisterEntry[] {
  const bindings = (answer as { results?: { bindings?: unknown } })?.results?.bindings;
  if (!Array.isArray(bindings)) throw new Error("réponse inattendue du registre : pas de résultats SPARQL");
  return (bindings as Binding[]).map((b) => {
    const text = (k: string) => (typeof b[k]?.value === "string" ? (b[k]?.value as string) : null);
    const uid = text("uid");
    const name = text("name");
    if (!uid || !name) throw new Error("réponse inattendue du registre : une ligne sans IDE ou sans nom");
    return { uid: uidShown(uid), name, legal_form: text("form") ?? "", seat: text("seat") };
  });
}

/** The register's French names of legal forms, as the hand-kept file writes them; others are compared in lower case. */
const FORMS: Record<string, string> = {
  "société anonyme": "sa",
  "société à responsabilité limitée": "sàrl",
  coopérative: "société coopérative",
  "succursale suisse inscrite au registre du commerce": "succursale",
};
const form = (f: string) => FORMS[f.toLowerCase()] ?? f.toLowerCase();

const LIQUIDATION = /\b(en liquidation|in Liquidation|in liquidazione)\s*$/i;

/**
 * What differs between the hand-kept file and the register, one message per difference: name, legal form, seat,
 * then a company in liquidation or absent from the register. Entries without a UID are not checked.
 */
export function compare(entities: Registered[], entries: RegisterEntry[]): string[] {
  const byUid = new Map(entries.map((e) => [e.uid, e]));
  const report: string[] = [];
  for (const x of entities) {
    if (!x.uid) continue;
    const at = `${x.id} (${x.uid})`;
    const r = byUid.get(x.uid);
    if (!r) {
      report.push(`${at} : absente du registre (radiée, ou IDE erroné) ; le registre lié ne garde que les sociétés actives`);
      continue;
    }
    if (x.name !== undefined && x.name !== r.name) report.push(`${at} : nom « ${x.name} » dans le fichier, « ${r.name} » au registre`);
    if (x.legal_form !== undefined && form(x.legal_form) !== form(r.legal_form)) {
      report.push(`${at} : forme « ${x.legal_form} » dans le fichier, « ${r.legal_form} » au registre`);
    }
    if (x.seat !== undefined && (x.seat ?? null) !== r.seat) report.push(`${at} : siège « ${x.seat ?? "inconnu"} » dans le fichier, « ${r.seat ?? "inconnu"} » au registre`);
    if (LIQUIDATION.test(r.name)) report.push(`${at} : en liquidation selon le registre`);
  }
  return report;
}
