import "server-only";
import { catalogDb } from "./db";
import { getCategoryEntries } from "./settings";
import { categoryLabel } from "./categories";
import type { CategoryEntry } from "./category-config";
import { AGE_BUCKETS, AUDIENCES, OPEN_AGE_SPAN, type AgeBucketKey, type Audience, type WarningKey, WARNING_KEYS } from "./toy-info";
import { searchMatchSql, tokenize } from "./search";

// ---------------------------------------------------------------------------
// Types

export type ProductCard = {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  brandSlug: string | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  image: string | null;
  category: string;
  subcategory: string | null;
  /** Months (for the age badge); null = unknown. */
  ageMin: number | null;
};

export type ProductDetail = ProductCard & {
  sku: string;
  ean: string | null;
  ageMax: number | null;
  audience: Audience;
  warnings: WarningKey[];
  batch: string | null;
  passport: string | null;
  images: string[];
  weight: number | null;
  height: number | null;
  length: number | null;
  width: number | null;
  color: string | null;
  pieces: number | null;
  description: string | null;
  series: { slug: string; name: string }[];
};

type CardRow = {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  brand_slug: string | null;
  price: number;
  old_price: number | null;
  stock: number;
  image: string | null;
  category: string;
  subcategory: string | null;
  age_min: number | null;
};

const CARD_COLS = "p.id, p.slug, p.name, p.brand, p.brand_slug, p.price, p.old_price, p.stock, p.image, p.category, p.subcategory, p.age_min";

function toCard(r: CardRow): ProductCard {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    brand: r.brand,
    brandSlug: r.brand_slug,
    price: r.price,
    oldPrice: r.old_price,
    stock: r.stock,
    image: r.image,
    category: r.category,
    subcategory: r.subcategory,
    ageMin: r.age_min ?? null,
  };
}

// ---------------------------------------------------------------------------
// Listing options

export const PRICE_BUCKETS = [
  { key: "0-10", label: "до 10 €", min: 0, max: 10 },
  { key: "10-25", label: "10 – 25 €", min: 10, max: 25 },
  { key: "25-50", label: "25 – 50 €", min: 25, max: 50 },
  { key: "50-100", label: "50 – 100 €", min: 50, max: 100 },
  { key: "100+", label: "над 100 €", min: 100, max: Infinity },
] as const;

export const SORTS = [
  { key: "popular", label: "Препоръчани" },
  { key: "relevance", label: "Най-подходящи" },
  { key: "new", label: "Най-нови" },
  { key: "price-asc", label: "Цена: възходяща" },
  { key: "price-desc", label: "Цена: низходяща" },
  { key: "discount", label: "Най-голяма отстъпка" },
] as const;
export type SortKey = (typeof SORTS)[number]["key"];

export type Scope =
  | { kind: "all" }
  | { kind: "category"; slug: string }
  | { kind: "sub"; slug: string; parent: string }
  | { kind: "brand"; slug: string }
  | { kind: "series"; slug: string }
  | { kind: "search"; q: string }
  | { kind: "sale" }
  | { kind: "new" };

export type Filters = {
  brands: string[];
  price: string | null;
  inStock: boolean;
  sale: boolean;
  category: string | null;
  series: string | null;
  age: AgeBucketKey | null;
  audience: Audience | null;
};

export const EMPTY_FILTERS: Filters = { brands: [], price: null, inStock: false, sale: false, category: null, series: null, age: null, audience: null };

type FacetOmit = "brand" | "price" | "category" | "series" | "toggles" | "age" | "audience" | null;

/**
 * A product fits an age bucket when its age range overlaps it. An open-ended "3+" counts for OPEN_AGE_SPAN
 * months (a 3+ puzzle isn't what a 12-year-old's parent is looking for); "12+" and up stays open.
 */
function ageFits(b: { min: number; max: number }): string {
  // Numbers from AGE_BUCKETS (code constants), so they can be part of the SQL text.
  return `(p.age_min IS NOT NULL AND p.age_min < ${Number(b.max)} AND COALESCE(p.age_max, CASE WHEN p.age_min >= 144 THEN 1200 ELSE p.age_min + ${OPEN_AGE_SPAN} END) > ${Number(b.min)})`;
}

type Built = { sql: string; params: unknown[]; searchable: boolean };

const NEW_LIMIT = 1500;

function build(scope: Scope, f: Filters, omit: FacetOmit = null): Built | null {
  const cteParams: unknown[] = [];
  const fromParams: unknown[] = [];
  const whereParams: unknown[] = [];
  const where: string[] = ["p.hidden = 0"];
  let cte = "";
  let from = "products p";

  switch (scope.kind) {
    case "category":
      where.push("p.category = ?");
      whereParams.push(scope.slug);
      break;
    case "sub":
      where.push("p.category = ? AND p.subcategory = ?");
      whereParams.push(scope.parent, scope.slug);
      break;
    case "brand":
      where.push("p.brand_slug = ?");
      whereParams.push(scope.slug);
      break;
    case "series":
      from += " JOIN product_series ps ON ps.product_id = p.id AND ps.series = ?";
      fromParams.push(scope.slug);
      break;
    case "search": {
      const m = searchMatchSql(scope.q);
      if (!m) return null;
      cte = `WITH m AS (${m.sql}) `;
      from += " JOIN m ON m.id = p.id";
      cteParams.push(...m.params);
      break;
    }
    case "sale":
      where.push("p.old_price IS NOT NULL");
      break;
    case "new":
      where.push(`p.id IN (SELECT id FROM products WHERE hidden = 0 ORDER BY created DESC, id DESC LIMIT ${NEW_LIMIT})`);
      break;
  }

  if (omit !== "brand" && f.brands.length) {
    where.push(`p.brand_slug IN (${f.brands.map(() => "?").join(",")})`);
    whereParams.push(...f.brands);
  }
  if (omit !== "price" && f.price) {
    const b = PRICE_BUCKETS.find((x) => x.key === f.price);
    if (b) {
      where.push(Number.isFinite(b.max) ? "p.price >= ? AND p.price < ?" : "p.price >= ?");
      whereParams.push(b.min, ...(Number.isFinite(b.max) ? [b.max] : []));
    }
  }
  if (omit !== "toggles" && f.inStock) where.push("p.stock > 0");
  if (omit !== "toggles" && f.sale) where.push("p.old_price IS NOT NULL");
  if (omit !== "category" && f.category) {
    where.push("p.category = ?");
    whereParams.push(f.category);
  }
  if (omit !== "series" && f.series) {
    where.push("EXISTS (SELECT 1 FROM product_series s WHERE s.product_id = p.id AND s.series = ?)");
    whereParams.push(f.series);
  }
  const bucket = f.age ? AGE_BUCKETS.find((b) => b.key === f.age) : undefined;
  if (omit !== "age" && bucket) {
    where.push(ageFits(bucket));
  }
  if (omit !== "audience" && f.audience) {
    where.push("p.audience = ?");
    whereParams.push(f.audience);
  }

  return {
    sql: `${cte}SELECT {cols} FROM ${from} WHERE ${where.join(" AND ")}`,
    params: [...cteParams, ...fromParams, ...whereParams],
    searchable: scope.kind === "search",
  };
}

function orderBy(sort: SortKey, searchable: boolean): string {
  const stockFirst = "(p.stock > 0) DESC, ";
  switch (sort) {
    case "new":
      return `${stockFirst}p.created DESC, p.id DESC`;
    case "price-asc":
      return `${stockFirst}p.price ASC`;
    case "price-desc":
      return `${stockFirst}p.price DESC`;
    case "discount":
      return `${stockFirst}COALESCE((p.old_price - p.price) / p.old_price, 0) DESC, p.popularity DESC`;
    case "relevance":
      return searchable ? `m.exact DESC, ${stockFirst}m.rank, p.popularity DESC` : `${stockFirst}p.popularity DESC`;
    default:
      return `${stockFirst}p.popularity DESC`;
  }
}

export type Facet = { slug: string; name: string; count: number };

export type ListResult = {
  items: ProductCard[];
  total: number;
  page: number;
  pageCount: number;
  perPage: number;
  facets: {
    brands: Facet[];
    prices: { key: string; label: string; count: number }[];
    categories: Facet[];
    series: Facet[];
    inStock: number;
    sale: number;
    ages: { key: AgeBucketKey; label: string; count: number }[];
    audiences: { key: Audience; label: string; count: number }[];
  };
};

export const PER_PAGE = 36;

export function listProducts(scope: Scope, filters: Filters, sort: SortKey, page: number): ListResult {
  const db = catalogDb();
  const empty: ListResult = {
    items: [],
    total: 0,
    page: 1,
    pageCount: 0,
    perPage: PER_PAGE,
    facets: { brands: [], prices: [], categories: [], series: [], inStock: 0, sale: 0, ages: [], audiences: [] },
  };
  const main = build(scope, filters);
  if (!main) return empty;

  const total = (db.prepare(main.sql.replace("{cols}", "COUNT(*) AS n")).get(...main.params) as { n: number }).n;
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const current = Math.min(Math.max(1, page), pageCount);
  const items = (
    db
      .prepare(`${main.sql.replace("{cols}", CARD_COLS)} ORDER BY ${orderBy(sort, main.searchable)} LIMIT ? OFFSET ?`)
      .all(...main.params, PER_PAGE, (current - 1) * PER_PAGE) as CardRow[]
  ).map(toCard);

  // Facets: each one ignores its own filter so the options stay selectable.
  const bq = build(scope, filters, "brand")!;
  const brands = db
    .prepare(
      `${bq.sql.replace("{cols}", "p.brand_slug AS slug, MIN(p.brand) AS name, COUNT(*) AS count")} AND p.brand_slug IS NOT NULL GROUP BY p.brand_slug ORDER BY count DESC LIMIT 80`,
    )
    .all(...bq.params) as Facet[];
  for (const selected of filters.brands) {
    if (!brands.some((b) => b.slug === selected)) {
      const row = db.prepare("SELECT slug, name FROM brands WHERE slug = ?").get(selected) as { slug: string; name: string } | undefined;
      if (row) brands.unshift({ ...row, count: 0 });
    }
  }

  const pq = build(scope, filters, "price")!;
  const priceCase = PRICE_BUCKETS.map((b) =>
    Number.isFinite(b.max) ? `WHEN p.price < ${b.max} THEN '${b.key}'` : `ELSE '${b.key}'`,
  ).join(" ");
  const priceRows = db
    .prepare(`${pq.sql.replace("{cols}", `CASE ${priceCase} END AS k, COUNT(*) AS count`)} GROUP BY k`)
    .all(...pq.params) as { k: string; count: number }[];
  const prices = PRICE_BUCKETS.map((b) => ({
    key: b.key,
    label: b.label,
    count: priceRows.find((r) => r.k === b.key)?.count ?? 0,
  }));

  let categories: Facet[] = [];
  if (scope.kind !== "category" && scope.kind !== "sub") {
    const cq = build(scope, filters, "category")!;
    categories = (
      db.prepare(`${cq.sql.replace("{cols}", "p.category AS slug, COUNT(*) AS count")} GROUP BY p.category ORDER BY count DESC`).all(...cq.params) as {
        slug: string;
        count: number;
      }[]
    ).map((r) => ({ ...r, name: categoryLabel(r.slug) }));
  }

  let series: Facet[] = [];
  if (scope.kind !== "series") {
    const sq = build(scope, filters, "series")!;
    // Join series onto the scoped query without disturbing its WHERE clause (or the search CTE, which has its own FROM products p).
    const joined = sq.sql.replace(
      "SELECT {cols} FROM products p",
      "SELECT sr.slug AS slug, sr.name AS name, COUNT(*) AS count FROM products p JOIN product_series psx ON psx.product_id = p.id JOIN series sr ON sr.slug = psx.series",
    );
    series = db.prepare(`${joined} GROUP BY sr.slug ORDER BY count DESC LIMIT 24`).all(...sq.params) as Facet[];
  }

  const tq = build(scope, filters, "toggles")!;
  const toggles = db
    .prepare(tq.sql.replace("{cols}", "SUM(p.stock > 0) AS inStock, SUM(p.old_price IS NOT NULL) AS sale"))
    .get(...tq.params) as { inStock: number | null; sale: number | null };

  const aq = build(scope, filters, "age")!;
  const ageRow = db
    .prepare(aq.sql.replace("{cols}", AGE_BUCKETS.map((b, i) => `SUM(CASE WHEN ${ageFits(b)} THEN 1 ELSE 0 END) AS b${i}`).join(", ")))
    .get(...aq.params) as Record<string, number | null>;
  const ages = AGE_BUCKETS.map((b, i) => ({ key: b.key, label: b.label, count: ageRow[`b${i}`] ?? 0 }));

  const uq = build(scope, filters, "audience")!;
  const audienceRows = db.prepare(`${uq.sql.replace("{cols}", "p.audience AS k, COUNT(*) AS count")} GROUP BY p.audience`).all(...uq.params) as { k: string; count: number }[];
  const audiences = (Object.keys(AUDIENCES) as Audience[]).map((k) => ({ key: k, label: AUDIENCES[k], count: audienceRows.find((r) => r.k === k)?.count ?? 0 }));

  return {
    items,
    total,
    page: current,
    pageCount,
    perPage: PER_PAGE,
    facets: { brands, prices, categories, series, inStock: toggles.inStock ?? 0, sale: toggles.sale ?? 0, ages, audiences },
  };
}

// ---------------------------------------------------------------------------
// Single product

type ProductRow = CardRow & {
  sku: string;
  ean: string | null;
  images: string;
  weight: number | null;
  height: number | null;
  length: number | null;
  width: number | null;
  color: string | null;
  pieces: number | null;
  description: string | null;
  age_max: number | null;
  audience: string;
  warnings: string;
  batch: string | null;
  passport: string | null;
};

export function getProduct(slug: string): ProductDetail | null {
  const db = catalogDb();
  const r = db
    .prepare(
      `SELECT ${CARD_COLS}, p.sku, p.ean, p.images, p.weight, p.height, p.length, p.width, p.color, p.pieces, p.description,
         p.age_max, p.audience, p.warnings, p.batch, p.passport FROM products p WHERE p.slug = ? AND p.hidden = 0`,
    )
    .get(slug) as
    | ProductRow
    | undefined;
  if (!r) return null;
  const series = db
    .prepare("SELECT s.slug, s.name FROM product_series ps JOIN series s ON s.slug = ps.series WHERE ps.product_id = ?")
    .all(r.id) as { slug: string; name: string }[];
  let images: string[] = [];
  try {
    images = JSON.parse(r.images);
  } catch {
    images = r.image ? [r.image] : [];
  }
  return {
    ...toCard(r),
    sku: r.sku,
    ean: r.ean,
    images,
    weight: r.weight,
    height: r.height,
    length: r.length,
    width: r.width,
    color: r.color,
    pieces: r.pieces,
    description: r.description,
    series,
    ageMax: r.age_max,
    audience: r.audience === "boys" || r.audience === "girls" ? r.audience : "all",
    warnings: parseWarnings(r.warnings),
    batch: r.batch,
    passport: r.passport,
  };
}

function parseWarnings(v: string | null): WarningKey[] {
  try {
    const list = JSON.parse(v ?? "[]");
    return Array.isArray(list) ? WARNING_KEYS.filter((k) => list.includes(k)) : [];
  } catch {
    return [];
  }
}

export function getRelated(p: ProductCard, limit = 12): ProductCard[] {
  const db = catalogDb();
  const rows = db
    .prepare(
      `SELECT ${CARD_COLS} FROM products p
       WHERE p.category = ? AND p.id <> ? AND p.stock > 0 AND p.hidden = 0 AND (? IS NULL OR p.subcategory = ?)
       ORDER BY (p.brand_slug IS ?) DESC, p.popularity DESC LIMIT ?`,
    )
    .all(p.category, p.id, p.subcategory, p.subcategory, p.brandSlug, limit) as CardRow[];
  return rows.map(toCard);
}

export function getMoreFromBrand(p: ProductCard, limit = 12): ProductCard[] {
  if (!p.brandSlug) return [];
  const rows = catalogDb()
    .prepare(`SELECT ${CARD_COLS} FROM products p WHERE p.brand_slug = ? AND p.id <> ? AND p.stock > 0 AND p.hidden = 0 ORDER BY p.popularity DESC LIMIT ?`)
    .all(p.brandSlug, p.id, limit) as CardRow[];
  return rows.map(toCard);
}

export function getProductsByIds(ids: number[]): ProductCard[] {
  const clean = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))].slice(0, 200);
  if (!clean.length) return [];
  const rows = catalogDb()
    .prepare(`SELECT ${CARD_COLS} FROM products p WHERE p.hidden = 0 AND p.id IN (${clean.map(() => "?").join(",")})`)
    .all(...clean) as CardRow[];
  return rows.map(toCard);
}

// ---------------------------------------------------------------------------
// Navigation data

export type CategoryInfo = Omit<CategoryEntry, "subs" | "image"> & {
  count: number;
  inStock: number;
  /** The admin's picture, or the most popular product's. */
  image: string | null;
  subs: (CategoryEntry["subs"][number] & { count: number; image: string | null })[];
};

type CatRow = { slug: string; parent: string | null; count: number; in_stock: number; image: string | null };

/**
 * Categories in menu order, as edited in Admin → Категории, with product counts and pictures.
 * By default only what the menu shows: not hidden, with products.
 */
export function getCategories(opts: { includeHidden?: boolean } = {}): CategoryInfo[] {
  const rows = catalogDb().prepare("SELECT slug, parent, count, in_stock, image FROM categories").all() as CatRow[];
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const show = (x: { hidden: boolean }) => opts.includeHidden || !x.hidden;
  return getCategoryEntries()
    .filter(show)
    .map((c) => {
      const r = bySlug.get(c.slug);
      return {
        ...c,
        count: r?.count ?? 0,
        inStock: r?.in_stock ?? 0,
        image: c.image || r?.image || null,
        subs: c.subs
          .filter(show)
          .map((s) => ({ ...s, count: bySlug.get(s.slug)?.count ?? 0, image: bySlug.get(s.slug)?.image ?? null }))
          .filter((s) => s.count > 0),
      };
    })
    .filter((c) => c.count > 0);
}

/** Resolves a /kategoria/[slug] URL to a category or a subcategory (hidden ones still have a page). */
export function resolveCategory(slug: string): { category: CategoryInfo; sub: CategoryInfo["subs"][number] | null } | null {
  for (const c of getCategories({ includeHidden: true })) {
    if (c.slug === slug) return { category: c, sub: null };
    const sub = c.subs.find((s) => s.slug === slug);
    if (sub) return { category: c, sub };
  }
  return null;
}

/** Most stocked brands per category, for the mega menu. */
export function getCategoryTopBrands(limit = 8): Map<string, { slug: string; name: string }[]> {
  const rows = catalogDb()
    .prepare(
      `SELECT category, brand_slug AS slug, name FROM (
         SELECT category, brand_slug, MIN(brand) AS name,
                ROW_NUMBER() OVER (PARTITION BY category ORDER BY SUM(stock > 0) DESC, COUNT(*) DESC) AS rn
         FROM products WHERE brand_slug IS NOT NULL AND hidden = 0 GROUP BY category, brand_slug
       ) WHERE rn <= ? ORDER BY category, rn`,
    )
    .all(limit) as { category: string; slug: string; name: string }[];
  const out = new Map<string, { slug: string; name: string }[]>();
  for (const r of rows) out.set(r.category, [...(out.get(r.category) ?? []), { slug: r.slug, name: r.name }]);
  return out;
}

export type Brand = { slug: string; name: string; count: number; inStock: number };

export function getBrands(): Brand[] {
  return catalogDb()
    .prepare("SELECT slug, name, count, in_stock AS inStock FROM brands ORDER BY name COLLATE NOCASE")
    .all() as Brand[];
}

export function getTopBrands(limit = 24): Brand[] {
  return catalogDb()
    .prepare("SELECT slug, name, count, in_stock AS inStock FROM brands ORDER BY in_stock DESC LIMIT ?")
    .all(limit) as Brand[];
}

export function getBrand(slug: string): Brand | null {
  return (
    (catalogDb().prepare("SELECT slug, name, count, in_stock AS inStock FROM brands WHERE slug = ?").get(slug) as Brand | undefined) ?? null
  );
}

export type SeriesInfo = { slug: string; name: string; count: number; image: string | null };

export function getSeriesList(limit = 100): SeriesInfo[] {
  return catalogDb().prepare("SELECT slug, name, count, image FROM series ORDER BY count DESC LIMIT ?").all(limit) as SeriesInfo[];
}

export function getSeries(slug: string): SeriesInfo | null {
  return (catalogDb().prepare("SELECT slug, name, count, image FROM series WHERE slug = ?").get(slug) as SeriesInfo | undefined) ?? null;
}

export function getMeta(): { demoPrices: boolean; productCount: number; importedAt: string | null } {
  const db = catalogDb();
  const rows = db.prepare("SELECT key, value FROM meta").all() as { key: string; value: string }[];
  const m = new Map(rows.map((r) => [r.key, r.value]));
  const counts = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(demo_price), 0) AS demo FROM products WHERE hidden = 0").get() as { n: number; demo: number };
  return {
    demoPrices: counts.demo > 0,
    productCount: counts.n,
    importedAt: m.get("imported_at") ?? null,
  };
}

// ---------------------------------------------------------------------------
// Home page shelves

export function getShelf(kind: "sale" | "popular" | "new", limit = 12): ProductCard[] {
  const db = catalogDb();
  if (kind === "popular") {
    // Best items across categories, so the shelf isn't all puzzles.
    const rows = db
      .prepare(
        `SELECT ${CARD_COLS} FROM (
           SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY popularity DESC) AS rn
           FROM products WHERE stock > 0 AND hidden = 0 AND category NOT IN ('drugi-igrachki', 'aksesoari', 'za-uchilishte')
         ) p WHERE p.rn <= 2 ORDER BY p.popularity DESC LIMIT ?`,
      )
      .all(limit) as CardRow[];
    return rows.map(toCard);
  }
  const where = kind === "sale" ? "p.old_price IS NOT NULL AND p.stock > 0 AND p.hidden = 0" : "p.stock > 0 AND p.hidden = 0";
  const order = kind === "sale" ? "p.popularity DESC" : "p.created DESC, p.id DESC";
  return (db.prepare(`SELECT ${CARD_COLS} FROM products p WHERE ${where} ORDER BY ${order} LIMIT ?`).all(limit) as CardRow[]).map(toCard);
}

export function getHeroProducts(): ProductCard[] {
  const db = catalogDb();
  // A construction set, a doll, a plush toy and a vehicle.
  const plan = [
    "p.category = 'konstruktori'",
    "p.category = 'kukli' AND COALESCE(p.subcategory, '') NOT IN ('plyusheni-igrachki', 'kukli-za-teatar')",
    "p.subcategory = 'plyusheni-igrachki'",
    "p.category = 'prevozni-sredstva'",
  ];
  return plan
    .map(
      (where) =>
        db
          .prepare(`SELECT ${CARD_COLS} FROM products p WHERE ${where} AND p.stock > 0 AND p.hidden = 0 AND p.image IS NOT NULL ORDER BY p.popularity DESC LIMIT 1`)
          .get() as CardRow | undefined,
    )
    .filter((r): r is CardRow => !!r)
    .map(toCard);
}

// ---------------------------------------------------------------------------
// Search suggestions

export type Suggestions = {
  /** `code` is set when the product's SKU or barcode is exactly what was typed. */
  products: (ProductCard & { code: { sku: string; ean: string | null } | null })[];
  categories: { slug: string; name: string }[];
  brands: { slug: string; name: string }[];
  total: number;
};

export function suggest(q: string): Suggestions {
  const db = catalogDb();
  const m = searchMatchSql(q);
  const out: Suggestions = { products: [], categories: [], brands: [], total: 0 };
  if (!m) return out;
  out.products = (
    db
      .prepare(
        `WITH m AS (${m.sql})
         SELECT ${CARD_COLS}, p.sku, p.ean, m.exact FROM products p JOIN m ON m.id = p.id WHERE p.hidden = 0
         ORDER BY m.exact DESC, (p.stock > 0) DESC, m.rank LIMIT 6`,
      )
      .all(...m.params) as (CardRow & { sku: string; ean: string | null; exact: number })[]
  ).map((r) => ({ ...toCard(r), code: r.exact ? { sku: r.sku, ean: r.ean } : null }));
  out.total = (
    db.prepare(`WITH m AS (${m.sql}) SELECT COUNT(*) AS n FROM m JOIN products p ON p.id = m.id WHERE p.hidden = 0`).get(...m.params) as { n: number }
  ).n;

  const tokens = tokenize(q);
  const first = tokens[0] ?? "";
  if (first.length >= 2) {
    const needle = first.slice(0, Math.max(3, first.length - 1));
    for (const c of getCategories()) {
      if (c.name.toLowerCase().includes(needle)) out.categories.push({ slug: c.slug, name: c.name });
      for (const s of c.subs) if (s.name.toLowerCase().includes(needle)) out.categories.push({ slug: s.slug, name: s.name });
    }
    out.categories = out.categories.slice(0, 4);
    out.brands = db
      .prepare("SELECT slug, name FROM brands WHERE name LIKE ? ORDER BY in_stock DESC LIMIT 4")
      .all(`${first}%`) as { slug: string; name: string }[];
  }
  return out;
}

/** Where a search for a SKU or barcode goes straight to: the one visible product whose code is exactly what was typed. */
export function productSlugForCode(q: string): string | null {
  const m = searchMatchSql(q);
  if (!m) return null;
  const rows = catalogDb()
    .prepare(`WITH m AS (${m.sql}) SELECT p.slug FROM m JOIN products p ON p.id = m.id WHERE m.exact = 2 AND p.hidden = 0 LIMIT 2`)
    .all(...m.params) as { slug: string }[];
  return rows.length === 1 ? rows[0].slug : null;
}

/** A representative picture for a link to a category, hero or brand page (used by promo banners). */
export function imageForHref(href: string): string | null {
  const m = href.match(/^\/(kategoria|geroi|marka)\/([a-z0-9-]+)/);
  if (!m) return null;
  const db = catalogDb();
  if (m[1] === "kategoria") return (db.prepare("SELECT image FROM categories WHERE slug = ?").get(m[2]) as { image: string | null } | undefined)?.image ?? null;
  if (m[1] === "geroi") return (db.prepare("SELECT image FROM series WHERE slug = ?").get(m[2]) as { image: string | null } | undefined)?.image ?? null;
  return (
    (
      db
        .prepare("SELECT image FROM products WHERE brand_slug = ? AND hidden = 0 AND stock > 0 AND image IS NOT NULL ORDER BY popularity DESC LIMIT 1")
        .get(m[2]) as { image: string } | undefined
    )?.image ?? null
  );
}

/** Visible products by SKU, in the order given (unknown / hidden SKUs are skipped). */
export function getProductsBySkus(skus: string[]): ProductCard[] {
  const clean = [...new Set(skus)].slice(0, 500);
  if (!clean.length) return [];
  const rows = catalogDb()
    .prepare(`SELECT ${CARD_COLS}, p.sku FROM products p WHERE p.hidden = 0 AND p.sku IN (${clean.map(() => "?").join(",")})`)
    .all(...clean) as (CardRow & { sku: string })[];
  const bySku = new Map(rows.map((r) => [r.sku, r]));
  return clean.map((sku) => bySku.get(sku)).filter((r): r is CardRow & { sku: string } => !!r).map(toCard);
}

/** Visible products keyed by SKU (products shown inside blog posts). */
export function productCardsBySku(skus: string[]): Record<string, ProductCard> {
  const clean = [...new Set(skus)].slice(0, 200);
  if (!clean.length) return {};
  const rows = catalogDb()
    .prepare(`SELECT ${CARD_COLS}, p.sku FROM products p WHERE p.hidden = 0 AND p.sku IN (${clean.map(() => "?").join(",")})`)
    .all(...clean) as (CardRow & { sku: string })[];
  return Object.fromEntries(rows.map((r) => [r.sku, toCard(r)]));
}

/** Pictures of visible products by SKU (blog covers). */
export function productImagesBySku(skus: string[]): Map<string, string> {
  const clean = [...new Set(skus)].slice(0, 500);
  if (!clean.length) return new Map();
  const rows = catalogDb()
    .prepare(`SELECT sku, image FROM products WHERE hidden = 0 AND image IS NOT NULL AND sku IN (${clean.map(() => "?").join(",")})`)
    .all(...clean) as { sku: string; image: string }[];
  return new Map(rows.map((r) => [r.sku, r.image]));
}

/** Popular in-stock products of a category, for pre-filling gift ideas. */
export function popularInCategory(category: string, limit = 200): { sku: string; name: string; brand: string | null }[] {
  return catalogDb()
    .prepare(
      `SELECT sku, name, brand FROM products WHERE hidden = 0 AND stock > 0 AND image IS NOT NULL AND (category = ? OR subcategory = ?)
       ORDER BY popularity DESC LIMIT ?`,
    )
    .all(category, category, limit) as { sku: string; name: string; brand: string | null }[];
}

export function getAllProductSlugs(): { slug: string }[] {
  return catalogDb().prepare("SELECT slug FROM products WHERE hidden = 0 ORDER BY id").all() as { slug: string }[];
}
