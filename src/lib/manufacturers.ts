import "server-only";
import { catalogDb, storeDb } from "./db";

// Manufacturer and EU responsible person per brand (General Product Safety Regulation 2023/988):
// entered once in Admin → Производители and shown on every product of the brand.

export type Manufacturer = {
  /** Registered name or trade mark of the manufacturer. */
  name: string;
  address: string;
  email: string;
  website: string;
  /** Only when the manufacturer is outside the EU: importer or authorised representative in the EU. */
  euName: string;
  euAddress: string;
  euEmail: string;
};

export const EMPTY_MANUFACTURER: Manufacturer = { name: "", address: "", email: "", website: "", euName: "", euAddress: "", euEmail: "" };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

export function normalizeManufacturer(raw: unknown): Manufacturer {
  const r = (typeof raw === "object" && raw ? raw : {}) as Record<string, unknown>;
  const website = clean(r.website, 200);
  return {
    name: clean(r.name, 120),
    address: clean(r.address, 300),
    email: clean(r.email, 120),
    website: website && !/^https?:\/\//i.test(website) ? `https://${website}` : website,
    euName: clean(r.euName, 120),
    euAddress: clean(r.euAddress, 300),
    euEmail: clean(r.euEmail, 120),
  };
}

export function isFilled(m: Manufacturer | null | undefined): boolean {
  return !!m && !!m.name && !!(m.address || m.email);
}

export function getManufacturer(brandSlug: string | null): Manufacturer | null {
  if (!brandSlug) return null;
  const row = storeDb().prepare("SELECT data FROM manufacturers WHERE brand_slug = ?").get(brandSlug) as { data: string } | undefined;
  if (!row) return null;
  try {
    return normalizeManufacturer(JSON.parse(row.data));
  } catch {
    return null;
  }
}

export function saveManufacturer(brandSlug: string, data: Manufacturer) {
  const m = normalizeManufacturer(data);
  if (!Object.values(m).some(Boolean)) {
    storeDb().prepare("DELETE FROM manufacturers WHERE brand_slug = ?").run(brandSlug);
    return;
  }
  storeDb()
    .prepare("INSERT INTO manufacturers (brand_slug, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(brand_slug) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at")
    .run(brandSlug, JSON.stringify(m), new Date().toISOString());
}

export type BrandRow = { slug: string; name: string; count: number; data: Manufacturer | null };

/** Brands (most products first) with their manufacturer data. */
export function listBrandManufacturers(): BrandRow[] {
  const brands = catalogDb().prepare("SELECT slug, name, count FROM brands ORDER BY count DESC, name").all() as { slug: string; name: string; count: number }[];
  const saved = new Map(
    (storeDb().prepare("SELECT brand_slug, data FROM manufacturers").all() as { brand_slug: string; data: string }[]).map((r) => {
      try {
        return [r.brand_slug, normalizeManufacturer(JSON.parse(r.data))] as const;
      } catch {
        return [r.brand_slug, null] as const;
      }
    }),
  );
  return brands.map((b) => ({ ...b, data: saved.get(b.slug) ?? null }));
}
