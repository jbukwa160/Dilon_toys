/**
 * Builds data/catalog.db from the Dilon product export.
 *
 *   npm run import -- [--csv "<path>"] [--prices data/prices.csv] [--include-no-image]
 *
 * Only toy categories are imported. The export has no prices, so prices come from
 * (in order): a Price/Цена column in the CSV, a prices file (sku,price,old_price),
 * or — as a last resort — deterministic placeholder prices, flagged in the DB so
 * the storefront shows a "demo prices" notice.
 */
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse";
import Database from "better-sqlite3";
import {
  CATEGORIES,
  brandKey,
  brandOverride,
  classify,
  detectSeries,
  extractPieces,
  isNoBrand,
  isUnsafeForKids,
} from "../src/lib/taxonomy";
import { slugify } from "../src/lib/slug";
import {
  CATALOG_STRUCTURE_REV,
  TOY_INFO_COLUMNS,
  applyProductEdit,
  insertCustomProduct,
  refreshAggregates,
  refreshToyInfo,
  type CustomProduct,
  type ProductEdit,
} from "../src/lib/catalog-write";
import { mergeCategories } from "../src/lib/category-config";

// ---------------------------------------------------------------------------
// CLI
const argv = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}
const ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.resolve(arg("csv") ?? path.join(ROOT, "..", "entire products_export (9).csv"));
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, "data");
const OUT_PATH = path.resolve(arg("out") ?? path.join(DATA_DIR, "catalog.db"));
const PRICES_PATH = arg("prices") ? path.resolve(arg("prices")!) : path.join(DATA_DIR, "prices.csv");
const INCLUDE_NO_IMAGE = argv.includes("--include-no-image");

// Source categories in the export that hold toys.
const TOY_SOURCES = new Set([
  "Toys & Games", "Играчки", "Puzzles & Board Games", "LEGO & Construction Sets",
  "Настолни игри, хоби и пъзели", "Model Kits & Hobby", "Pack - Toys & Games", "Toys", "Children's Toys",
  "Outdoor Toys", "Пъзели, хоби и пъзели", "Занимателни играчки", "Творчески комплект", "Дрънкалки",
  "Гризалки", "Тепихи за игра", "Триколки", "Тротинетки", "Баланс колела", "Играчки за баня",
]);
function isToySource(c: string): boolean {
  return TOY_SOURCES.has(c) || c.startsWith("Играчки") || c.includes("Бебешки играчки");
}

const ADULT_IMAGE_HOSTS = /sexwellshop\.|sexshop|eroti[ck]/i;

// ---------------------------------------------------------------------------
type Row = Record<string, string>;
type Draft = {
  sku: string;
  name: string;
  brandRaw: string;
  category: string;
  subcategory: string | null;
  series: string[];
  ean: string | null;
  stock: number;
  weight: number | null;
  height: number | null;
  length: number | null;
  width: number | null;
  color: string | null;
  pieces: number | null;
  images: string[];
  sourceCategory: string;
  created: string;
  updated: string;
  csvPrice: number | null;
  csvOldPrice: number | null;
};

function num(v: string | undefined): number | null {
  if (v == null) return null;
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function cleanName(s: string): string {
  return s.replace(/\s+/g, " ").replace(/\s+([,.])/g, "$1").trim();
}

function parseImages(raw: string): string[] {
  const urls = raw.match(/https?:\/\/[^\s"'\],]+/g) ?? [];
  const out: string[] = [];
  for (let u of urls) {
    u = u.replace(/^http:\/\//, "https://");
    if (/encrypted-tbn\d\.gstatic\.com/.test(u) && urls.length > 1) continue;
    if (!out.includes(u)) out.push(u);
  }
  return out;
}

const COLOR_BG: Record<string, string> = {
  multicolor: "Многоцветен", blue: "Син", pink: "Розов", red: "Червен", green: "Зелен", white: "Бял",
  black: "Черен", grey: "Сив", gray: "Сив", yellow: "Жълт", brown: "Кафяв", purple: "Лилав", orange: "Оранжев",
  beige: "Бежов", transparent: "Прозрачен", gold: "Златист", silver: "Сребрист", turquoise: "Тюркоазен",
};
function cleanColor(c: string): string | null {
  const t = c.trim();
  if (!t || t === "#N/A") return null;
  return COLOR_BG[t.toLowerCase()] ?? t;
}

// Deterministic 0..1 hash so placeholder prices are stable between imports.
function hash01(s: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

// ---------------------------------------------------------------------------
// Placeholder pricing (EUR). Only used when no real price is available.
type Profile = { min: number; max: number; base: number; perKg: number };
const PROFILES: Record<string, Profile> = {
  konstruktori: { min: 4.99, max: 249.99, base: 6, perKg: 38 },
  kukli: { min: 5.99, max: 129.99, base: 8, perKg: 22 },
  "prevozni-sredstva": { min: 3.99, max: 199.99, base: 5, perKg: 20 },
  figurki: { min: 3.99, max: 99.99, base: 6, perKg: 25 },
  plyusheni: { min: 4.99, max: 59.99, base: 7, perKg: 25 },
  pazeli: { min: 4.99, max: 59.99, base: 6, perKg: 14 },
  "nastolni-igri": { min: 7.99, max: 69.99, base: 10, perKg: 18 },
  tvorchestvo: { min: 4.99, max: 49.99, base: 7, perKg: 16 },
  obrazovatelni: { min: 5.99, max: 89.99, base: 9, perKg: 20 },
  bebeshki: { min: 3.99, max: 79.99, base: 6, perKg: 22 },
  "rolevi-igri": { min: 5.99, max: 149.99, base: 8, perKg: 12 },
  blasteri: { min: 5.99, max: 89.99, base: 8, perKg: 25 },
  muzikalni: { min: 5.99, max: 129.99, base: 9, perKg: 18 },
  interaktivni: { min: 7.99, max: 149.99, base: 12, perKg: 25 },
  "modeli-i-hobi": { min: 7.99, max: 199.99, base: 12, perKg: 45 },
  "za-uchilishte": { min: 3.99, max: 79.99, base: 6, perKg: 20 },
  aksesoari: { min: 3.99, max: 69.99, base: 6, perKg: 14 },
  darveni: { min: 4.99, max: 79.99, base: 7, perKg: 18 },
  "drugi-igrachki": { min: 3.99, max: 79.99, base: 6, perKg: 15 },
  // subcategory overrides
  trotinetki: { min: 29.99, max: 189.99, base: 35, perKg: 12 },
  "kolela-i-triokolki": { min: 49.99, max: 299.99, base: 60, perKg: 10 },
  "detski-koli-za-karane": { min: 69.99, max: 599.99, base: 90, perKg: 8 },
  "lyato-i-voda": { min: 2.99, max: 199.99, base: 5, perKg: 10 },
  sport: { min: 4.99, max: 299.99, base: 8, perKg: 9 },
  "boi-i-instrumenti": { min: 2.49, max: 14.99, base: 2.99, perKg: 30 },
  "3d-pazeli": { min: 9.99, max: 69.99, base: 12, perKg: 20 },
};

function roundPrice(p: number): number {
  if (p < 10) return Math.floor(p) + (p % 1 < 0.5 ? 0.49 : 0.99);
  return Math.floor(p) + 0.99;
}

function demoPrice(d: Draft): { price: number; oldPrice: number | null } {
  const prof = (d.subcategory && PROFILES[d.subcategory]) || PROFILES[d.category] || PROFILES["drugi-igrachki"];
  const h = hash01(d.sku);
  let p: number;
  if (d.category === "pazeli" && d.subcategory !== "3d-pazeli" && d.pieces) {
    p = 4.5 + Math.pow(d.pieces, 0.8) * 0.06;
  } else if (d.weight) {
    p = prof.base + prof.perKg * Math.pow(Math.min(d.weight, 40), 0.85);
  } else {
    p = prof.base * (1.2 + h * 2);
  }
  p *= 0.85 + h * 0.3;
  p = Math.min(prof.max, Math.max(prof.min, p));
  const price = roundPrice(p);
  const h2 = hash01(d.sku, 7);
  const onSale = d.stock > 0 && h2 < 0.16;
  const oldPrice = onSale ? roundPrice(price * (1.15 + hash01(d.sku, 13) * 0.3)) : null;
  return { price, oldPrice };
}

/** A setting saved in the admin panel (data/store.db → settings), or undefined. */
function readStoreSetting(key: string): unknown {
  const storePath = path.join(DATA_DIR, "store.db");
  if (!fs.existsSync(storePath)) return undefined;
  const store = new Database(storePath, { readonly: true, fileMustExist: true });
  try {
    const row = store.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
    return row ? JSON.parse(row.value) : undefined;
  } catch {
    return undefined;
  } finally {
    store.close();
  }
}

/** Re-apply admin panel changes (data/store.db → product_edits) on top of the fresh catalogue. */
function applyStoreEdits(db: Database.Database, previousIds: Map<string, number>) {
  const storePath = path.join(DATA_DIR, "store.db");
  const out = { applied: 0, custom: 0, missing: 0 };
  if (!fs.existsSync(storePath)) return out;
  const store = new Database(storePath, { readonly: true, fileMustExist: true });
  let rows: { sku: string; custom: number; deleted: number; data: string }[] = [];
  try {
    rows = store.prepare("SELECT sku, custom, deleted, data FROM product_edits").all() as typeof rows;
  } catch {
    rows = []; // older store.db without admin edits
  }
  store.close();
  db.transaction(() => {
    for (const r of rows) {
      if (r.deleted) continue;
      const data = JSON.parse(r.data);
      if (r.custom) {
        if (!db.prepare("SELECT 1 FROM products WHERE sku = ?").get(r.sku)) {
          insertCustomProduct(db, r.sku, data as CustomProduct, { reindex: false, id: previousIds.get(r.sku) });
          out.custom++;
        }
      } else if (applyProductEdit(db, r.sku, data as ProductEdit, { reindex: false })) {
        out.applied++;
      } else {
        out.missing++;
      }
    }
  })();
  // Series tags for renamed/added products.
  const products = db.prepare("SELECT id, name, brand FROM products WHERE admin_edited = 1").all() as { id: number; name: string; brand: string | null }[];
  const del = db.prepare("DELETE FROM product_series WHERE product_id = ?");
  const ins = db.prepare("INSERT OR IGNORE INTO product_series (product_id, series) VALUES (?, ?)");
  db.transaction(() => {
    for (const p of products) {
      del.run(p.id);
      for (const s of detectSeries(p.name, p.brand ?? "")) ins.run(p.id, s);
    }
  })();
  return out;
}

function loadPriceFile(file: string): Map<string, { price: number; oldPrice: number | null }> {
  const map = new Map<string, { price: number; oldPrice: number | null }>();
  if (!fs.existsSync(file)) return map;
  const text = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  const lines = text.split(/\r?\n/).filter(Boolean);
  const head = lines.shift()!.split(/[,;]/).map((h) => h.trim().toLowerCase());
  const iSku = head.findIndex((h) => h === "sku");
  const iPrice = head.findIndex((h) => h === "price" || h === "цена");
  const iOld = head.findIndex((h) => h === "old_price" || h === "стара цена" || h === "compare_at_price");
  for (const line of lines) {
    const cols = line.split(/[,;]/);
    const price = num(cols[iPrice]);
    if (!cols[iSku] || price == null) continue;
    map.set(cols[iSku].trim(), { price, oldPrice: iOld >= 0 ? num(cols[iOld]) : null });
  }
  return map;
}

// ---------------------------------------------------------------------------
const TOP_BRANDS = new Set([
  "lego", "playmobil", "barbie", "mattel", "hasbro", "ravensburger", "hotwheels", "spinmaster", "schleich",
  "vtech", "fisherprice", "clementoni", "educa", "hape", "bburago", "funko", "mga", "simbatoys", "simba",
  "globber", "melissadoug", "janod", "djeco", "haba", "siku", "maisto", "smoby", "littletikes", "zuru",
]);

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found: ${CSV_PATH}\nPass it with --csv "<path>"`);
    process.exit(1);
  }
  console.log(`Reading ${CSV_PATH}`);
  const priceFile = loadPriceFile(PRICES_PATH);
  if (priceFile.size) console.log(`Loaded ${priceFile.size} prices from ${PRICES_PATH}`);

  const stats = { rows: 0, toyRows: 0, inactive: 0, adult: 0, excluded: 0, noImage: 0, duplicates: 0 };
  const byKey = new Map<string, Draft>();
  let priceCol: string | null = null;
  let oldPriceCol: string | null = null;

  const parser = fs.createReadStream(CSV_PATH).pipe(
    parse({ columns: true, bom: true, relax_column_count: true, relax_quotes: true, skip_empty_lines: true }),
  );

  // The export files adult products under toy categories, so brands that sell in
  // "Sexual Wellness" anywhere in the file are blocked from the toy store entirely.
  const adultBrands = new Set<string>();
  const toyRows: Row[] = [];
  for await (const row of parser as AsyncIterable<Row>) {
    stats.rows++;
    if (stats.rows === 1) {
      const cols = Object.keys(row);
      priceCol = cols.find((c) => /^(price|цена|retail price|rrp|sale price)$/i.test(c.trim())) ?? null;
      oldPriceCol = cols.find((c) => /^(old price|compare at price|стара цена|regular price)$/i.test(c.trim())) ?? null;
      if (priceCol) console.log(`Using price column "${priceCol}"`);
    }
    const source = (row["Category"] ?? "").trim();
    const brand = (row["Brand"] ?? "").trim();
    if (/sexual wellness|секс|еротик/i.test(source) && !isNoBrand(brand) && brand.toLowerCase() !== "none") {
      adultBrands.add(brandKey(brand));
    }
    if (isToySource(source)) toyRows.push(row);
  }

  for (const row of toyRows) {
    const source = (row["Category"] ?? "").trim();
    stats.toyRows++;
    if ((row["Status"] ?? "").trim() !== "Active") {
      stats.inactive++;
      continue;
    }
    const name = cleanName(row["Name"] ?? "");
    const brandRaw = (row["Brand"] ?? "").trim();
    if (!name) continue;
    const imageRaw = row["Image URL"] ?? "";
    if (adultBrands.has(brandKey(brandRaw)) || ADULT_IMAGE_HOSTS.test(imageRaw) || isUnsafeForKids(name, brandRaw)) {
      stats.adult++;
      continue;
    }
    const cls = classify(name, isNoBrand(brandRaw) ? "" : brandRaw, source);
    if (!cls) {
      stats.excluded++;
      continue;
    }
    const images = parseImages(imageRaw);
    if (!images.length && !INCLUDE_NO_IMAGE) {
      stats.noImage++;
      continue;
    }
    const ean = (row["EAN"] ?? "").trim().replace(/\.0$/, "");
    const draft: Draft = {
      sku: row["SKU"].trim(),
      name,
      brandRaw,
      category: cls.category,
      subcategory: cls.sub,
      series: detectSeries(name, brandRaw),
      ean: /^\d{8,14}$/.test(ean) ? ean : null,
      stock: Math.max(0, Math.floor(num(row["Inventory"]) ?? 0) - Math.floor(num(row["Reserved"]) ?? 0)),
      weight: num(row["Weight"]),
      height: num(row["Height (cm)"]),
      length: num(row["Length (cm)"]),
      width: num(row["Width (cm)"]),
      color: cleanColor(row["Color"] ?? ""),
      pieces: extractPieces(name),
      images,
      sourceCategory: source,
      created: row["Created"] ?? "",
      updated: row["Updated"] ?? "",
      csvPrice: priceCol ? num(row[priceCol]) : null,
      csvOldPrice: oldPriceCol ? num(row[oldPriceCol]) : null,
    };
    // Same product listed twice (packs, supplier duplicates): keep the best row.
    const key = draft.ean ?? `n:${name.toLowerCase()}`;
    const prev = byKey.get(key);
    if (prev) {
      stats.duplicates++;
      const better =
        (draft.stock > 0 ? 1 : 0) - (prev.stock > 0 ? 1 : 0) ||
        (prev.sku.includes("xDilon") ? 1 : 0) - (draft.sku.includes("xDilon") ? 1 : 0) ||
        draft.images.length - prev.images.length ||
        draft.updated.localeCompare(prev.updated);
      if (better <= 0) continue;
    }
    byKey.set(key, draft);
  }

  const drafts = [...byKey.values()];

  // Brand display names: most common spelling per normalised key.
  const variants = new Map<string, Map<string, number>>();
  for (const d of drafts) {
    if (isNoBrand(d.brandRaw)) continue;
    const k = brandKey(d.brandRaw);
    if (!k) continue;
    const m = variants.get(k) ?? new Map<string, number>();
    m.set(d.brandRaw, (m.get(d.brandRaw) ?? 0) + 1);
    variants.set(k, m);
  }
  const brandName = new Map<string, string>();
  for (const [k, m] of variants) {
    const best = [...m.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const pretty = best === best.toUpperCase() && best.length > 4 ? best.charAt(0) + best.slice(1).toLowerCase() : best;
    brandName.set(k, brandOverride(k) ?? pretty);
  }

  // ---------------------------------------------------------------------------
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  const tmp = `${OUT_PATH}.tmp`;
  for (const f of [tmp, `${tmp}-wal`, `${tmp}-shm`]) if (fs.existsSync(f)) fs.rmSync(f);
  const db = new Database(tmp);
  db.pragma("journal_mode = OFF");
  db.pragma("synchronous = OFF");
  db.exec(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      sku TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      brand TEXT,
      brand_slug TEXT,
      category TEXT NOT NULL,
      subcategory TEXT,
      ean TEXT,
      price REAL NOT NULL,
      old_price REAL,
      stock INTEGER NOT NULL DEFAULT 0,
      weight REAL, height REAL, length REAL, width REAL,
      color TEXT,
      pieces INTEGER,
      image TEXT,
      images TEXT NOT NULL,
      source_category TEXT,
      created TEXT,
      popularity INTEGER NOT NULL,
      hidden INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      demo_price INTEGER NOT NULL DEFAULT 0,
      admin_edited INTEGER NOT NULL DEFAULT 0,
      custom INTEGER NOT NULL DEFAULT 0,
      ${TOY_INFO_COLUMNS.map(([name, def]) => `${name} ${def}`).join(", ")}
    );
    CREATE TABLE product_series (product_id INTEGER NOT NULL, series TEXT NOT NULL, PRIMARY KEY (series, product_id)) WITHOUT ROWID;
    CREATE TABLE categories (slug TEXT PRIMARY KEY, parent TEXT, name TEXT NOT NULL, position INTEGER, count INTEGER, in_stock INTEGER, image TEXT);
    CREATE TABLE brands (slug TEXT PRIMARY KEY, name TEXT NOT NULL, count INTEGER, in_stock INTEGER);
    CREATE TABLE series (slug TEXT PRIMARY KEY, name TEXT NOT NULL, position INTEGER, count INTEGER, image TEXT);
    CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);
  `);

  const insert = db.prepare(`
    INSERT INTO products (id, sku, slug, name, brand, brand_slug, category, subcategory, ean, price, old_price, stock,
      weight, height, length, width, color, pieces, image, images, source_category, created, popularity, demo_price)
    VALUES (@id, @sku, @slug, @name, @brand, @brand_slug, @category, @subcategory, @ean, @price, @old_price, @stock,
      @weight, @height, @length, @width, @color, @pieces, @image, @images, @source_category, @created, @popularity, @demo_price)
  `);
  const insertSeries = db.prepare(`INSERT OR IGNORE INTO product_series (product_id, series) VALUES (?, ?)`);

  // Keep product ids (and slugs) stable across imports so carts, wishlists and links stay valid.
  const previous = new Map<string, { id: number; slug: string }>();
  let nextId = 1;
  if (fs.existsSync(OUT_PATH)) {
    try {
      const old = new Database(OUT_PATH, { readonly: true, fileMustExist: true });
      for (const r of old.prepare("SELECT id, sku, slug FROM products").all() as { id: number; sku: string; slug: string }[]) {
        previous.set(r.sku, { id: r.id, slug: r.slug });
        nextId = Math.max(nextId, r.id + 1);
      }
      old.close();
    } catch {
      previous.clear(); // unreadable old file: fall back to fresh ids
    }
  }
  const idFor = (sku: string) => previous.get(sku)?.id ?? nextId++;

  const usedSlugs = new Set<string>();
  let demoCount = 0;
  db.transaction(() => {
    for (const d of drafts) {
      const k = brandKey(d.brandRaw);
      const brand = isNoBrand(d.brandRaw) || !k ? null : brandName.get(k)!;
      const brandSlug = brand ? slugify(brand) : null;
      const skuPart = slugify(d.sku.replace(/^(\d+x)?dilon-/i, "")) || slugify(d.sku);
      let slug = previous.get(d.sku)?.slug ?? `${slugify(d.name, 70)}-${skuPart}`;
      while (usedSlugs.has(slug)) slug += "-x";
      usedSlugs.add(slug);

      let price: number;
      let oldPrice: number | null;
      let isDemo = false;
      const fromFile = priceFile.get(d.sku);
      if (fromFile) ({ price, oldPrice } = fromFile);
      else if (d.csvPrice) ({ price, oldPrice } = { price: d.csvPrice, oldPrice: d.csvOldPrice });
      else {
        ({ price, oldPrice } = demoPrice(d));
        isDemo = true;
        demoCount++;
      }
      if (oldPrice != null && oldPrice <= price) oldPrice = null;

      const popularity = Math.round(
        (d.stock > 0 ? 1000 : 0) +
          (brand && TOP_BRANDS.has(brandKey(brand)) ? 180 : 0) +
          (d.series.length ? 120 : 0) +
          (d.images.length > 1 ? 40 : 0) +
          Math.min(d.stock, 20) * 3 +
          hash01(d.sku, 3) * 400,
      );

      const info = insert.run({
        id: idFor(d.sku),
        sku: d.sku,
        slug,
        name: d.name,
        brand,
        brand_slug: brandSlug,
        category: d.category,
        subcategory: d.subcategory,
        ean: d.ean,
        price,
        old_price: oldPrice,
        stock: d.stock,
        weight: d.weight,
        height: d.height,
        length: d.length,
        width: d.width,
        color: d.color,
        pieces: d.pieces,
        image: d.images[0] ?? null,
        images: JSON.stringify(d.images),
        source_category: d.sourceCategory,
        created: d.created,
        popularity,
        demo_price: isDemo ? 1 : 0,
      });
      for (const s of d.series) insertSeries.run(info.lastInsertRowid, s);
    }
  })();

  // Estimated age, "for whom" and safety warnings (admin edits below override them).
  refreshToyInfo(db);

  // Changes made in the admin panel live in data/store.db and win over the CSV.
  const edits = applyStoreEdits(db, new Map([...previous].map(([sku, v]) => [sku, v.id])));
  if (edits.applied || edits.custom || edits.missing) {
    console.log(`Admin edits re-applied: ${edits.applied} changed, ${edits.custom} added in admin, ${edits.missing} no longer in the CSV`);
  }

  db.exec(`
    CREATE INDEX idx_products_cat ON products (category, popularity DESC);
    CREATE INDEX idx_products_sub ON products (subcategory, popularity DESC);
    CREATE INDEX idx_products_brand ON products (brand_slug, popularity DESC);
    CREATE INDEX idx_products_pop ON products (popularity DESC);
    CREATE INDEX idx_products_price ON products (price);
    CREATE INDEX idx_products_created ON products (created DESC);
    CREATE INDEX idx_products_sale ON products (popularity DESC) WHERE old_price IS NOT NULL;

    CREATE VIRTUAL TABLE products_fts USING fts5(
      name, brand, sku, ean,
      content='products', content_rowid='id',
      tokenize="unicode61 remove_diacritics 2"
    );
    INSERT INTO products_fts (products_fts) VALUES ('rebuild');
  `);

  // Aggregates used by navigation and filters, for the categories as edited in Admin → Категории.
  refreshAggregates(db, mergeCategories(readStoreSetting("categories")));

  const meta = db.prepare(`INSERT INTO meta (key, value) VALUES (?, ?)`);
  meta.run("imported_at", new Date().toISOString());
  meta.run("structure_rev", String(CATALOG_STRUCTURE_REV));
  meta.run("source_file", path.basename(CSV_PATH));
  meta.run("product_count", String(drafts.length));
  meta.run("demo_prices", demoCount > 0 ? "1" : "0");
  meta.run("demo_price_count", String(demoCount));

  db.exec("ANALYZE; VACUUM;");
  db.close();
  try {
    for (const f of [OUT_PATH, `${OUT_PATH}-wal`, `${OUT_PATH}-shm`]) if (fs.existsSync(f)) fs.rmSync(f);
    fs.renameSync(tmp, OUT_PATH);
  } catch (e) {
    // The site is running and has the file open (Windows won't replace it): copy the new
    // catalogue into the open file with SQLite's online backup instead.
    if (!["EBUSY", "EPERM", "EACCES"].includes((e as NodeJS.ErrnoException).code ?? "")) throw e;
    console.log("catalog.db is in use by the running site — updating it in place…");
    const src = new Database(tmp, { readonly: true });
    await src.backup(OUT_PATH);
    src.close();
    fs.rmSync(tmp);
  }

  // Human-readable report for checking the classifier.
  const check = new Database(OUT_PATH, { readonly: true });
  const lines: string[] = [];
  lines.push(`Rows read: ${stats.rows}`, `Toy rows: ${stats.toyRows}`, `Inactive: ${stats.inactive}`,
    `Blocked (adult/unsafe): ${stats.adult}`, `Adult brands in export: ${adultBrands.size}`, `Excluded (not toys): ${stats.excluded}`, `Skipped without image: ${stats.noImage}`,
    `Duplicates merged: ${stats.duplicates}`, `Imported: ${drafts.length}`, `Placeholder prices: ${demoCount}`, "");
  const cats = check.prepare(`SELECT slug, parent, name, count, in_stock FROM categories ORDER BY COALESCE(parent, slug), parent IS NOT NULL, position`).all() as { slug: string; parent: string | null; name: string; count: number; in_stock: number }[];
  for (const c of cats) lines.push(`${c.parent ? "    " : ""}${c.name} (${c.slug}): ${c.count} (${c.in_stock} in stock)`);
  lines.push("");
  const sample = check.prepare(`SELECT name, brand, price FROM products WHERE category = ? AND (subcategory IS ? OR ? IS NULL) ORDER BY random() LIMIT 12`);
  for (const c of CATEGORIES) {
    const groups = c.subs.length ? c.subs.map((s) => s.slug) : [null];
    for (const g of groups) {
      lines.push(`--- ${c.slug}${g ? " / " + g : ""}`);
      for (const r of sample.all(c.slug, g, g) as { name: string; brand: string | null; price: number }[]) lines.push(`  ${r.price.toFixed(2)}  ${r.name}  [${r.brand ?? "-"}]`);
    }
  }
  check.close();
  const reportPath = path.join(path.dirname(OUT_PATH), "import-report.txt");
  fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
  console.log(lines.slice(0, 8).join("\n"));
  console.log(`Wrote ${OUT_PATH}\nReport: ${reportPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
