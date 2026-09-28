import "server-only";
import { catalogDb, storeDb } from "@/lib/db";
import { applyProductEdit, deleteProduct, insertCustomProduct, refreshToyInfo, type CustomProduct, type ProductEdit } from "@/lib/catalog-write";
import type { Audience, InfoSource } from "@/lib/toy-info";
import { searchMatchSql } from "@/lib/search";
import { categoryLabel } from "@/lib/categories";

export type AdminProductRow = {
  id: number;
  sku: string;
  ean: string | null;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  /** Name of the subcategory (or category), as edited in Admin → Категории. */
  categoryLabel: string;
  ageMin: number | null;
  audience: Audience;
  price: number;
  oldPrice: number | null;
  stock: number;
  hidden: boolean;
  image: string | null;
  adminEdited: boolean;
  custom: boolean;
  demoPrice: boolean;
};

export type AdminProduct = AdminProductRow & {
  images: string[];
  description: string | null;
  color: string | null;
  pieces: number | null;
  canRestore: boolean;
  ageMin: number | null;
  ageMax: number | null;
  audience: Audience;
  warnings: string[];
  batch: string | null;
  passport: string | null;
  /** Where age / audience / warnings came from: estimated ("name", "rule", "category") or set by the admin. */
  toySource: { age: InfoSource | null; audience: InfoSource | null; warnings: InfoSource | null };
};

type Raw = {
  id: number;
  sku: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  price: number;
  old_price: number | null;
  stock: number;
  hidden: number;
  image: string | null;
  admin_edited: number;
  custom: number;
  demo_price: number;
  ean: string | null;
  images: string;
  description: string | null;
  color: string | null;
  pieces: number | null;
  age_min?: number | null;
  age_max?: number | null;
  age_source?: string | null;
  audience?: string;
  audience_source?: string | null;
  warnings?: string;
  warnings_source?: string | null;
  batch?: string | null;
  passport?: string | null;
};

const COLS =
  "p.id, p.sku, p.ean, p.slug, p.name, p.brand, p.category, p.subcategory, p.price, p.old_price, p.stock, p.hidden, p.image, p.admin_edited, p.custom, p.demo_price, p.age_min, p.audience";

function toRow(r: Raw): AdminProductRow {
  return {
    id: r.id,
    sku: r.sku,
    ean: r.ean,
    slug: r.slug,
    name: r.name,
    brand: r.brand,
    category: r.category,
    subcategory: r.subcategory,
    categoryLabel: categoryLabel(r.category, r.subcategory),
    ageMin: r.age_min ?? null,
    audience: (r.audience === "boys" || r.audience === "girls" ? r.audience : "all") as Audience,
    price: r.price,
    oldPrice: r.old_price,
    stock: r.stock,
    hidden: !!r.hidden,
    image: r.image,
    adminEdited: !!r.admin_edited,
    custom: !!r.custom,
    demoPrice: !!r.demo_price,
  };
}

export const ADMIN_FILTERS = {
  all: "Всички",
  visible: "Показани в сайта",
  hidden: "Скрити",
  sale: "В промоция",
  out: "Изчерпани",
  edited: "Редактирани от мен",
  custom: "Добавени ръчно",
  noage: "Без посочена възраст",
  agecheck: "Възраст по категория (за проверка)",
} as const;
export type AdminFilter = keyof typeof ADMIN_FILTERS;

export const ADMIN_SORTS = {
  name: "Име (А–Я)",
  "price-asc": "Цена ↑",
  "price-desc": "Цена ↓",
  "stock-desc": "Наличност ↓",
  newest: "Най-нови",
} as const;
export type AdminSort = keyof typeof ADMIN_SORTS;

export const ADMIN_PER_PAGE = 40;

type AdminQuery = { q: string; category: string; filter: AdminFilter };

/** FROM / WHERE for the admin product search (shared by the list and "move all found"). */
function adminQuery(opts: AdminQuery) {
  const where: string[] = [];
  const params: unknown[] = [];
  let from = "products p";
  let cteParams: unknown[] = [];
  let cte = "";
  // Name, brand, SKU or barcode (whole or any part); exact SKU / barcode matches are listed first.
  const m = opts.q.trim() ? searchMatchSql(opts.q, { admin: true }) : null;
  if (m) {
    cte = `WITH m AS (${m.sql}) `;
    from += " JOIN m ON m.id = p.id";
    cteParams = m.params;
  }
  if (opts.category) {
    where.push("(p.category = ? OR p.subcategory = ?)");
    params.push(opts.category, opts.category);
  }
  switch (opts.filter) {
    case "visible":
      where.push("p.hidden = 0");
      break;
    case "hidden":
      where.push("p.hidden = 1");
      break;
    case "sale":
      where.push("p.old_price IS NOT NULL");
      break;
    case "out":
      where.push("p.stock <= 0");
      break;
    case "edited":
      where.push("p.admin_edited = 1");
      break;
    case "custom":
      where.push("p.custom = 1");
      break;
    case "noage":
      where.push("p.age_min IS NULL");
      break;
    case "agecheck":
      where.push("p.age_source = 'category'");
      break;
  }
  return { cte, from, whereSql: where.length ? ` WHERE ${where.join(" AND ")}` : "", params: [...cteParams, ...params], searched: !!m };
}

/** SKUs of every product the admin search finds (all pages). */
export function adminProductSkus(opts: AdminQuery): string[] {
  const { cte, from, whereSql, params } = adminQuery(opts);
  return (catalogDb().prepare(`${cte}SELECT p.sku FROM ${from}${whereSql}`).all(...params) as { sku: string }[]).map((r) => r.sku);
}

export function listAdminProducts(opts: AdminQuery & { sort: AdminSort; page: number }) {
  const db = catalogDb();
  const { cte, from, whereSql, params: all, searched } = adminQuery(opts);
  const order = (searched ? "m.exact DESC, " : "") + {
    name: "p.name COLLATE NOCASE",
    "price-asc": "p.price ASC",
    "price-desc": "p.price DESC",
    "stock-desc": "p.stock DESC",
    newest: "p.id DESC",
  }[opts.sort];
  const total = (db.prepare(`${cte}SELECT COUNT(*) AS n FROM ${from}${whereSql}`).get(...all) as { n: number }).n;
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PER_PAGE));
  const page = Math.min(Math.max(1, opts.page), pageCount);
  const items = (
    db.prepare(`${cte}SELECT ${COLS} FROM ${from}${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...all, ADMIN_PER_PAGE, (page - 1) * ADMIN_PER_PAGE) as Raw[]
  ).map(toRow);
  return { items, total, page, pageCount };
}

export function getAdminProduct(id: number): AdminProduct | null {
  const r = catalogDb()
    .prepare(
      `SELECT ${COLS}, p.images, p.description, p.color, p.pieces, p.age_min, p.age_max, p.age_source, p.audience, p.audience_source,
         p.warnings, p.warnings_source, p.batch, p.passport FROM products p WHERE p.id = ?`,
    )
    .get(id) as Raw | undefined;
  if (!r) return null;
  let images: string[] = [];
  try {
    images = JSON.parse(r.images);
  } catch {
    images = r.image ? [r.image] : [];
  }
  const edit = storeDb().prepare("SELECT custom, original FROM product_edits WHERE sku = ?").get(r.sku) as
    | { custom: number; original: string | null }
    | undefined;
  return {
    ...toRow(r),
    images,
    description: r.description,
    color: r.color,
    pieces: r.pieces,
    canRestore: !!edit && !edit.custom && !!edit.original,
    ageMin: r.age_min ?? null,
    ageMax: r.age_max ?? null,
    audience: (r.audience === "boys" || r.audience === "girls" ? r.audience : "all") as Audience,
    warnings: parseList(r.warnings),
    batch: r.batch ?? null,
    passport: r.passport ?? null,
    toySource: { age: (r.age_source ?? null) as InfoSource | null, audience: (r.audience_source ?? null) as InfoSource | null, warnings: (r.warnings_source ?? null) as InfoSource | null },
  };
}

export function getProductIdBySku(sku: string): number | null {
  return (catalogDb().prepare("SELECT id FROM products WHERE sku = ?").get(sku) as { id: number } | undefined)?.id ?? null;
}

// ---------------------------------------------------------------------------
// Writes. Every change is applied to the catalogue *and* recorded in store.db so it
// survives the next CSV import.

const FIELD_COLUMNS: Record<keyof ProductEdit, string> = {
  name: "name",
  brand: "brand",
  category: "category",
  subcategory: "subcategory",
  ean: "ean",
  price: "price",
  oldPrice: "old_price",
  stock: "stock",
  hidden: "hidden",
  images: "images",
  description: "description",
  color: "color",
  pieces: "pieces",
  ageMin: "age_min",
  ageMax: "age_max",
  audience: "audience",
  warnings: "warnings",
  batch: "batch",
  passport: "passport",
};

function parseList(v: unknown): string[] {
  try {
    const a = typeof v === "string" ? JSON.parse(v) : [];
    return Array.isArray(a) ? a.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function currentValues(sku: string, keys: (keyof ProductEdit)[]): Record<string, unknown> {
  const row = catalogDb().prepare("SELECT * FROM products WHERE sku = ?").get(sku) as Record<string, unknown> | undefined;
  if (!row) return {};
  const out: Record<string, unknown> = { __demoPrice: row.demo_price };
  for (const k of keys) {
    const v = row[FIELD_COLUMNS[k]];
    if (k === "hidden") out[k] = !!v;
    else if (k === "images") out[k] = typeof v === "string" ? JSON.parse(v) : [];
    else if (k === "warnings") out[k] = parseList(v);
    else out[k] = v;
  }
  return out;
}

const recordStmt = () =>
  storeDb().prepare(
    `INSERT INTO product_edits (sku, custom, data, original, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(sku) DO UPDATE SET data = excluded.data, original = excluded.original, updated_at = excluded.updated_at`,
  );

/** Apply edits to many products at once (bulk price tools). Returns how many were changed. */
export function saveProductEdits(changes: { sku: string; edit: ProductEdit }[]): number {
  const cat = catalogDb();
  const store = storeDb();
  const existing = store.prepare("SELECT custom, data, original FROM product_edits WHERE sku = ?");
  const record = recordStmt();
  const now = new Date().toISOString();
  const recorded: { sku: string; custom: number; data: string; original: string | null }[] = [];
  let changed = 0;

  cat.transaction(() => {
    for (const { sku, edit } of changes) {
      const keys = Object.keys(edit) as (keyof ProductEdit)[];
      if (!keys.length) continue;
      const prev = existing.get(sku) as { custom: number; data: string; original: string | null } | undefined;
      const original = prev?.original ? JSON.parse(prev.original) : {};
      if (!prev?.custom) {
        const missing = keys.filter((k) => !(k in original));
        if (missing.length) Object.assign(original, currentValues(sku, missing), "__demoPrice" in original ? { __demoPrice: original.__demoPrice } : {});
      }
      // Text/brand/category changes need the search index and hero tags updated.
      const reindex = keys.some((k) => k === "name" || k === "brand" || k === "ean");
      if (!applyProductEdit(cat, sku, edit, { reindex })) continue;
      changed++;
      const data = { ...(prev ? JSON.parse(prev.data) : {}), ...edit };
      recorded.push({ sku, custom: prev?.custom ?? 0, data: JSON.stringify(data), original: prev?.custom ? null : JSON.stringify(original) });
    }
  })();
  store.transaction(() => {
    for (const r of recorded) record.run(r.sku, r.custom, r.data, r.original, now);
  })();
  return changed;
}

export function saveProductEdit(sku: string, edit: ProductEdit): boolean {
  return saveProductEdits([{ sku, edit }]) === 1;
}

/** Undo every admin change to a CSV product. */
export function restoreProduct(sku: string): boolean {
  const store = storeDb();
  const row = store.prepare("SELECT custom, original FROM product_edits WHERE sku = ?").get(sku) as { custom: number; original: string | null } | undefined;
  if (!row || row.custom || !row.original) return false;
  const original = JSON.parse(row.original) as ProductEdit & { __demoPrice?: number };
  const { __demoPrice, ...values } = original;
  const cat = catalogDb();
  cat.transaction(() => {
    applyProductEdit(cat, sku, values, { reindex: true });
    cat.prepare("UPDATE products SET admin_edited = 0, demo_price = ? WHERE sku = ?").run(__demoPrice ?? 0, sku);
    // Back to the automatic age / audience / warnings.
    const id = (cat.prepare("SELECT id FROM products WHERE sku = ?").get(sku) as { id: number }).id;
    cat.prepare("UPDATE products SET age_source = NULL, audience_source = NULL, warnings_source = NULL WHERE id = ?").run(id);
    refreshToyInfo(cat, [id]);
  })();
  store.prepare("DELETE FROM product_edits WHERE sku = ?").run(sku);
  return true;
}

export function nextCustomSku(): string {
  const rows = catalogDb().prepare("SELECT sku FROM products WHERE sku LIKE 'DT-%'").all() as { sku: string }[];
  const max = rows.reduce((m, r) => Math.max(m, parseInt(r.sku.slice(3), 10) || 0), 0);
  return `DT-${String(max + 1).padStart(5, "0")}`;
}

export function createProduct(p: Omit<CustomProduct, "created">): { id: number; sku: string } {
  const sku = nextCustomSku();
  const full: CustomProduct = { ...p, created: new Date().toISOString() };
  const id = insertCustomProduct(catalogDb(), sku, full);
  storeDb()
    .prepare("INSERT INTO product_edits (sku, custom, data, original, updated_at) VALUES (?, 1, ?, NULL, ?)")
    .run(sku, JSON.stringify(full), full.created);
  return { id, sku };
}

/** Only products added in the admin panel can be deleted (CSV products would come back on import — hide them instead). */
export function deleteCustomProduct(sku: string): boolean {
  const row = storeDb().prepare("SELECT custom FROM product_edits WHERE sku = ?").get(sku) as { custom: number } | undefined;
  if (!row?.custom) return false;
  deleteProduct(catalogDb(), sku);
  storeDb().prepare("DELETE FROM product_edits WHERE sku = ?").run(sku);
  return true;
}

export type ProductInfo = { sku: string; slug: string; name: string; image: string | null; price: number; stock: number; hidden: boolean; category: string };

/** Short product info by SKU (hidden products included), for admin pickers. */
export function productInfosBySku(skus: string[]): Record<string, ProductInfo> {
  const clean = [...new Set(skus)].slice(0, 2000);
  if (!clean.length) return {};
  const rows = catalogDb()
    .prepare(`SELECT sku, slug, name, image, price, stock, hidden, category FROM products WHERE sku IN (${clean.map(() => "?").join(",")})`)
    .all(...clean) as (Omit<ProductInfo, "hidden"> & { hidden: number })[];
  return Object.fromEntries(rows.map((r) => [r.sku, { ...r, hidden: !!r.hidden }]));
}

export function brandNames(): string[] {
  return (catalogDb().prepare("SELECT name FROM brands ORDER BY name COLLATE NOCASE").all() as { name: string }[]).map((r) => r.name);
}

/** Forget the admin's age / audience / warnings for a product and estimate them again. */
export function resetToyInfo(sku: string) {
  const cat = catalogDb();
  const row = cat.prepare("SELECT id FROM products WHERE sku = ?").get(sku) as { id: number } | undefined;
  if (!row) return;
  cat.prepare("UPDATE products SET age_source = NULL, audience_source = NULL, warnings_source = NULL WHERE id = ?").run(row.id);
  refreshToyInfo(cat, [row.id]);
  const store = storeDb();
  const edit = store.prepare("SELECT custom, data, original FROM product_edits WHERE sku = ?").get(sku) as
    | { custom: number; data: string; original: string | null }
    | undefined;
  if (!edit) return;
  const data = JSON.parse(edit.data) as Record<string, unknown>;
  for (const k of ["ageMin", "ageMax", "audience", "warnings"]) delete data[k];
  store.prepare("UPDATE product_edits SET data = ?, updated_at = ? WHERE sku = ?").run(JSON.stringify(data), new Date().toISOString(), sku);
}
