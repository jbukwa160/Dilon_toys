import "server-only";
import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { CATALOG_STRUCTURE_REV, ensureCatalogSchema, refreshAggregates } from "./catalog-write";
import { mergeCategories } from "./category-config";
import { RETIRED_CATEGORY_REDIRECTS } from "./taxonomy";
import { STORE_SCHEMA } from "./store-schema";

// DATA_DIR lets a second copy of the site (e.g. for testing) use its own data folder.
export const DATA_DIR = process.env.DATA_DIR ? path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR) : path.join(process.cwd(), "data");
const CATALOG_PATH = path.join(DATA_DIR, "catalog.db");
const STORE_PATH = path.join(DATA_DIR, "store.db");

// Reuse connections across hot reloads in development.
const g = globalThis as unknown as { __catalogDb?: Database.Database; __catalogRev?: number; __storeDb?: Database.Database; __storeRev?: number };

// Bump when STORE_SCHEMA or the migrations below change, so an already-open connection
// (e.g. a dev server that hot-reloaded) applies them too.
const STORE_SCHEMA_REV = 5;

/** Product catalogue (rebuilt by `npm run import`, edited by the admin panel). */
export function catalogDb(): Database.Database {
  if (!g.__catalogDb) {
    if (!fs.existsSync(CATALOG_PATH)) {
      throw new Error(`Catalog database not found at ${CATALOG_PATH}. Run "npm run import" first.`);
    }
    const db = new Database(CATALOG_PATH, { fileMustExist: true });
    db.pragma("busy_timeout = 5000");
    g.__catalogDb = db;
  }
  // Also for a connection that was already open (a dev server that hot-reloaded).
  if (g.__catalogRev !== CATALOG_STRUCTURE_REV) {
    const db = g.__catalogDb;
    if (ensureCatalogSchema(db)) {
      // Products moved between categories: recount, for the categories as edited in the admin.
      const saved = storeDb().prepare("SELECT value FROM settings WHERE key = 'categories'").get() as { value: string } | undefined;
      let categories: unknown;
      try {
        categories = saved ? JSON.parse(saved.value) : undefined;
      } catch {
        categories = undefined;
      }
      refreshAggregates(db, mergeCategories(categories));
    }
    g.__catalogRev = CATALOG_STRUCTURE_REV;
  }
  return g.__catalogDb;
}

/** Everything that must survive a catalogue re-import: orders, settings, admin edits, admin users. */
export function storeDb(): Database.Database {
  if (!g.__storeDb) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const db = new Database(STORE_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 5000");
    g.__storeDb = db;
  }
  if (g.__storeRev !== STORE_SCHEMA_REV) {
    const db = g.__storeDb;
    db.exec(STORE_SCHEMA);
    const orderCols = new Set((db.prepare("PRAGMA table_info(orders)").all() as { name: string }[]).map((c) => c.name));
    if (!orderCols.has("admin_note")) db.exec("ALTER TABLE orders ADD COLUMN admin_note TEXT");
    const editCols = new Set((db.prepare("PRAGMA table_info(product_edits)").all() as { name: string }[]).map((c) => c.name));
    if (!editCols.has("original")) db.exec("ALTER TABLE product_edits ADD COLUMN original TEXT");
    // Blog links to categories that were merged into others when the categories were regrouped.
    const retired = /\/kategoria\/(plyusheni|modeli-i-hobi)(?![\w-])/g;
    const posts = db.prepare("SELECT id, body FROM blog_posts WHERE body LIKE '%/kategoria/plyusheni%' OR body LIKE '%/kategoria/modeli-i-hobi%'").all() as { id: number; body: string }[];
    for (const p of posts) {
      const body = p.body.replace(retired, (_, s: string) => `/kategoria/${RETIRED_CATEGORY_REDIRECTS[s]}`);
      if (body !== p.body) db.prepare("UPDATE blog_posts SET body = ? WHERE id = ?").run(body, p.id);
    }
    g.__storeRev = STORE_SCHEMA_REV;
  }
  return g.__storeDb;
}
