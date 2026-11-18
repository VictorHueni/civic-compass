/*
 * Tests of the register check (tools/media-register.ts, PRD-0001 US-25), on an answer of the Zefix linked data
 * (lindas.admin.ch) recorded once on 2026-11-18 for the 42 UIDs of data/media.json: tools/fixtures/. Run: npm test.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { compare, readAnswer, registerQuery, requestUrl, type RegisterEntry, type Registered, ENDPOINT } from "./media-register.ts";

const ANSWER = JSON.parse(readFileSync(new URL("./fixtures/lindas-media-register.json", import.meta.url), "utf8")) as unknown;

test("registerQuery asks the register for each UID by its value, with the legal name, the legal form in French and the seat", () => {
  const q = registerQuery(["CHE-103.365.013", "CHE-105.836.696"]);
  assert.match(q, /VALUES \?uid \{ "CHE103365013" "CHE105836696" \}/);
  assert.match(q, /schema:legalName/);
  assert.match(q, /lang\(\?form\) = "fr"/);
  assert.ok(requestUrl(["CHE-103.365.013"]).startsWith(ENDPOINT + "?query="));
  assert.ok(decodeURIComponent(requestUrl(["CHE-103.365.013"])).includes('"CHE103365013"'));
});

test("readAnswer reads one entry per UID, the UID written as the register writes it", () => {
  const entries = readAnswer(ANSWER);
  assert.equal(entries.length, 42);
  assert.deepEqual(
    entries.find((e) => e.uid === "CHE-103.365.013"),
    { uid: "CHE-103.365.013", name: "TV LEMAN BLEU SA", legal_form: "Société anonyme", seat: "Carouge (GE)" },
  );
  assert.equal(entries.find((e) => e.uid === "CHE-396.664.102")?.legal_form, "Succursale suisse inscrite au registre du commerce");
});

test("readAnswer refuses an answer that is not a SPARQL result", () => {
  assert.throws(() => readAnswer({}), /réponse inattendue/);
  assert.throws(() => readAnswer({ results: { bindings: [{ name: { value: "X" } }] } }), /réponse inattendue/);
});

const leman: Registered = { id: "tv_leman_bleu", name: "TV LEMAN BLEU SA", legal_form: "SA", seat: "Carouge (GE)", uid: "CHE-103.365.013" };

test("compare says nothing for a company that matches the register, nor for an entry without UID", () => {
  assert.deepEqual(compare([leman, { id: "no_uid", name: "Rhône Médias SA", legal_form: "SA", seat: null, uid: null }], readAnswer(ANSWER)), []);
});

test("compare reads the register's legal forms as the file writes them: SA, société coopérative, association, fondation, succursale", () => {
  const forms: Registered[] = [
    { id: "pomona", name: "pomona media partner genossenschaft", legal_form: "société coopérative", seat: "Visp", uid: "CHE-359.118.195" },
    { id: "ssr", name: "Schweizerische Radio- und Fernsehgesellschaft", legal_form: "association", seat: "Bern", uid: "CHE-102.978.667" },
    { id: "aventinus", name: "Fondation Aventinus", legal_form: "fondation", seat: "Genève", uid: "CHE-298.602.703" },
    { id: "rts", name: "RTS Radio Télévision Suisse, succursale de la Société suisse de radiodiffusion et télévision", legal_form: "succursale", seat: "Ecublens (VD)", uid: "CHE-396.664.102" },
  ];
  assert.deepEqual(compare(forms, readAnswer(ANSWER)), []);
});

test("compare reports a different name, legal form or seat, naming both values", () => {
  const changed: Registered = { ...leman, name: "TV Léman Bleu SA", legal_form: "Sàrl", seat: "Genève" };
  const report = compare([changed], readAnswer(ANSWER));
  assert.deepEqual(report, [
    "tv_leman_bleu (CHE-103.365.013) : nom « TV Léman Bleu SA » dans le fichier, « TV LEMAN BLEU SA » au registre",
    "tv_leman_bleu (CHE-103.365.013) : forme « Sàrl » dans le fichier, « Société anonyme » au registre",
    "tv_leman_bleu (CHE-103.365.013) : siège « Genève » dans le fichier, « Carouge (GE) » au registre",
  ]);
});

test("compare reports a company in liquidation, and a UID the register does not list (deleted, or a wrong UID)", () => {
  const entries: RegisterEntry[] = [...readAnswer(ANSWER), { uid: "CHE-999.999.991", name: "Fermée SA en liquidation", legal_form: "Société anonyme", seat: "Sion" }];
  const report = compare(
    [
      { id: "closing", name: "Fermée SA en liquidation", legal_form: "SA", seat: "Sion", uid: "CHE-999.999.991" },
      { id: "gone", name: "Partie SA", legal_form: "SA", seat: "Sion", uid: "CHE-999.999.992" },
    ],
    entries,
  );
  assert.deepEqual(report, [
    "closing (CHE-999.999.991) : en liquidation selon le registre",
    "gone (CHE-999.999.992) : absente du registre (radiée, ou IDE erroné) ; le registre lié ne garde que les sociétés actives",
  ]);
});
