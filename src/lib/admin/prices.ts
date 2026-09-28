import "server-only";
import { randomBytes } from "node:crypto";
import ExcelJS from "exceljs";
import { parse as parseCsv } from "csv-parse/sync";
import { catalogDb, storeDb } from "@/lib/db";
import { categoryLabel } from "@/lib/categories";
import { barcodeKey } from "@/lib/search";
import type { ProductEdit } from "@/lib/catalog-write";
import { parseCount, parseMoney } from "./validate";
import { saveProductEdits } from "./products";

// ---------------------------------------------------------------------------
// Download

type ExportRow = { sku: string; name: string; brand: string | null; category: string; price: number; old_price: number | null; stock: number };

function exportRows(category: string): ExportRow[] {
  const where = category ? "WHERE category = ? OR subcategory = ?" : "";
  return catalogDb()
    .prepare(`SELECT sku, name, brand, category, price, old_price, stock FROM products ${where} ORDER BY category, name COLLATE NOCASE`)
    .all(...(category ? [category, category] : [])) as ExportRow[];
}

const HEADERS = ["Код", "Име", "Марка", "Категория", "Цена (€)", "Стара цена (€)", "Наличност (бр.)"];

export async function exportPricesXlsx(category: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Цени", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: HEADERS[0], key: "sku", width: 18 },
    { header: HEADERS[1], key: "name", width: 60 },
    { header: HEADERS[2], key: "brand", width: 18 },
    { header: HEADERS[3], key: "category", width: 26 },
    { header: HEADERS[4], key: "price", width: 12, style: { numFmt: "0.00" } },
    { header: HEADERS[5], key: "old_price", width: 16, style: { numFmt: "0.00" } },
    { header: HEADERS[6], key: "stock", width: 16 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF4D1" } };
  for (const r of exportRows(category)) {
    ws.addRow({ ...r, category: categoryLabel(r.category) });
  }
  const help = wb.addWorksheet("Как се попълва");
  help.getColumn(1).width = 110;
  [
    "Как да промените цените с този файл:",
    "1. Променете колоните „Цена (€)“, „Стара цена (€)“ и/или „Наличност (бр.)“. Не променяйте колоната „Код“.",
    "2. „Стара цена“ е цената преди намаление. Попълнете я само ако продуктът е в промоция — тя трябва да е по-висока от „Цена“.",
    "   Ако изтриете старата цена, промоцията се спира.",
    "3. Можете да изтриете редовете, които не променяте — те остават както са.",
    "4. Запазете файла и го качете в админ панела → Цени → „Качи файл“. Ще видите какво ще се промени, преди да потвърдите.",
    "Колоните „Име“, „Марка“ и „Категория“ са само за ориентация — промени в тях не се взимат предвид.",
  ].forEach((t, i) => {
    const row = help.addRow([t]);
    if (i === 0) row.font = { bold: true, size: 13 };
  });
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export function exportPricesCsv(category: string): Buffer {
  const esc = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const money = (n: number | null) => (n == null ? "" : n.toFixed(2).replace(".", ","));
  const lines = [HEADERS.join(";")];
  for (const r of exportRows(category)) {
    lines.push(
      [r.sku, esc(r.name), esc(r.brand ?? ""), esc(categoryLabel(r.category)), money(r.price), money(r.old_price), String(r.stock)].join(";"),
    );
  }
  // BOM so Excel opens Cyrillic correctly; ";" + decimal comma match Bulgarian Excel.
  return Buffer.from("﻿" + lines.join("\r\n"), "utf8");
}

// ---------------------------------------------------------------------------
// Upload

type ParsedRow = { line: number; sku: string; ean: string; price: string; oldPrice: string; stock: string };
type Columns = { sku: number; ean: number; price: number; oldPrice: number; stock: number };

const HEADER_ALIASES: Record<keyof Columns, string[]> = {
  sku: ["код", "sku", "код sku", "артикул", "артикулен номер", "product code"],
  ean: ["ean", "баркод", "баркод ean", "barcode"],
  price: ["цена", "price", "нова цена", "продажна цена", "цена с ддс"],
  oldPrice: ["стара цена", "old price", "old_price", "цена преди намаление", "compare at price"],
  stock: ["наличност", "stock", "количество", "бройки", "наличност бр", "inventory"],
};

function normHeader(h: string): string {
  return h
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[€.:_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findColumns(header: string[]): Columns | null {
  const cols: Columns = { sku: -1, ean: -1, price: -1, oldPrice: -1, stock: -1 };
  header.forEach((h, i) => {
    const n = normHeader(h);
    for (const key of Object.keys(HEADER_ALIASES) as (keyof Columns)[]) {
      if (cols[key] === -1 && HEADER_ALIASES[key].includes(n)) cols[key] = i;
    }
  });
  if (cols.sku === -1 && cols.ean === -1) return null;
  if (cols.price === -1 && cols.oldPrice === -1 && cols.stock === -1) return null;
  return cols;
}

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v.trim();
  if (typeof v === "boolean") return v ? "1" : "0";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    if ("result" in v && v.result != null) return cellText(v.result as ExcelJS.CellValue);
    if ("richText" in v) return v.richText.map((t) => t.text).join("").trim();
    if ("text" in v) return String(v.text).trim();
  }
  return String(v).trim();
}

async function readTable(buf: Buffer, filename: string): Promise<string[][]> {
  if (/\.xlsx$/i.test(filename) || buf.subarray(0, 2).toString("ascii") === "PK") {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    if (!ws) return [];
    const rows: string[][] = [];
    ws.eachRow({ includeEmpty: true }, (row) => {
      const values = row.values as ExcelJS.CellValue[];
      rows.push(values.slice(1).map(cellText));
    });
    return rows;
  }
  const text = buf.toString("utf8").replace(/^﻿/, "");
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [";", "\t", ","].sort((a, b) => first.split(b).length - first.split(a).length)[0];
  return parseCsv(text, { delimiter, relax_column_count: true, relax_quotes: true, skip_empty_lines: false }) as string[][];
}

export type PricePreview = {
  id: string | null;
  totalRows: number;
  changed: number;
  unchanged: number;
  unmatched: string[];
  unmatchedCount: number;
  errors: { line: number; message: string }[];
  samples: { sku: string; name: string; before: string; after: string }[];
};

type StoredChange = { sku: string; edit: ProductEdit };

export async function previewPriceFile(buf: Buffer, filename: string): Promise<PricePreview | { error: string }> {
  let table: string[][];
  try {
    table = await readTable(buf, filename);
  } catch {
    return { error: "Файлът не може да бъде прочетен. Качете .xlsx (Excel) или .csv файл." };
  }
  const headerIndex = table.slice(0, 10).findIndex((r) => findColumns(r));
  if (headerIndex === -1) {
    return { error: "Не намерихме колони „Код“ и „Цена“. Използвайте файла от бутона „Изтегли цените“ и не променяйте заглавията." };
  }
  const cols = findColumns(table[headerIndex])!;
  const rows: ParsedRow[] = [];
  table.slice(headerIndex + 1).forEach((r, i) => {
    const get = (c: number) => (c >= 0 ? (r[c] ?? "").trim() : "");
    const row = { line: headerIndex + i + 2, sku: get(cols.sku), ean: get(cols.ean), price: get(cols.price), oldPrice: get(cols.oldPrice), stock: get(cols.stock) };
    if (row.sku || row.ean) rows.push(row);
  });

  // SKUs match whatever the letter case; barcodes match even when Excel has dropped their leading zeros.
  type Match = { sku: string; ean: string | null; name: string; price: number; old_price: number | null; stock: number };
  const all = catalogDb().prepare("SELECT sku, ean, name, price, old_price, stock FROM products").all() as Match[];
  const bySku = new Map(all.map((p) => [p.sku.toLowerCase(), p]));
  const byEan = new Map(all.filter((p) => p.ean && barcodeKey(p.ean)).map((p) => [barcodeKey(p.ean!), p]));
  const fmt = (n: number | null) => (n == null ? "—" : n.toFixed(2).replace(".", ",") + " €");

  const preview: PricePreview = { id: null, totalRows: rows.length, changed: 0, unchanged: 0, unmatched: [], unmatchedCount: 0, errors: [], samples: [] };
  const changes: StoredChange[] = [];
  const seen = new Set<string>();

  for (const r of rows) {
    const p = (r.sku && bySku.get(r.sku.toLowerCase())) || (r.ean && byEan.get(barcodeKey(r.ean))) || undefined;
    if (!p) {
      preview.unmatchedCount++;
      if (preview.unmatched.length < 20) preview.unmatched.push(r.sku || r.ean);
      continue;
    }
    if (seen.has(p.sku)) continue;
    seen.add(p.sku);
    const edit: ProductEdit = {};
    let price = p.price;
    if (cols.price >= 0 && r.price) {
      const v = parseMoney(r.price);
      if (v == null || v <= 0) {
        preview.errors.push({ line: r.line, message: `Ред ${r.line}: невалидна цена „${r.price}“` });
        continue;
      }
      price = v;
      if (v !== p.price) edit.price = v;
    }
    if (cols.oldPrice >= 0) {
      const v = r.oldPrice ? parseMoney(r.oldPrice) : null;
      if (r.oldPrice && v == null) {
        preview.errors.push({ line: r.line, message: `Ред ${r.line}: невалидна стара цена „${r.oldPrice}“` });
        continue;
      }
      if (v != null && v <= price) {
        preview.errors.push({ line: r.line, message: `Ред ${r.line}: старата цена (${fmt(v)}) трябва да е по-висока от цената (${fmt(price)})` });
        continue;
      }
      if (v !== p.old_price) edit.oldPrice = v;
    }
    if (cols.stock >= 0 && r.stock) {
      const v = parseCount(r.stock);
      if (v == null || v < 0) {
        preview.errors.push({ line: r.line, message: `Ред ${r.line}: невалидна наличност „${r.stock}“` });
        continue;
      }
      if (v !== p.stock) edit.stock = v;
    }
    if (!Object.keys(edit).length) {
      preview.unchanged++;
      continue;
    }
    changes.push({ sku: p.sku, edit });
    if (preview.samples.length < 30) {
      const before = [`${fmt(p.price)}${p.old_price ? ` (стара ${fmt(p.old_price)})` : ""}`, `${p.stock} бр.`];
      const after = [
        `${fmt(edit.price ?? p.price)}${(edit.oldPrice !== undefined ? edit.oldPrice : p.old_price) ? ` (стара ${fmt((edit.oldPrice !== undefined ? edit.oldPrice : p.old_price) ?? null)})` : ""}`,
        `${edit.stock ?? p.stock} бр.`,
      ];
      preview.samples.push({ sku: p.sku, name: p.name, before: before.join(" · "), after: after.join(" · ") });
    }
  }
  preview.errors = preview.errors.slice(0, 30);
  preview.changed = changes.length;
  if (changes.length) {
    const store = storeDb();
    store.prepare("DELETE FROM price_imports WHERE created_at < ?").run(new Date(Date.now() - 24 * 3600_000).toISOString());
    const id = randomBytes(12).toString("hex");
    store.prepare("INSERT INTO price_imports (id, created_at, data) VALUES (?, ?, ?)").run(id, new Date().toISOString(), JSON.stringify(changes));
    preview.id = id;
  }
  return preview;
}

export function applyPriceImport(id: string): number | null {
  const store = storeDb();
  const row = store.prepare("SELECT data FROM price_imports WHERE id = ?").get(id) as { data: string } | undefined;
  if (!row) return null;
  const changed = saveProductEdits(JSON.parse(row.data) as StoredChange[]);
  store.prepare("DELETE FROM price_imports WHERE id = ?").run(id);
  return changed;
}

// ---------------------------------------------------------------------------
// Percentage changes and promotions

export type BulkInput = {
  scope: "all" | "category" | "brand";
  value: string;
  action: "increase" | "decrease" | "sale" | "endSale";
  percent: number;
  round99: boolean;
};

export const BULK_ACTIONS: Record<BulkInput["action"], string> = {
  increase: "Увеличи цените с %",
  decrease: "Намали цените с %",
  sale: "Пусни промоция (-%)",
  endSale: "Спри промоцията",
};

function roundPrice(x: number, round99: boolean): number {
  if (round99 && x >= 1) return Math.max(0.99, Math.round(x) - 0.01);
  return Math.max(0.01, Math.round(x * 100) / 100);
}

function bulkChanges(input: BulkInput): { changes: StoredChange[]; samples: { name: string; before: string; after: string }[]; skipped: number } {
  const where: string[] = [];
  const params: unknown[] = [];
  if (input.scope === "category" && input.value) {
    where.push("(category = ? OR subcategory = ?)");
    params.push(input.value, input.value);
  } else if (input.scope === "brand" && input.value) {
    where.push("brand = ? COLLATE NOCASE");
    params.push(input.value);
  }
  const rows = catalogDb()
    .prepare(`SELECT sku, name, price, old_price FROM products ${where.length ? "WHERE " + where.join(" AND ") : ""}`)
    .all(...params) as { sku: string; name: string; price: number; old_price: number | null }[];
  const pct = Math.min(90, Math.max(0, input.percent)) / 100;
  const fmt = (n: number | null) => (n == null ? "" : n.toFixed(2).replace(".", ",") + " €");
  const changes: StoredChange[] = [];
  const samples: { name: string; before: string; after: string }[] = [];
  let skipped = 0;
  for (const r of rows) {
    let price = r.price;
    let oldPrice = r.old_price;
    switch (input.action) {
      case "increase":
      case "decrease": {
        const f = input.action === "increase" ? 1 + pct : 1 - pct;
        price = roundPrice(r.price * f, input.round99);
        oldPrice = r.old_price != null ? roundPrice(r.old_price * f, input.round99) : null;
        if (oldPrice != null && oldPrice <= price) oldPrice = null;
        break;
      }
      case "sale":
        if (r.old_price != null) {
          skipped++;
          continue;
        }
        oldPrice = r.price;
        price = roundPrice(r.price * (1 - pct), input.round99);
        if (price >= oldPrice) {
          skipped++;
          continue;
        }
        break;
      case "endSale":
        if (r.old_price == null) continue;
        price = r.old_price;
        oldPrice = null;
        break;
    }
    const edit: ProductEdit = {};
    if (price !== r.price) edit.price = price;
    if (oldPrice !== r.old_price) edit.oldPrice = oldPrice;
    if (!Object.keys(edit).length) continue;
    changes.push({ sku: r.sku, edit });
    if (samples.length < 8) {
      samples.push({
        name: r.name,
        before: `${fmt(r.price)}${r.old_price ? ` (стара ${fmt(r.old_price)})` : ""}`,
        after: `${fmt(price)}${oldPrice ? ` (стара ${fmt(oldPrice)})` : ""}`,
      });
    }
  }
  return { changes, samples, skipped };
}

export function previewBulk(input: BulkInput) {
  const { changes, samples, skipped } = bulkChanges(input);
  return { count: changes.length, samples, skipped };
}

export function applyBulk(input: BulkInput): number {
  return saveProductEdits(bulkChanges(input).changes);
}
