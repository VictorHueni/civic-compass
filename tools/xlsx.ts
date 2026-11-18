/*
 * A small xlsx reader written with Node's built-ins only (owner ruling 5 of Research-0002: no new
 * dependency; a library only if this reader meets a case it cannot handle).
 *
 * It reads what the OFS tables need: the zip container (stored or deflated entries, no zip64, no
 * encryption), the sheet list, shared and inline strings, and each cell's text as written in the
 * file (a number stays the text of its <v>, a formula gives its cached value); the shared strings
 * part may be absent when every text is inline. Styles, dates and
 * merged cells are ignored. Anything else it does not understand makes it throw, never guess.
 */
import { crc32, inflateRawSync } from "node:zlib";

const LOCAL_HEADER = 0x04034b50;
const CENTRAL_HEADER = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY = 0x06054b50;

/** Every entry of a zip archive, by name, decompressed and checked against its CRC. */
export function unzip(buf: Buffer): Map<string, Buffer> {
  // The end record sits in the last 22 bytes, plus a comment of up to 65535 bytes.
  let end = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === END_OF_CENTRAL_DIRECTORY) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error("fichier zip illisible : fin de répertoire introuvable");
  const count = buf.readUInt16LE(end + 10);
  let at = buf.readUInt32LE(end + 16);
  if (count === 0xffff || at === 0xffffffff) throw new Error("fichier zip64 non pris en charge");

  const files = new Map<string, Buffer>();
  for (let n = 0; n < count; n++) {
    if (at + 46 > buf.length || buf.readUInt32LE(at) !== CENTRAL_HEADER) throw new Error(`fichier zip illisible : entrée ${n + 1} du répertoire`);
    const flags = buf.readUInt16LE(at + 8);
    const method = buf.readUInt16LE(at + 10);
    const crc = buf.readUInt32LE(at + 16);
    const compressedSize = buf.readUInt32LE(at + 20);
    const size = buf.readUInt32LE(at + 24);
    const nameLength = buf.readUInt16LE(at + 28);
    const extraLength = buf.readUInt16LE(at + 30);
    const commentLength = buf.readUInt16LE(at + 32);
    const localAt = buf.readUInt32LE(at + 42);
    const name = buf.toString(flags & 0x0800 ? "utf8" : "latin1", at + 46, at + 46 + nameLength);
    at += 46 + nameLength + extraLength + commentLength;

    if (flags & 0x0001) throw new Error(`fichier zip chiffré non pris en charge (${name})`);
    if (buf.readUInt32LE(localAt) !== LOCAL_HEADER) throw new Error(`fichier zip illisible : en-tête local de ${name}`);
    const dataAt = localAt + 30 + buf.readUInt16LE(localAt + 26) + buf.readUInt16LE(localAt + 28);
    const data = buf.subarray(dataAt, dataAt + compressedSize);
    let content: Buffer;
    if (method === 0) content = Buffer.from(data);
    else if (method === 8) content = inflateRawSync(data);
    else throw new Error(`méthode de compression ${method} non prise en charge (${name})`);
    if (content.length !== size || crc32(content) !== crc) throw new Error(`fichier zip corrompu : taille ou CRC de ${name}`);
    files.set(name, content);
  }
  return files;
}

/** One sheet: row number -> column letters -> the cell's text. Cells without a value are absent. */
export interface Sheet {
  name: string;
  rows: Map<number, Map<string, string>>;
}

function decode(xml: string): string {
  return xml.replace(/&(?:#x([0-9a-fA-F]+)|#(\d+)|(amp|lt|gt|quot|apos));/g, (_, hex: string, dec: string, named: string) => {
    if (hex) return String.fromCodePoint(parseInt(hex, 16));
    if (dec) return String.fromCodePoint(parseInt(dec, 10));
    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[named as "amp"];
  });
}

function attr(tag: string, name: string): string | undefined {
  const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return m ? decode(m[1]) : undefined;
}

/** Text of a string item (<si> or <is>): plain or rich text runs joined, phonetic runs left out. */
function stringItem(xml: string): string {
  const visible = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "");
  return [...visible.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1])).join("");
}

function part(files: Map<string, Buffer>, path: string): string {
  const content = files.get(path);
  if (!content) throw new Error(`classeur xlsx illisible : partie ${path} absente`);
  return content.toString("utf8");
}

/** Every sheet of the workbook, in the workbook's order. */
export function readWorkbook(buf: Buffer): Sheet[] {
  const files = unzip(buf);
  const targets = new Map<string, { type: string; path: string }>();
  for (const [tag] of part(files, "xl/_rels/workbook.xml.rels").matchAll(/<Relationship\s[^>]*>/g)) {
    const target = attr(tag, "Target") ?? "";
    const path = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
    targets.set(attr(tag, "Id") ?? "", { type: (attr(tag, "Type") ?? "").split("/").pop() ?? "", path });
  }
  // The shared strings part is optional (a workbook may keep every text inline, as the Federal Audit Office's
  // exports do); once the relationships declare it, it must be there.
  const declared = [...targets.values()].find((t) => t.type === "sharedStrings")?.path;
  const sharedPath = declared ?? "xl/sharedStrings.xml";
  const sharedXml = declared || files.has(sharedPath) ? part(files, sharedPath) : "";
  const shared = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>|<si\/>/g)].map((m) => stringItem(m[1] ?? ""));

  return [...part(files, "xl/workbook.xml").matchAll(/<sheet\s[^>]*>/g)].map(([tag]) => {
    const name = attr(tag, "name") ?? "";
    const target = targets.get(attr(tag, "r:id") ?? "");
    if (!target) throw new Error(`classeur xlsx illisible : feuille « ${name} » sans cible`);
    return { name, rows: readSheet(part(files, target.path), shared) };
  });
}

function readSheet(xml: string, shared: string[]): Sheet["rows"] {
  const rows: Sheet["rows"] = new Map();
  for (const m of xml.matchAll(/<c(\s[^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const tag = m[1];
    const body = m[2] ?? "";
    const ref = /^([A-Z]+)(\d+)$/.exec(attr(tag, "r") ?? "");
    if (!ref) throw new Error(`feuille xlsx illisible : cellule sans référence (${tag.trim()})`);
    const type = attr(tag, "t") ?? "n";
    let text: string | undefined;
    if (type === "inlineStr") {
      const is = /<is>([\s\S]*?)<\/is>/.exec(body);
      text = is ? stringItem(is[1]) : undefined;
    } else {
      const v = /<v>([\s\S]*?)<\/v>/.exec(body);
      if (v) {
        text = decode(v[1]);
        if (type === "s") {
          const s = shared[Number(text)];
          if (s === undefined) throw new Error(`feuille xlsx illisible : texte partagé ${text} absent (${ref[0]})`);
          text = s;
        }
      }
    }
    if (text === undefined) continue;
    const row = Number(ref[2]);
    if (!rows.has(row)) rows.set(row, new Map());
    rows.get(row)?.set(ref[1], text);
  }
  return rows;
}
