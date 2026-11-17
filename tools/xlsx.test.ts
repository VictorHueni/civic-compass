/*
 * Tests of the xlsx reader (tools/xlsx.ts). Run: npm test.
 * The workbooks are built here, byte by byte, so the tests need no file and no network.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { crc32, deflateRawSync } from "node:zlib";
import { readWorkbook, unzip } from "./xlsx.ts";

type Entry = { name: string; text: string; method?: 0 | 8 };

/** A zip archive with the given entries (stored or deflated), as Excel writes it: local headers, central directory, end record. */
function zip(entries: Entry[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const { name, text, method = 8 } of entries) {
    const raw = Buffer.from(text, "utf8");
    const data = method === 8 ? deflateRawSync(raw) : raw;
    const fileName = Buffer.from(name, "utf8");
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(crc32(raw), 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(fileName.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(crc32(raw), 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(fileName.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, fileName, data);
    centrals.push(central, fileName);
    offset += local.length + fileName.length + data.length;
  }
  const dir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, dir, end]);
}

const WORKBOOK = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="actuel (2021-2026)" sheetId="68" r:id="rId2"/><sheet name="ancien &amp; autre" sheetId="3" r:id="rId1"/></sheets></workbook>`;
const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet7.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="/xl/worksheets/sheet1.xml"/>
</Relationships>`;
const SHARED = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="4" uniqueCount="4">
<si><t>Genève </t></si>
<si><r><rPr><b/></rPr><t xml:space="preserve">PLR </t></r><r><t>2)</t></r><rPh sb="0" eb="1"><t>ignored</t></rPh></si>
<si><t>L&apos;UDC &amp; co &#233;&#x00E9; &lt;x&gt;</t></si>
<si><t/></si>
</sst>`;
const SHEET1 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:AB3"/><sheetData>
<row r="1" spans="1:3"><c r="A1" s="1" t="s"><v>0</v></c><c r="B1" s="2"/><c r="C1" t="s"><v>1</v></c></row>
<row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>22</v></c><c r="C2"><f>SUM(B2:B2)</f><v>22</v></c><c r="D2" t="str"><f>"a"&amp;"b"</f><v>ab</v></c></row>
<row r="3"><c r="AB3" t="inlineStr"><is><t>en ligne</t></is></c><c r="A3" t="s"><v>3</v></c><c r="B3" t="b"><v>1</v></c></row>
</sheetData><mergeCells count="1"><mergeCell ref="A3:B3"/></mergeCells></worksheet>`;
const SHEET7 = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData/></worksheet>`;

function workbook(method: 0 | 8 = 8): Buffer {
  return zip([
    { name: "[Content_Types].xml", text: "<Types/>", method },
    { name: "xl/workbook.xml", text: WORKBOOK, method },
    { name: "xl/_rels/workbook.xml.rels", text: RELS, method },
    { name: "xl/sharedStrings.xml", text: SHARED, method },
    { name: "xl/worksheets/sheet1.xml", text: SHEET1, method },
    { name: "xl/worksheets/sheet7.xml", text: SHEET7, method },
  ]);
}

test("unzip reads stored and deflated entries by name", () => {
  for (const method of [0, 8] as const) {
    const files = unzip(zip([{ name: "a/b.xml", text: "<é/>", method }, { name: "c.txt", text: "", method }]));
    assert.deepEqual([...files.keys()], ["a/b.xml", "c.txt"]);
    assert.equal(files.get("a/b.xml")?.toString("utf8"), "<é/>");
    assert.equal(files.get("c.txt")?.length, 0);
  }
});

test("unzip rejects what is not a zip, an unknown compression method and a corrupted entry", () => {
  assert.throws(() => unzip(Buffer.from("PK not really a zip")), /zip/);
  const odd = zip([{ name: "x", text: "abc", method: 0 }]);
  const centralAt = 30 + 1 + 3; // local header, name "x", data "abc"
  odd.writeUInt16LE(12, 8); // local header: bzip2
  odd.writeUInt16LE(12, centralAt + 10); // central header: bzip2
  assert.throws(() => unzip(odd), /compression/);
  const bad = zip([{ name: "x", text: "abc", method: 0 }]);
  bad[31] = 0x7a; // "abc" becomes "zbc": the CRC no longer matches
  assert.throws(() => unzip(bad), /CRC/);
});

test("readWorkbook lists the sheets in workbook order, with their names unescaped", () => {
  for (const method of [0, 8] as const) {
    const sheets = readWorkbook(workbook(method));
    assert.deepEqual(sheets.map((s) => s.name), ["actuel (2021-2026)", "ancien & autre"]);
    assert.equal(sheets[1].rows.size, 0);
  }
});

test("readWorkbook gives each cell's text by row number and column letters", () => {
  const sheet = readWorkbook(workbook())[0];
  assert.deepEqual([...sheet.rows.keys()], [1, 2, 3]);
  // Shared string kept unchanged (trailing space), rich text runs joined, phonetic runs left out, empty cell absent.
  assert.deepEqual(Object.fromEntries(sheet.rows.get(1) ?? []), { A: "Genève ", C: "PLR 2)" });
  // Entities decoded; numbers as written; a formula gives its cached value.
  assert.deepEqual(Object.fromEntries(sheet.rows.get(2) ?? []), { A: "L'UDC & co éé <x>", B: "22", C: "22", D: "ab" });
  // Inline string, empty shared string, boolean; columns beyond Z.
  assert.deepEqual(Object.fromEntries(sheet.rows.get(3) ?? []), { AB: "en ligne", A: "", B: "1" });
});

test("readWorkbook fails clearly when a part is missing", () => {
  const noShared = zip([
    { name: "xl/workbook.xml", text: WORKBOOK },
    { name: "xl/_rels/workbook.xml.rels", text: RELS },
    { name: "xl/worksheets/sheet1.xml", text: SHEET1 },
    { name: "xl/worksheets/sheet7.xml", text: SHEET7 },
  ]);
  assert.throws(() => readWorkbook(noShared), /sharedStrings/);
  const noSheet = zip([
    { name: "xl/workbook.xml", text: WORKBOOK },
    { name: "xl/_rels/workbook.xml.rels", text: RELS },
    { name: "xl/sharedStrings.xml", text: SHARED },
    { name: "xl/worksheets/sheet1.xml", text: SHEET1 },
  ]);
  assert.throws(() => readWorkbook(noSheet), /sheet7\.xml/);
});
