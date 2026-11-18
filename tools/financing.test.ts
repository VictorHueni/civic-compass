/*
 * Tests of the campaign financing data (PRD-0001 US-26 to US-28, Plan-0001-financing). Run: npm test.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DATA_FILES, type CampaignFinancingFile } from "../src/types.ts";
import { excelDate, readFinancing } from "./financing.ts";
import { checkFile, Report } from "./schema.ts";
import { readWorkbook, type Sheet } from "./xlsx.ts";

/** A small valid file: one item, a committee on each side, one donation by a company, one by a person, one removed. */
function financingFile(): CampaignFinancingFile {
  return {
    _readme: "Généré.",
    campaign_financing: {
      source_page: "https://politikfinanzierung.efk.admin.ch/app/fr/",
      disclaimer: "Le CDF publie les déclarations telles qu'elles lui ont été remises.",
      retrieved_on: "2026-11-19",
      items: [
        {
          ballot_item: "avs",
          financing_id: 33,
          request: "https://politikfinanzierung.efk.admin.ch/api/frontend/latest/fr/downloads/financings/33?with_budget=true",
          declared_on: "2026-11-10",
          campaigns: [
            {
              actor_id: 374,
              actor: "Union syndicale suisse (USS)",
              actor_type: "Personne morale ou société de personnes",
              side: "yes",
              total: 225000,
              money_donations: 50000,
              in_kind_donations: 25000,
              events: 0,
              sales: 0,
              own_funds: 150000,
            },
            {
              actor_id: 625,
              actor: "Syndicat suisse des services publics (SSP)",
              actor_type: "Personne morale ou société de personnes",
              side: "no",
              total: 54221.27,
              money_donations: 1000,
              in_kind_donations: 19077.27,
              events: 0,
              sales: 0,
              own_funds: 34144,
            },
          ],
          donations: [
            { id: 4639, actor_id: 374, donor: { type: "company", name: "Schweizerischer Gewerkschaftsbund" }, value: 25000, kind: "in_kind", given_on: "2026-10-01" },
            { id: 4670, actor_id: 625, donor: { type: "person", first_name: "Anne", name: "Exemple" }, value: 25000, kind: "money", given_on: "2026-11-05" },
            { id: 4671, actor_id: 625, donor: { type: "removed" }, value: 20000, kind: "money", given_on: "2026-11-01" },
          ],
        },
      ],
    },
  };
}

function errorsOf(content: unknown, schema = DATA_FILES.campaign_financing.schema): string[] {
  const report = new Report();
  checkFile(content, schema, "data/campaign-financing.json", report);
  return report.errors;
}

test("a valid campaign financing file passes its schema", () => {
  assert.deepEqual(errorsOf(financingFile()), []);
});

test("the campaign financing schema rejects a wrong side, an amount as text, a mixed or located donor and a false date, naming the field", () => {
  const cases: [string, (f: CampaignFinancingFile) => void, RegExp][] = [
    ["side", (f) => ((f.campaign_financing.items[0].campaigns[0] as { side: string }).side = "pour"), /« side » vaut pour/],
    ["amount", (f) => ((f.campaign_financing.items[0].campaigns[0] as unknown as { total: string }).total = "225000"), /« total » doit être un nombre/],
    [
      "company and person",
      (f) => ((f.campaign_financing.items[0].donations[0] as unknown as { donor: object }).donor = { type: "company", name: "X", first_name: "Y" }),
      /champ « first_name » inconnu/,
    ],
    [
      "commune",
      (f) => ((f.campaign_financing.items[0].donations[1] as unknown as { donor: object }).donor = { type: "person", first_name: "Anne", name: "Exemple", commune: "Genève" }),
      /champ « commune » inconnu/,
    ],
    ["removed keeps a name", (f) => ((f.campaign_financing.items[0].donations[2] as unknown as { donor: object }).donor = { type: "removed", name: "Exemple" }), /champ « name » inconnu/],
    ["donor type", (f) => ((f.campaign_financing.items[0].donations[0] as unknown as { donor: object }).donor = { type: "commune", name: "X" }), /« donor\.type » vaut commune/],
    ["date", (f) => (f.campaign_financing.items[0].declared_on = "2026-02-30"), /« declared_on » doit être une date/],
  ];
  for (const [label, change, expected] of cases) {
    const f = financingFile();
    change(f);
    const errors = errorsOf(f);
    assert.ok(errors.some((e) => expected.test(e)), `${label} : ${JSON.stringify(errors)}`);
  }
});

test("the donor removals file holds fingerprints only", () => {
  const ok = { _readme: "À la main.", donor_removals: [{ fingerprint: "a".repeat(64), date: "2026-11-19", reason: "person_request" }] };
  const report = new Report();
  checkFile(ok, DATA_FILES.donor_removals.schema, "data/donor-removals.json", report);
  assert.deepEqual(report.errors, []);
  const named = { ...ok, donor_removals: [{ ...ok.donor_removals[0], name: "Anne Exemple" }] };
  const bad = new Report();
  checkFile(named, DATA_FILES.donor_removals.schema, "data/donor-removals.json", bad);
  assert.ok(bad.errors.some((e) => /champ « name » inconnu/.test(e)), JSON.stringify(bad.errors));
});

test("a ballot item names its CDF id as an integer or null", () => {
  const ballot = JSON.parse(readFileSync(new URL("../data/ballot.json", import.meta.url), "utf8"));
  const errors = (content: unknown) => {
    const report = new Report();
    checkFile(content, DATA_FILES.ballot.schema, "data/ballot.json", report);
    return report.errors;
  };
  assert.deepEqual(errors(ballot), []);
  ballot.ballot.items[0].financing_id = null;
  assert.deepEqual(errors(ballot), []);
  ballot.ballot.items[0].financing_id = "33";
  assert.ok(errors(ballot).some((e) => /« financing_id » doit être un nombre entier/.test(e)));
  delete ballot.ballot.items[0].financing_id;
  assert.ok(errors(ballot).some((e) => /champ « financing_id » manquant/.test(e)));
});

/* ---------- Reading one CDF export (increment 03) ---------- */

/** The exports of items 33 (AVS / TVA) and 35 (couples), recorded on 2026-11-19 (same sheets as on 2026-11-18). */
function fixture(id: 33 | 35): Sheet[] {
  return readWorkbook(readFileSync(new URL(`./fixtures/cdf-financing-${id}.xlsx`, import.meta.url)));
}
const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;

test("excelDate turns an Excel serial into a calendar date", () => {
  assert.equal(excelDate("46336.561932766956"), "2026-11-10");
  assert.equal(excelDate("46355.0"), "2026-11-29");
  assert.throws(() => excelDate("10.11.2026"), /réponse inattendue du CDF/);
});

test("readFinancing reads the budgets and donations of item 33", () => {
  const item = readFinancing(fixture(33));
  assert.ok(item);
  assert.equal(item.declared_on, "2026-11-10");
  assert.equal(item.left_out, 0);
  const sides = Object.fromEntries(item.campaigns.map((c) => [c.actor, c.side]));
  assert.deepEqual(sides, {
    "Union Démocratique du Centre (UDC)": "no",
    "Union syndicale suisse (USS)": "yes",
    "PLR.Les Libéraux-Radicaux": "no",
    "Sozialdemokratische Partei der Schweiz": "yes",
    "Centre Patronal": "no",
    "Syndicat suisse des services publics (SSP)": "no",
  });
  const plr = item.campaigns.find((c) => c.actor === "PLR.Les Libéraux-Radicaux");
  assert.deepEqual(plr, {
    actor_id: 43,
    actor: "PLR.Les Libéraux-Radicaux",
    actor_type: "Personne morale ou société de personnes",
    side: "no",
    total: 889590,
    money_donations: 549590,
    in_kind_donations: 40000,
    events: 0,
    sales: 0,
    own_funds: 300000,
  });
  // The mockup's sums: 581 000 for, 1 128 811.27 against, 735 000 in 13 donations.
  assert.equal(sum(item.campaigns.filter((c) => c.side === "yes").map((c) => c.total)), 581000);
  assert.equal(sum(item.campaigns.filter((c) => c.side === "no").map((c) => c.total)), 1128811.27);
  assert.equal(item.donations.length, 13);
  assert.equal(sum(item.donations.map((d) => d.value)), 735000);
  const largest = item.donations.reduce((a, b) => (b.value > a.value ? b : a));
  assert.deepEqual(largest, {
    id: 4669,
    actor_id: 43,
    donor: { type: "company", name: "Aktionskomitee für Freiheit und Verantwortung" },
    value: 250000,
    kind: "money",
    given_on: "2026-10-12",
  });
  assert.equal(item.donations.filter((d) => d.kind === "in_kind").length, 2);
});

test("readFinancing keeps a person's first name and name, nothing else", () => {
  for (const id of [33, 35] as const) {
    const persons = (readFinancing(fixture(id))?.donations ?? []).filter((d) => d.donor.type === "person");
    assert.equal(persons.length, 1, `objet ${id}`);
    const donor = persons[0].donor as Record<string, unknown>;
    assert.deepEqual(Object.keys(donor).sort(), ["first_name", "name", "type"]);
    assert.ok(typeof donor.first_name === "string" && donor.first_name !== "" && typeof donor.name === "string" && donor.name !== "");
  }
  // Nothing of the person's row beyond the two names reaches the result: not the commune, not « Suisse de l'étranger ».
  const sheets = fixture(35);
  const row = [...sheets[1].rows.values()].find((r) => r.get("L"));
  const kept = JSON.stringify(readFinancing(sheets));
  for (const column of ["N", "O"]) assert.ok(!kept.includes(`"${row?.get(column)}"`), `colonne ${column}`);
});

test("readFinancing refuses a changed export, naming what changed", () => {
  const renamed = fixture(33);
  renamed[1].rows.get(1)?.set("U", "Montant");
  assert.throws(() => readFinancing(renamed), /réponse inattendue du CDF.*Libéralités.*U.*Montant/);
  const oneSheet = fixture(33).slice(0, 1);
  assert.throws(() => readFinancing(oneSheet), /réponse inattendue du CDF.*Libéralités/);
  const oddCampaign = fixture(33);
  oddCampaign[0].rows.get(2)?.set("H", "Campagne de soutien");
  assert.throws(() => readFinancing(oddCampaign), /réponse inattendue du CDF.*Campagne de soutien/);
  const mixed = fixture(33);
  mixed[1].rows.get(2)?.set("L", "Nom");
  assert.throws(() => readFinancing(mixed), /réponse inattendue du CDF.*libéralité 4651/);
});

test("readFinancing counts and leaves out a declaration other than the budget", () => {
  const sheets = fixture(33);
  const budget = sheets[0].rows.get(2) ?? new Map();
  sheets[0].rows.set(8, new Map([...budget, ["I", "9999"], ["J", "Déclaration des recettes définitives"], ["K", "1.0"]]));
  const item = readFinancing(sheets);
  assert.equal(item?.campaigns.length, 6);
  assert.equal(item?.left_out, 1);
});

test("readFinancing gives null when the export holds no budget declaration", () => {
  const sheets = fixture(35);
  for (const s of sheets) for (const r of [...s.rows.keys()]) if (r > 1) s.rows.delete(r);
  assert.equal(readFinancing(sheets), null);
});
