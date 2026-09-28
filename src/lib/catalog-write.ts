// Writes to the catalogue DB. Shared by the admin panel and the CSV importer, so no Next-only imports.
import type Database from "better-sqlite3";
import { SERIES, detectSeries, generalizeCategory } from "./taxonomy";
import { slugify } from "./slug";
import { inferAge, inferAudience, inferWarnings } from "./toy-infer";
import type { Audience } from "./toy-info";

type DB = Database.Database;

/** Age, "for whom" and safety columns (also created by the importer). */
export const TOY_INFO_COLUMNS: [string, string][] = [
  ["age_min", "INTEGER"],
  ["age_max", "INTEGER"],
  ["age_source", "TEXT"],
  ["audience", "TEXT NOT NULL DEFAULT 'all'"],
  ["audience_source", "TEXT"],
  ["warnings", "TEXT NOT NULL DEFAULT '[]'"],
  ["warnings_source", "TEXT"],
  ["batch", "TEXT"],
  ["passport", "TEXT"],
];

/** Bump when the category structure or the age / audience / warning rules change. */
export const CATALOG_STRUCTURE_REV = 2;

/**
 * Columns added after the first release; older catalogue files get them on open. Also moves products into
 * the current category structure and fills in age / audience / warnings once. Returns true if products changed
 * (the caller then refreshes the category counts).
 */
export function ensureCatalogSchema(db: DB): boolean {
  if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'products'").get()) return false;
  const readRev = () =>
    Number((db.prepare("SELECT value FROM meta WHERE key = 'structure_rev'").get() as { value: string } | undefined)?.value ?? 0);
  const upToDate = () => {
    const cols = new Set((db.prepare("PRAGMA table_info(products)").all() as { name: string }[]).map((c) => c.name));
    const hasMeta = !!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'meta'").get();
    return TOY_INFO_COLUMNS.every(([c]) => cols.has(c)) && cols.has("custom") && hasMeta && readRev() >= CATALOG_STRUCTURE_REV;
  };
  if (upToDate()) return false;
  // Several processes (e.g. a production build) may open the file at once: the first one migrates, the others
  // wait for its lock and then find everything done.
  const timeout = db.pragma("busy_timeout", { simple: true }) as number;
  db.pragma("busy_timeout = 120000");
  try {
    return db.transaction(() => {
      const cols = new Set((db.prepare("PRAGMA table_info(products)").all() as { name: string }[]).map((c) => c.name));
      const add = (name: string, def: string) => {
        if (!cols.has(name)) db.exec(`ALTER TABLE products ADD COLUMN ${name} ${def}`);
      };
      add("hidden", "INTEGER NOT NULL DEFAULT 0");
      add("description", "TEXT");
      add("demo_price", "INTEGER NOT NULL DEFAULT 0");
      add("admin_edited", "INTEGER NOT NULL DEFAULT 0");
      add("custom", "INTEGER NOT NULL DEFAULT 0");
      for (const [name, def] of TOY_INFO_COLUMNS) add(name, def);
      db.exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)");
      if (readRev() >= CATALOG_STRUCTURE_REV) return false;
      const move = db.prepare("UPDATE products SET category = ?, subcategory = ? WHERE id = ?");
      for (const r of db.prepare("SELECT id, category, subcategory FROM products").all() as { id: number; category: string; subcategory: string | null }[]) {
        const g = generalizeCategory(r.category, r.subcategory);
        if (g.category !== r.category || g.sub !== r.subcategory) move.run(g.category, g.sub, r.id);
      }
      refreshToyInfo(db);
      db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('structure_rev', ?)").run(String(CATALOG_STRUCTURE_REV));
      return true;
    }).immediate();
  } finally {
    db.pragma(`busy_timeout = ${Number(timeout) || 5000}`);
  }
}

type InfoRow = {
  id: number;
  name: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  age_min: number | null;
  age_source: string | null;
  audience_source: string | null;
  warnings_source: string | null;
};

/**
 * (Re)estimate age, audience and warnings from the name, brand and category — for all products or the given ids.
 * Values the admin set (source "admin") are kept.
 */
export function refreshToyInfo(db: DB, ids?: number[]) {
  const where = ids ? `WHERE id IN (${ids.map(() => "?").join(",") || "NULL"})` : "";
  const rows = db
    .prepare(`SELECT id, name, brand, category, subcategory, age_min, age_source, audience_source, warnings_source FROM products ${where}`)
    .all(...(ids ?? [])) as InfoRow[];
  const setAge = db.prepare("UPDATE products SET age_min = ?, age_max = ?, age_source = ? WHERE id = ?");
  const setAudience = db.prepare("UPDATE products SET audience = ?, audience_source = ? WHERE id = ?");
  const setWarnings = db.prepare("UPDATE products SET warnings = ?, warnings_source = ? WHERE id = ?");
  for (const r of rows) {
    const facts = { name: r.name, brand: r.brand, category: r.category, subcategory: r.subcategory };
    let ageMin = r.age_min;
    if (r.age_source !== "admin") {
      const age = inferAge(facts);
      ageMin = age.min;
      setAge.run(age.min, age.max, age.source, r.id);
    }
    if (r.audience_source !== "admin") {
      const a = inferAudience(facts);
      setAudience.run(a.audience, a.source, r.id);
    }
    if (r.warnings_source !== "admin") setWarnings.run(JSON.stringify(inferWarnings(facts, ageMin)), "rule", r.id);
  }
}

/** Fields an admin can change. A key that is present (even with null) is applied. */
export type ProductEdit = Partial<{
  name: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  ean: string | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  hidden: boolean;
  images: string[];
  description: string | null;
  color: string | null;
  pieces: number | null;
  /** Months; null = unknown / no upper limit. */
  ageMin: number | null;
  ageMax: number | null;
  audience: Audience;
  warnings: string[];
  batch: string | null;
  passport: string | null;
}>;

export type CustomProduct = {
  name: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  ean: string | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  hidden: boolean;
  images: string[];
  description: string | null;
  color: string | null;
  pieces: number | null;
  created: string;
  /** Only when the admin set them; otherwise estimated from the name and category. */
  ageMin?: number | null;
  ageMax?: number | null;
  audience?: Audience;
  warnings?: string[];
  batch?: string | null;
  passport?: string | null;
};

const TOY_KEYS = ["ageMin", "ageMax", "audience", "warnings", "batch", "passport"] as const;

type Row = {
  id: number;
  sku: string;
  name: string;
  brand: string | null;
  ean: string | null;
  stock: number;
  popularity: number;
};

function reindex(db: DB, old: Pick<Row, "id" | "name" | "brand" | "sku" | "ean"> | null, id: number) {
  const now = db.prepare("SELECT id, name, brand, sku, ean FROM products WHERE id = ?").get(id) as Row | undefined;
  const hasFts = db.prepare("SELECT 1 FROM sqlite_master WHERE name = 'products_fts'").get();
  if (hasFts) {
    if (old) {
      db.prepare("INSERT INTO products_fts (products_fts, rowid, name, brand, sku, ean) VALUES ('delete', ?, ?, ?, ?, ?)").run(
        old.id,
        old.name,
        old.brand,
        old.sku,
        old.ean,
      );
    }
    if (now) db.prepare("INSERT INTO products_fts (rowid, name, brand, sku, ean) VALUES (?, ?, ?, ?, ?)").run(now.id, now.name, now.brand, now.sku, now.ean);
  }
  db.prepare("DELETE FROM product_series WHERE product_id = ?").run(id);
  if (now) {
    const ins = db.prepare("INSERT OR IGNORE INTO product_series (product_id, series) VALUES (?, ?)");
    for (const s of detectSeries(now.name, now.brand ?? "")) ins.run(id, s);
  }
}

function stockBoost(stock: number) {
  return stock > 0 ? 1000 : 0;
}

/** Apply an edit to a product identified by SKU. Returns false if the SKU isn't in the catalogue. */
export function applyProductEdit(db: DB, sku: string, edit: ProductEdit, opts: { reindex?: boolean } = {}): boolean {
  const old = db.prepare("SELECT id, sku, name, brand, ean, stock, popularity FROM products WHERE sku = ?").get(sku) as Row | undefined;
  if (!old) return false;
  const sets: string[] = [];
  const vals: unknown[] = [];
  const set = (col: string, v: unknown) => {
    sets.push(`${col} = ?`);
    vals.push(v);
  };
  if (edit.name !== undefined) set("name", edit.name);
  if (edit.brand !== undefined) {
    const brand = edit.brand?.trim() || null;
    set("brand", brand);
    set("brand_slug", brand ? slugify(brand) : null);
  }
  if (edit.category !== undefined || edit.subcategory !== undefined) {
    // Edits saved before the categories were regrouped are moved into today's structure.
    const cur = db.prepare("SELECT category, subcategory FROM products WHERE id = ?").get(old.id) as { category: string; subcategory: string | null };
    const g = generalizeCategory(edit.category ?? cur.category, edit.subcategory !== undefined ? edit.subcategory : cur.subcategory);
    set("category", g.category);
    set("subcategory", g.sub);
  }
  if (edit.ageMin !== undefined || edit.ageMax !== undefined) {
    if (edit.ageMin !== undefined) set("age_min", edit.ageMin);
    if (edit.ageMax !== undefined) set("age_max", edit.ageMax);
    set("age_source", "admin");
  }
  if (edit.audience !== undefined) {
    set("audience", edit.audience);
    set("audience_source", "admin");
  }
  if (edit.warnings !== undefined) {
    set("warnings", JSON.stringify(edit.warnings));
    set("warnings_source", "admin");
  }
  if (edit.batch !== undefined) set("batch", edit.batch);
  if (edit.passport !== undefined) set("passport", edit.passport);
  if (edit.ean !== undefined) set("ean", edit.ean);
  if (edit.price !== undefined) {
    set("price", edit.price);
    set("demo_price", 0);
  }
  if (edit.oldPrice !== undefined) set("old_price", edit.oldPrice);
  if (edit.stock !== undefined) {
    set("stock", edit.stock);
    set("popularity", old.popularity - stockBoost(old.stock) + stockBoost(edit.stock));
  }
  if (edit.hidden !== undefined) set("hidden", edit.hidden ? 1 : 0);
  if (edit.images !== undefined) {
    set("images", JSON.stringify(edit.images));
    set("image", edit.images[0] ?? null);
  }
  if (edit.description !== undefined) set("description", edit.description);
  if (edit.color !== undefined) set("color", edit.color);
  if (edit.pieces !== undefined) set("pieces", edit.pieces);
  if (!sets.length) return true;
  set("admin_edited", 1);
  db.prepare(`UPDATE products SET ${sets.join(", ")} WHERE id = ?`).run(...vals, old.id);
  if (opts.reindex !== false) reindex(db, old, old.id);
  // A new name / brand / category can change the estimated age, audience and warnings.
  if (["name", "brand", "category", "subcategory", "ageMin"].some((k) => k in edit)) refreshToyInfo(db, [old.id]);
  return true;
}

/** Insert a product created in the admin panel (not from the CSV). Returns its id. */
export function insertCustomProduct(db: DB, sku: string, p: CustomProduct, opts: { reindex?: boolean; id?: number } = {}): number {
  let slug = `${slugify(p.name, 70)}-${slugify(sku)}`;
  while (db.prepare("SELECT 1 FROM products WHERE slug = ?").get(slug)) slug += "-x";
  const brand = p.brand?.trim() || null;
  const info = db
    .prepare(
      `INSERT INTO products (id, sku, slug, name, brand, brand_slug, category, subcategory, ean, price, old_price, stock,
        color, pieces, image, images, source_category, created, popularity, hidden, description, demo_price, admin_edited, custom)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', ?, ?, ?, ?, 0, 1, 1)`,
    )
    .run(
      opts.id ?? null,
      sku,
      slug,
      p.name,
      brand,
      brand ? slugify(brand) : null,
      p.category,
      p.subcategory,
      p.ean,
      p.price,
      p.oldPrice,
      p.stock,
      p.color,
      p.pieces,
      p.images[0] ?? null,
      JSON.stringify(p.images),
      p.created,
      stockBoost(p.stock) + 300,
      p.hidden ? 1 : 0,
      p.description,
    );
  const id = Number(info.lastInsertRowid);
  if (opts.reindex !== false) reindex(db, null, id);
  refreshToyInfo(db, [id]);
  const toy = Object.fromEntries(TOY_KEYS.filter((k) => p[k] !== undefined).map((k) => [k, p[k]])) as ProductEdit;
  if (Object.keys(toy).length) applyProductEdit(db, sku, toy, { reindex: false });
  return id;
}

export function deleteProduct(db: DB, sku: string): boolean {
  const old = db.prepare("SELECT id, sku, name, brand, ean FROM products WHERE sku = ?").get(sku) as Row | undefined;
  if (!old) return false;
  db.prepare("INSERT INTO products_fts (products_fts, rowid, name, brand, sku, ean) VALUES ('delete', ?, ?, ?, ?, ?)").run(old.id, old.name, old.brand, old.sku, old.ean);
  db.prepare("DELETE FROM product_series WHERE product_id = ?").run(old.id);
  db.prepare("DELETE FROM products WHERE id = ?").run(old.id);
  return true;
}

export type AggregateCategory = { slug: string; name: string; subs: { slug: string; name: string }[] };

/** Recompute category/brand/hero counts and tile pictures (visible products only), for the categories in menu order. */
export function refreshAggregates(db: DB, categories: AggregateCategory[]) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (slug TEXT PRIMARY KEY, parent TEXT, name TEXT NOT NULL, position INTEGER, count INTEGER, in_stock INTEGER, image TEXT);
    CREATE TABLE IF NOT EXISTS brands (slug TEXT PRIMARY KEY, name TEXT NOT NULL, count INTEGER, in_stock INTEGER);
    CREATE TABLE IF NOT EXISTS series (slug TEXT PRIMARY KEY, name TEXT NOT NULL, position INTEGER, count INTEGER, image TEXT);
  `);
  const run = db.transaction(() => {
    db.exec("DELETE FROM categories; DELETE FROM brands; DELETE FROM series;");
    const catInsert = db.prepare("INSERT INTO categories (slug, parent, name, position, count, in_stock, image) VALUES (?, ?, ?, ?, ?, ?, ?)");
    const countCat = db.prepare("SELECT COUNT(*) AS n, SUM(stock > 0) AS s FROM products WHERE hidden = 0 AND category = ?");
    const countSub = db.prepare("SELECT COUNT(*) AS n, SUM(stock > 0) AS s FROM products WHERE hidden = 0 AND category = ? AND subcategory = ?");
    const imgCat = db.prepare(
      "SELECT image FROM products WHERE hidden = 0 AND category = ? AND stock > 0 AND image IS NOT NULL ORDER BY popularity DESC LIMIT 1",
    );
    const imgSub = db.prepare(
      "SELECT image FROM products WHERE hidden = 0 AND category = ? AND subcategory = ? AND stock > 0 AND image IS NOT NULL ORDER BY popularity DESC LIMIT 1",
    );
    categories.forEach((c, i) => {
      const r = countCat.get(c.slug) as { n: number; s: number | null };
      catInsert.run(c.slug, null, c.name, i, r.n, r.s ?? 0, (imgCat.get(c.slug) as { image: string } | undefined)?.image ?? null);
      c.subs.forEach((s, j) => {
        const rs = countSub.get(c.slug, s.slug) as { n: number; s: number | null };
        catInsert.run(s.slug, c.slug, s.name, j, rs.n, rs.s ?? 0, (imgSub.get(c.slug, s.slug) as { image: string } | undefined)?.image ?? null);
      });
    });
    db.exec(`
      INSERT INTO brands (slug, name, count, in_stock)
        SELECT brand_slug, MIN(brand), COUNT(*), SUM(stock > 0) FROM products
        WHERE hidden = 0 AND brand_slug IS NOT NULL AND brand_slug <> '' GROUP BY brand_slug;
    `);
    const seriesInsert = db.prepare("INSERT INTO series (slug, name, position, count, image) VALUES (?, ?, ?, ?, ?)");
    const seriesStats = db.prepare(
      `SELECT COUNT(*) AS n,
         (SELECT p2.image FROM product_series s2 JOIN products p2 ON p2.id = s2.product_id
           WHERE s2.series = ? AND p2.stock > 0 AND p2.hidden = 0 ORDER BY p2.popularity DESC LIMIT 1) AS image
       FROM product_series ps JOIN products p ON p.id = ps.product_id WHERE ps.series = ? AND p.hidden = 0`,
    );
    SERIES.forEach((s, i) => {
      const r = seriesStats.get(s.slug, s.slug) as { n: number; image: string | null };
      if (r.n > 0) seriesInsert.run(s.slug, s.name, i, r.n, r.image);
    });
  });
  run();
}
