/*
 * Tests of the campaign financing data (PRD-0001 US-26 to US-28, Plan-0001-financing). Run: npm test.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DATA_FILES, type CampaignFinancingFile } from "../src/types.ts";
import { checkFile, Report } from "./schema.ts";

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
