import { EMPTY_FILTERS, PRICE_BUCKETS, SORTS, type Filters, type SortKey } from "./catalog";
import { AGE_BUCKETS, AUDIENCE_PARAM, type AgeBucketKey, type Audience } from "./toy-info";

export type RawParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function many(v: string | string[] | undefined): string[] {
  if (!v) return [];
  const list = Array.isArray(v) ? v : [v];
  return [...new Set(list.flatMap((s) => s.split(",")).map((s) => s.trim()).filter(Boolean))].slice(0, 20);
}

export type ListingParams = { filters: Filters; sort: SortKey; page: number };

export function parseListingParams(sp: RawParams, defaultSort: SortKey = "popular"): ListingParams {
  const price = one(sp.cena);
  const age = one(sp.vazrast);
  const za = one(sp.za);
  const audience = (Object.keys(AUDIENCE_PARAM) as Audience[]).find((k) => AUDIENCE_PARAM[k] === za) ?? null;
  const sort = one(sp.sort);
  const page = parseInt(one(sp.page) ?? "1", 10);
  return {
    filters: {
      ...EMPTY_FILTERS,
      brands: many(sp.marka),
      price: PRICE_BUCKETS.some((b) => b.key === price) ? price : null,
      inStock: one(sp.nalichni) === "1",
      sale: one(sp.promo) === "1",
      category: one(sp.kat),
      series: one(sp.geroi),
      age: AGE_BUCKETS.some((b) => b.key === age) ? (age as AgeBucketKey) : null,
      audience,
    },
    sort: SORTS.some((s) => s.key === sort) ? (sort as SortKey) : defaultSort,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Serialise listing state back into a URL, applying `patch` on top. */
export function listingHref(
  base: string,
  state: ListingParams & { q?: string },
  patch: Partial<{
    brands: string[];
    price: string | null;
    inStock: boolean;
    sale: boolean;
    category: string | null;
    series: string | null;
    age: AgeBucketKey | null;
    audience: Audience | null;
    sort: SortKey;
    page: number;
  }>,
  defaultSort: SortKey = "popular",
): string {
  const f = { ...state.filters, ...patch };
  const sort = patch.sort ?? state.sort;
  // Any filter change sends the shopper back to page 1.
  const page = patch.page ?? (Object.keys(patch).some((k) => k !== "sort") ? 1 : state.page);
  const u = new URLSearchParams();
  if (state.q) u.set("q", state.q);
  if (f.category) u.set("kat", f.category);
  if (f.brands.length) u.set("marka", f.brands.join(","));
  if (f.price) u.set("cena", f.price);
  if (f.series) u.set("geroi", f.series);
  if (f.age) u.set("vazrast", f.age);
  if (f.audience) u.set("za", AUDIENCE_PARAM[f.audience]);
  if (f.inStock) u.set("nalichni", "1");
  if (f.sale) u.set("promo", "1");
  if (sort !== defaultSort) u.set("sort", sort);
  if (page > 1) u.set("page", String(page));
  const qs = u.toString();
  return qs ? `${base}?${qs}` : base;
}
