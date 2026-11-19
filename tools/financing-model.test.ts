/*
 * Tests of src/site/financing-model.ts (PRD-0001 US-26): what the step « Suivre l'argent » shows for a ballot item,
 * against the owner-approved mockup (artboard 1, item 33 AVS / TVA) and the generated data/campaign-financing.json.
 * Run: npm test.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { amount, chf, financingView, PRIVATE_DONOR } from "../src/site/financing-model.ts";
import type { CampaignFinancing, CampaignFinancingFile } from "../src/types.ts";

const NBSP = " ";
const REAL = (JSON.parse(readFileSync(new URL("../data/campaign-financing.json", import.meta.url), "utf8")) as CampaignFinancingFile).campaign_financing;
const copy = (): CampaignFinancing => structuredClone(REAL);

test("chf and amount write whole francs in groups of three, joined by no-break spaces", () => {
  assert.equal(chf(889590), `889${NBSP}590${NBSP}CHF`);
  assert.equal(chf(1128811.27), `1${NBSP}128${NBSP}811${NBSP}CHF`);
  assert.equal(amount(54221.27), `54${NBSP}221`);
  assert.equal(amount(0), "0");
  assert.equal(amount(15000), `15${NBSP}000`);
});

test("the view of item 33 gives each side's total and committees, sorted by amount, bars relative to the largest", () => {
  const v = financingView(REAL, "avs");
  assert.equal(v.state, "declared");
  if (v.state !== "declared") return;
  const [yes, no] = v.sides;
  assert.deepEqual([yes.side, Math.round(yes.total), yes.committees.length], ["yes", 581000, 2]);
  assert.deepEqual([no.side, Math.round(no.total), no.committees.length], ["no", 1128811, 4]);
  assert.deepEqual(
    yes.committees.map((c) => [c.actor, c.total, c.width]),
    [
      ["Sozialdemokratische Partei der Schweiz", 356000, 40],
      ["Union syndicale suisse (USS)", 225000, 25],
    ],
  );
  assert.deepEqual(
    no.committees.map((c) => [c.actor, c.width]),
    [
      ["PLR.Les Libéraux-Radicaux", 100],
      ["Union Démocratique du Centre (UDC)", 14],
      ["Centre Patronal", 7],
      ["Syndicat suisse des services publics (SSP)", 6],
    ],
  );
});

test("the donations of item 33 are grouped by receiving committee, a donor's gifts to one committee on one line", () => {
  const v = financingView(REAL, "avs");
  if (v.state !== "declared") return assert.fail(v.state);
  assert.deepEqual([v.donations.count, v.donations.total, v.donations.receivers], [13, 735000, 3]);
  assert.deepEqual(
    v.receivers.map((r) => [r.side, r.actor, r.total, r.count]),
    [
      ["yes", "Union syndicale suisse (USS)", 25000, 1],
      ["no", "PLR.Les Libéraux-Radicaux", 585000, 10],
      ["no", "Union Démocratique du Centre (UDC)", 125000, 2],
    ],
  );
  const plr = v.receivers[1].lines;
  assert.deepEqual(plr.slice(0, 3).map((l) => [l.donor, l.value, l.count]), [
    ["Aktionskomitee für Freiheit und Verantwortung", 250000, 1],
    ["Swiss Life AG", 75000, 2],
    ["Swissmem", 50000, 1],
  ]);
  // Equal amounts keep the CDF's order: the company before the person, both 25 000.
  assert.deepEqual(plr.slice(-2).map((l) => [l.value, l.person]), [
    [25000, false],
    [25000, true],
  ]);
  assert.deepEqual(v.without, ["Sozialdemokratische Partei der Schweiz", "Centre Patronal", "Syndicat suisse des services publics (SSP)"]);
  assert.deepEqual([v.declared_on, v.retrieved_on, v.disclaimer, v.source_page], [REAL.items[0].declared_on, REAL.retrieved_on, REAL.disclaimer, REAL.source_page]);
});

test("a person is shown by first name and name; a removed donor as « une personne privée », never grouped", () => {
  const f = copy();
  const v = financingView(f, "avs");
  if (v.state !== "declared") return assert.fail(v.state);
  const person = f.items[0].donations.find((d) => d.donor.type === "person")?.donor;
  assert.ok(person && person.type === "person");
  const line = v.receivers[1].lines.find((l) => l.person);
  assert.equal(line?.donor, `${person.first_name} ${person.name}`);

  const removed = copy();
  for (const d of removed.items[0].donations) if (d.donor.type === "company" && d.donor.name === "Swiss Life AG") d.donor = { type: "removed" };
  const r = financingView(removed, "avs");
  if (r.state !== "declared") return assert.fail(r.state);
  const privates = r.receivers.flatMap((x) => x.lines).filter((l) => l.donor === PRIVATE_DONOR);
  assert.equal(PRIVATE_DONOR, "une personne privée");
  assert.deepEqual(privates.map((l) => l.count), [1, 1, 1]);
  assert.ok(privates.every((l) => l.person));
});

test("an item the file does not hold says that the CDF published no declaration, with the retrieval date", () => {
  assert.deepEqual(financingView(REAL, "unknown"), { state: "none", retrieved_on: REAL.retrieved_on, source_page: REAL.source_page });
});
