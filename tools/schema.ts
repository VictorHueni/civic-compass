/*
 * Checks a data file against its schema in src/types.ts. Shared by tools/cli.ts (npm run check) and the tests,
 * which cannot import tools/cli.ts: it runs its command as soon as it is loaded.
 *
 * Messages are in French: the maintainers read them in French.
 */
import type { AnySchema, Rule } from "../src/types.ts";

export const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const URL_PATTERN = /^https?:\/\/\S+$/;

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
export function isRealDate(s: string): boolean {
  if (!DATE.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
export function show(v: unknown): string {
  return typeof v === "string" ? v : JSON.stringify(v);
}

/** Label of a list entry: its position from 1, and its id or code when it has one. */
export function entryLabel(item: unknown, i: number): string {
  const key = isPlainObject(item) ? (item.id ?? item.code) : undefined;
  return `entrée ${i + 1}` + (typeof key === "string" ? ` (${key})` : "");
}

export class Report {
  readonly errors: string[] = [];
  add(where: string[], message: string): void {
    const line = `${where.join(", ")} : ${message}`;
    if (!this.errors.includes(line)) this.errors.push(line);
  }
}

/** Checks `value` (the content of field `name`) against `rule`. */
export function checkValue(value: unknown, rule: Rule, name: string, where: string[], report: Report): void {
  if (value === null) {
    if (!rule.nullable) report.add(where, `« ${name} » ne peut pas être null`);
    return;
  }
  switch (rule.kind) {
    case "string":
      if (typeof value !== "string") report.add(where, `« ${name} » doit être un texte, trouvé ${show(value)}`);
      return;
    case "integer":
      if (!Number.isInteger(value)) report.add(where, `« ${name} » doit être un nombre entier, trouvé ${show(value)}`);
      return;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) report.add(where, `« ${name} » doit être un nombre, trouvé ${show(value)}`);
      return;
    case "date":
      if (typeof value !== "string" || !isRealDate(value)) report.add(where, `« ${name} » doit être une date AAAA-MM-JJ, trouvé ${show(value)}`);
      return;
    case "url":
      if (typeof value !== "string" || !URL_PATTERN.test(value)) report.add(where, `« ${name} » doit être une URL http(s), trouvé ${show(value)}`);
      return;
    case "enum":
      if (typeof value !== "string" || !rule.values.includes(value)) {
        report.add(where, `« ${name} » vaut ${show(value)} (attendu : ${rule.values.join(", ")})`);
      }
      return;
    case "list":
      if (!Array.isArray(value)) {
        report.add(where, `« ${name} » doit être une liste`);
        return;
      }
      value.forEach((item, i) => checkValue(item, rule.item, name, [...where, `${name} ${entryLabel(item, i)}`], report));
      return;
    case "object":
      if (!isPlainObject(value)) {
        report.add(where, `« ${name} » doit être un objet`);
        return;
      }
      checkObject(value, rule.schema, where, report);
      return;
    case "record":
      if (!isPlainObject(value)) {
        report.add(where, `« ${name} » doit être un objet`);
        return;
      }
      for (const [k, v] of Object.entries(value)) checkValue(v, rule.value, `${name}.${k}`, where, report);
      return;
    case "variant": {
      if (!isPlainObject(value)) {
        report.add(where, `« ${name} » doit être un objet`);
        return;
      }
      const tags = Object.keys(rule.schemas);
      const tag = value[rule.key];
      if (typeof tag !== "string" || !tags.includes(tag)) {
        report.add(where, `« ${name}.${rule.key} » vaut ${show(tag)} (attendu : ${tags.join(", ")})`);
        return;
      }
      const { [rule.key]: _, ...rest } = value;
      checkObject(rest, rule.schemas[tag], [...where, `${name} ${tag}`], report);
      return;
    }
  }
}

export function checkObject(value: Record<string, unknown>, schema: AnySchema, where: string[], report: Report): void {
  for (const [name, rule] of Object.entries(schema)) {
    if (!(name in value)) {
      if (!rule.optional) report.add(where, `champ « ${name} » manquant`);
      continue;
    }
    checkValue(value[name], rule, name, where, report);
  }
  for (const name of Object.keys(value)) {
    if (!(name in schema)) report.add(where, `champ « ${name} » inconnu (attendu : ${Object.keys(schema).join(", ")})`);
  }
}

/** Checks one data file against its schema. List entries of the top-level key are named "entrée N (id)". */
export function checkFile(content: unknown, schema: AnySchema, file: string, report: Report): void {
  if (!isPlainObject(content)) {
    report.add([file], "le fichier doit contenir un objet JSON");
    return;
  }
  const at = [file];
  for (const [name, rule] of Object.entries(schema)) {
    const value = content[name];
    if (!(name in content)) {
      if (!rule.optional) report.add(at, `champ « ${name} » manquant`);
    } else if (rule.kind === "list" && Array.isArray(value)) {
      value.forEach((item, i) => checkValue(item, rule.item, name, [file, entryLabel(item, i)], report));
    } else {
      checkValue(value, rule, name, at, report);
    }
  }
  for (const name of Object.keys(content)) {
    if (!(name in schema)) report.add(at, `champ « ${name} » inconnu (attendu : ${Object.keys(schema).join(", ")})`);
  }
}
