import { WARNING_KEYS, type Audience } from "@/lib/toy-info";

/** The categories a product may be put in (see lib/categories.ts → categoryOptions). */
export type CategoryChoice = { slug: string; subs: { slug: string }[] };

export type ProductPayload = {
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  ean: string;
  price: string | number;
  oldPrice: string | number;
  stock: string | number;
  hidden: boolean;
  images: string[];
  description: string;
  color: string;
  pieces: string | number;
  /** Months as text ("" = not set). */
  ageMin: string | number | null;
  ageMax: string | number | null;
  audience: string;
  warnings: string[];
  batch: string;
  passport: string;
};

export type ValidProduct = {
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
  ageMin: number | null;
  ageMax: number | null;
  audience: Audience;
  warnings: string[];
  batch: string | null;
  passport: string | null;
};

/** "12,99" / "12.99" / "1 234,50 €" → 12.99 */
export function parseMoney(v: string | number | null | undefined): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
  if (v == null) return null;
  const t = String(v).replace(/[€\s ]/g, "").replace(/лв\.?/i, "");
  if (!t) return null;
  const normalised = t.includes(",") && t.includes(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(",", ".");
  const n = Number(normalised);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

export function parseCount(v: string | number | null | undefined): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? Math.floor(v) : null;
  if (v == null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(/[\s ]/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.floor(n) : null;
}

export function isImageUrl(u: string): boolean {
  return /^\/uploads\/[a-z0-9]+\.[a-z]+$/.test(u) || /^https?:\/\/[^\s<>"]+$/i.test(u);
}

export function validateProduct(p: ProductPayload, categories: CategoryChoice[]): { value?: ValidProduct; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = String(p.name ?? "").replace(/\s+/g, " ").trim();
  if (!name) errors.name = "Въведете име на продукта.";
  else if (name.length > 300) errors.name = "Името е твърде дълго (до 300 символа).";

  const category = String(p.category ?? "");
  const cat = categories.find((c) => c.slug === category);
  if (!cat) errors.category = "Изберете категория.";
  const sub = String(p.subcategory ?? "");
  const subcategory = sub && cat?.subs.some((s) => s.slug === sub) ? sub : null;

  const price = parseMoney(p.price);
  if (price == null || price <= 0) errors.price = "Въведете цена, по-голяма от 0 (напр. 19,99).";
  else if (price > 100000) errors.price = "Цената е твърде голяма.";

  const oldPriceRaw = parseMoney(p.oldPrice);
  let oldPrice: number | null = null;
  if (String(p.oldPrice ?? "").trim() !== "") {
    if (oldPriceRaw == null) errors.oldPrice = "Невалидна стара цена.";
    else if (price != null && oldPriceRaw <= price) errors.oldPrice = "Старата цена трябва да е по-висока от цената, иначе оставете полето празно.";
    else oldPrice = oldPriceRaw;
  }

  const stock = parseCount(p.stock);
  if (stock == null || stock < 0) errors.stock = "Въведете брой (0 или повече).";
  else if (stock > 1_000_000) errors.stock = "Твърде голямо число.";

  const ean = String(p.ean ?? "").replace(/\s/g, "");
  if (ean && !/^\d{8,14}$/.test(ean)) errors.ean = "Баркодът трябва да е от 8 до 14 цифри (или празно).";

  const images = (Array.isArray(p.images) ? p.images : []).map((u) => String(u).trim()).filter(Boolean);
  if (images.some((u) => !isImageUrl(u))) errors.images = "Има невалиден линк към снимка.";
  if (images.length > 12) errors.images = "Максимум 12 снимки.";

  const pieces = String(p.pieces ?? "").trim() === "" ? null : parseCount(p.pieces);
  if (pieces != null && (pieces < 1 || pieces > 100000)) errors.pieces = "Невалиден брой части.";

  const description = String(p.description ?? "").trim().slice(0, 5000) || null;
  const brand = String(p.brand ?? "").replace(/\s+/g, " ").trim().slice(0, 80) || null;
  const color = String(p.color ?? "").trim().slice(0, 60) || null;

  const months = (v: unknown) => (v == null || String(v).trim() === "" ? null : parseCount(v as string));
  const ageMin = months(p.ageMin);
  const ageMax = months(p.ageMax);
  if (ageMin != null && (ageMin < 0 || ageMin > 240)) errors.ageMin = "Невалидна възраст.";
  if (ageMax != null && (ageMax < 1 || ageMax > 240)) errors.ageMax = "Невалидна възраст.";
  if (ageMin != null && ageMax != null && ageMax <= ageMin) errors.ageMax = "Горната граница трябва да е по-голяма от долната.";
  if (ageMin == null && ageMax != null) errors.ageMin = "Изберете и „от“ възраст.";
  const audience: Audience = p.audience === "boys" || p.audience === "girls" ? p.audience : "all";
  const picked = new Set(Array.isArray(p.warnings) ? p.warnings : []);
  const warnings = WARNING_KEYS.filter((k) => picked.has(k));
  const batch = String(p.batch ?? "").replace(/\s+/g, " ").trim().slice(0, 60) || null;
  const passport = String(p.passport ?? "").trim();
  if (passport && !/^https?:\/\/[^\s<>"]+$/i.test(passport)) errors.passport = "Линкът трябва да започва с https://";

  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    value: {
      name,
      brand,
      category,
      subcategory,
      ean: ean || null,
      price: price!,
      oldPrice,
      stock: stock!,
      hidden: !!p.hidden,
      images: images.slice(0, 12),
      description,
      color,
      pieces,
      ageMin,
      ageMax,
      audience,
      warnings,
      batch,
      passport: passport ? passport.slice(0, 500) : null,
    },
  };
}
