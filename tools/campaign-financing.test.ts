/*
 * Tests of `npm run campaign-financing` (tools/campaign-financing.ts, PRD-0001 US-28), on the CDF exports of items 33
 * and 35 recorded on 2026-11-19 (tools/fixtures/). The network and the disk are replaced. Run: npm test.
 */
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { DATA_FILES, type Ballot, type BallotItem, type CampaignFinancingFile, type Removal } from "../src/types.ts";
import { DISCLAIMER_KEY, exportUrl, runCampaignFinancing, SOURCE_PAGE, TRANSLATIONS, TREE } from "./campaign-financing.ts";
import { checkFinancing, readFinancing, removalOf } from "./financing.ts";
import { fingerprint } from "./media.ts";
import { checkFile, Report } from "./schema.ts";
import { readWorkbook } from "./xlsx.ts";

const EXPORTS: Record<number, Buffer> = {
  33: readFileSync(new URL("./fixtures/cdf-financing-33.xlsx", import.meta.url)),
  35: readFileSync(new URL("./fixtures/cdf-financing-35.xlsx", import.meta.url)),
};
const DISCLAIMER = "Le CDF souligne qu'il publie les données telles qu'elles lui ont été transmises.";

function item(id: string, financingId: number | null): BallotItem {
  return { id, short: id, title: id, question: "?", yes: "", no: "", federal_council: null, url: "https://www.admin.ch/", parties: {}, financing_id: financingId };
}
function ballot(...items: BallotItem[]): Ballot {
  return { date: "2026-11-29", label: "", voting_material: "", page: "https://www.admin.ch/", brochure: "https://www.admin.ch/", items, cantons: {}, sources: [] };
}
const BALLOT = ballot(item("avs", 33), item("couples", 35));

type Answer = { status: number; body: Buffer | string };
/** A fake fetch: the two exports, the portal's translations and tree; `override` replaces an answer by URL. */
function fakeFetch(override: Record<string, Answer | Error> = {}): { fetch: typeof fetch; asked: string[] } {
  const asked: string[] = [];
  const answers: Record<string, Answer | Error> = {
    [exportUrl(33)]: { status: 200, body: EXPORTS[33] },
    [exportUrl(35)]: { status: 200, body: EXPORTS[35] },
    [TRANSLATIONS]: { status: 200, body: JSON.stringify({ data: { fr: { [DISCLAIMER_KEY]: DISCLAIMER } } }) },
    [TREE]: {
      status: 200,
      body: JSON.stringify({ data: { tree_roots: [{ id: 33, label: "29.11.2026 AVS" }, { id: 35, label: "29.11.2026 Couples" }, { id: 30, label: "28.09.2026 Autre" }] } }),
    },
    ...override,
  };
  const f = async (input: string | URL | Request) => {
    const url = String(input);
    asked.push(url);
    const a = answers[url];
    if (a === undefined) return new Response("introuvable", { status: 404 });
    if (a instanceof Error) throw a;
    return new Response(a.body, { status: a.status });
  };
  return { fetch: f as typeof fetch, asked };
}

function run(b: Ballot, removals: Removal[], override: Record<string, Answer | Error> = {}) {
  const writes: { path: string; content: string }[] = [];
  const lines: string[] = [];
  const { fetch, asked } = fakeFetch(override);
  const done = runCampaignFinancing(b, removals, "/data", {
    fetch,
    today: "2026-11-19",
    write: (path, content) => writes.push({ path, content }),
    log: (line) => lines.push(line),
  });
  return done.then((code) => ({ code, writes, lines, asked }));
}

/** The person who gave to item 35, read from the fixture, so that no name is written in this file. */
function personOf35(): { first_name: string; name: string } {
  const p = readFinancing(readWorkbook(EXPORTS[35]))?.donations.find((d) => d.donor.type === "person")?.donor;
  assert.ok(p && p.type === "person");
  return { first_name: p.first_name, name: p.name };
}

test("a run writes only data/campaign-financing.json, valid, with each item's request, the date and the CDF's disclaimer", async () => {
  const { code, writes, lines } = await run(BALLOT, []);
  assert.equal(code, 0, lines.join("\n"));
  assert.deepEqual(writes.map((w) => w.path), [`/data/${DATA_FILES.campaign_financing.file}`]);
  const file = JSON.parse(writes[0].content) as CampaignFinancingFile;
  const report = new Report();
  checkFile(file, DATA_FILES.campaign_financing.schema, "data/campaign-financing.json", report);
  assert.deepEqual(report.errors, []);
  const f = file.campaign_financing;
  assert.equal(f.source_page, SOURCE_PAGE);
  assert.equal(f.disclaimer, DISCLAIMER);
  assert.equal(f.retrieved_on, "2026-11-19");
  assert.deepEqual(f.items.map((i) => [i.ballot_item, i.financing_id, i.request, i.declared_on]), [
    ["avs", 33, exportUrl(33), "2026-11-10"],
    ["couples", 35, exportUrl(35), "2026-11-10"],
  ]);
  assert.equal(f.items[0].donations.length, 13);
  assert.ok(lines.some((l) => /2 objets.*17 dons/.test(l)), lines.join("\n"));
});

test("a failed fetch or an unreadable export writes nothing and exits 2, saying « Rien écrit »", async () => {
  const failures: Record<string, Answer | Error>[] = [
    { [exportUrl(35)]: new Error("ECONNRESET") },
    { [exportUrl(33)]: { status: 503, body: "" } },
    { [exportUrl(33)]: { status: 200, body: "<html>maintenance</html>" } },
    { [TRANSLATIONS]: { status: 200, body: JSON.stringify({ data: { fr: {} } }) } },
  ];
  for (const override of failures) {
    const { code, writes, lines } = await run(BALLOT, [], override);
    assert.equal(code, 2, JSON.stringify(Object.keys(override)));
    assert.deepEqual(writes, []);
    assert.ok(lines.some((l) => /Rien écrit/.test(l)), lines.join("\n"));
  }
});

test("a ballot item without CDF id is reported and the run exits 1, the others written", async () => {
  const { code, writes, lines } = await run(ballot(item("avs", 33), item("feux", null)), []);
  assert.equal(code, 1);
  assert.equal(writes.length, 1);
  assert.ok(lines.some((l) => /feux/.test(l) && /financing_id/.test(l)), lines.join("\n"));
});

test("an item of the ballot's date on the portal that no ballot item names is a warning only; the portal's tree failing too", async () => {
  const one = await run(ballot(item("avs", 33)), []);
  assert.equal(one.code, 0);
  assert.ok(one.lines.some((l) => /35/.test(l) && /Couples/.test(l)), one.lines.join("\n"));
  assert.ok(!one.lines.some((l) => /Autre/.test(l)), "an item of another date is not reported");
  const noTree = await run(BALLOT, [], { [TREE]: { status: 500, body: "" } });
  assert.equal(noTree.code, 0);
  assert.equal(noTree.writes.length, 1);
  assert.ok(noTree.lines.some((l) => /arbre/.test(l)), noTree.lines.join("\n"));
});

test("a removal turns the donor into « removed », keeping the value and the receiver, and no printed line holds the name", async () => {
  const person = personOf35();
  for (const written of [`${person.first_name} ${person.name}`, `${person.name} ${person.first_name}`]) {
    const removal: Removal = { fingerprint: fingerprint(written), date: "2026-11-19", reason: "person_request" };
    const { code, writes, lines } = await run(BALLOT, [removal]);
    assert.equal(code, 0);
    const content = writes[0].content;
    assert.ok(!content.includes(person.name), "the name is gone from the file");
    const couples = (JSON.parse(content) as CampaignFinancingFile).campaign_financing.items[1];
    const removed = couples.donations.filter((d) => d.donor.type === "removed");
    assert.equal(removed.length, 1);
    assert.equal(removed[0].value, 150000);
    assert.equal(removed[0].actor_id, 242);
    assert.ok(lines.some((l) => /1 donateur retiré/.test(l)), lines.join("\n"));
    for (const l of lines) assert.ok(!l.includes(person.name), "no printed line holds the name");
  }
});

/* ---------- Removal on request, end to end (increment 09) ---------- */

/** The fingerprint as the maintainer computes it: the name on the standard input of `node tools/cli.ts media-fingerprint`. */
function maintainerFingerprint(name: string): string {
  const r = spawnSync(process.execPath, [fileURLToPath(new URL("./cli.ts", import.meta.url)), "media-fingerprint"], { input: name, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}

test("a removal recorded with media-fingerprint is applied by the command, and the check passes on the result", async () => {
  const person = personOf35();
  const removal: Removal = { fingerprint: maintainerFingerprint(`${person.first_name} ${person.name}`), date: "2026-11-19", reason: "person_request" };
  const { code, writes } = await run(BALLOT, [removal]);
  assert.equal(code, 0);
  const f = (JSON.parse(writes[0].content) as CampaignFinancingFile).campaign_financing;
  assert.ok(!writes[0].content.includes(person.name));
  assert.deepEqual(checkFinancing(f, BALLOT, [removal]), []);
});

test("a removed donor cannot come back by hand, as a person or as a company, and the check never prints the name", async () => {
  const person = personOf35();
  const written = `${person.first_name} ${person.name}`;
  const removal: Removal = { fingerprint: fingerprint(written), date: "2026-11-19", reason: "person_request" };
  const f = (JSON.parse((await run(BALLOT, [removal])).writes[0].content) as CampaignFinancingFile).campaign_financing;
  const removed = f.items[1].donations.find((d) => d.donor.type === "removed");
  assert.ok(removed);
  for (const donor of [{ type: "person" as const, first_name: person.first_name, name: person.name }, { type: "company" as const, name: written }]) {
    removed.donor = donor;
    const errors = checkFinancing(f, BALLOT, [removal]);
    assert.equal(errors.length, 1, `${donor.type} : ${errors.length} erreur(s)`);
    assert.ok(errors[0].includes(removal.fingerprint.slice(0, 12)));
    assert.ok(!errors[0].includes(person.name), "the check does not print the name");
  }
});

test("a removed name the CDF lists as a company is removed by the command too", async () => {
  const person = personOf35();
  const sheets = readWorkbook(EXPORTS[35]);
  const row = [...sheets[1].rows.entries()].find(([r, cells]) => r > 1 && cells.get("L"))?.[1];
  assert.ok(row);
  row.set("P", `${person.first_name} ${person.name}`);
  row.delete("L");
  row.delete("M");
  const item = readFinancing(sheets);
  assert.ok(item);
  const removal: Removal = { fingerprint: fingerprint(`${person.first_name} ${person.name}`), date: "2026-11-19", reason: "person_request" };
  const donor = item.donations.find((d) => d.donor.type === "company" && d.donor.name.includes(person.name))?.donor;
  assert.ok(donor);
  assert.ok(removalOf(donor, new Set([removal.fingerprint])), "a company named after a removed person matches the removal");
});
