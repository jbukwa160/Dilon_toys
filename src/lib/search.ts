// Turns what a shopper types into an FTS5 query over product names/brands.

const SYNONYMS: Record<string, string> = {
  лего: "lego",
  барби: "barbie",
  плеймобил: "playmobil",
  фънко: "funko",
  нърф: "nerf",
  шлайх: "schleich",
  равенсбургер: "ravensburger",
  хотуилс: "hot",
  "пес-патрул": "пес",
  pazel: "пъзел",
  kukla: "кукла",
};

// Crude Bulgarian stemming: "пъзели" → "пъзел", "колички" → "количк", "куклата" → "кукл".
const ENDINGS = ["ите", "ата", "ята", "ото", "ът", "ят", "та", "те", "то", "ия", "ии", "и", "а", "я", "о", "е", "у", "ъ"];

function stem(token: string): string {
  if (!/[а-яё]/i.test(token) || token.length < 5) return token;
  for (const e of ENDINGS) {
    if (token.endsWith(e) && token.length - e.length >= 4) return token.slice(0, -e.length);
  }
  return token;
}

export function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .normalize("NFC")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 0)
    .slice(0, 8);
}

/** FTS5 MATCH expression, or null if nothing searchable was typed. */
export function ftsQuery(q: string): string | null {
  const tokens = tokenize(q);
  if (!tokens.length) return null;
  return tokens
    .map((t) => SYNONYMS[t] ?? t)
    .map(stem)
    .map((t) => `"${t.replace(/"/g, "")}"*`)
    .join(" AND ");
}

// ---------------------------------------------------------------------------
// Product codes: SKU ("Dilon-108965") and barcode (EAN / UPC, "3800123456789")

type Code = { text: string; digits: string | null };

/** One word with digits in it — a SKU or barcode typed or scanned into a search box. Barcodes printed as "5 901234 123457" count too. */
function codeQuery(q: string): Code | null {
  const text = q.trim();
  const compact = text.replace(/\s+/g, "");
  if (/^\d{4,14}$/.test(compact)) return { text: compact, digits: compact };
  if (text.length > 40 || !/\d/.test(text) || !/^[\p{L}\p{N}._/-]+$/u.test(text)) return null;
  return { text, digits: null };
}

/** A barcode without its leading zeros — Excel drops them and scanners add one to 12-digit UPC codes, so compare this. */
export function barcodeKey(ean: string): string {
  return ean.replace(/\D/g, "").replace(/^0+/, "");
}

/** FTS5 expression for a barcode with any number of leading zeros, or null if it is too short to be one. */
function barcodeFts(digits: string): string | null {
  const core = barcodeKey(digits);
  if (digits.length < 8 || core.length < 6) return null;
  const variants: string[] = [];
  for (let v = core; v.length <= 14; v = `0${v}`) variants.push(`"${v}"`);
  return `ean : (${variants.join(" OR ")})`;
}

const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Body of a `WITH m AS (…)` returning (id, exact, rank) for everything a search should find:
 * exact = 2 — the SKU or barcode is exactly what was typed; 1 — it contains it (admin only);
 * 0 — name / brand / code prefix matches, best `rank` first.
 * The shop pins only whole codes, since a bare number like 60350 is more often a LEGO set than a SKU;
 * the admin also finds a SKU by its number alone and codes by any part.
 */
export function searchMatchSql(q: string, { admin = false } = {}): { sql: string; params: string[] } | null {
  const parts: string[] = [];
  const params: string[] = [];
  const code = codeQuery(q);
  if (code) {
    const exact = ["p.sku = ? COLLATE NOCASE"];
    params.push(code.text);
    if (admin && code.digits) {
      exact.push("p.sku LIKE ?");
      params.push(`%-${code.digits}`);
    }
    const ean = code.digits ? barcodeFts(code.digits) : null;
    if (ean) {
      exact.push("p.id IN (SELECT rowid FROM products_fts WHERE products_fts MATCH ?)");
      params.push(ean);
    }
    parts.push(`SELECT p.id, 2 AS exact, 0 AS rank FROM products p WHERE ${exact.join(" OR ")}`);
    if (admin) {
      const like = `%${likeEscape(code.text)}%`;
      const partial = ["p.sku LIKE ? ESCAPE '\\'"];
      params.push(like);
      if (code.digits) {
        partial.push("p.ean LIKE ?");
        params.push(like);
      }
      parts.push(`SELECT p.id, 1 AS exact, 0 AS rank FROM products p WHERE ${partial.join(" OR ")}`);
    }
  }
  const fts = ftsQuery(q);
  if (fts) {
    // Columns: name, brand, sku, ean — a number in a product's name outranks the same digits at the start of some other SKU.
    parts.push("SELECT rowid AS id, 0 AS exact, rank FROM products_fts WHERE products_fts MATCH ? AND rank MATCH 'bm25(1, 1, 0.1, 0.1)'");
    params.push(fts);
  }
  if (!parts.length) return null;
  return { sql: `SELECT id, MAX(exact) AS exact, MIN(rank) AS rank FROM (${parts.join(" UNION ALL ")}) GROUP BY id`, params };
}
