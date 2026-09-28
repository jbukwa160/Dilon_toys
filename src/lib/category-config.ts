// Categories as the admin edited them (Admin → Категории), on top of the built-in ones in taxonomy.ts.
// Shared by the site and the CSV importer, so no server-only imports here.
//
// Addresses (slugs) never change — renaming a category keeps its /kategoria/… link. Built-in categories and
// subcategories can be renamed, re-ordered and hidden but not deleted (the importer sorts products into them);
// categories and subcategories the admin added can be deleted.
import { CATEGORIES, RETIRED_CATEGORY_REDIRECTS } from "./taxonomy";
import { parseColor } from "./settings-types";

export const CATEGORY_ICONS = [
  "toy-brick", "blocks", "crown", "car", "train", "plane", "rocket", "bike", "shapes", "rabbit", "dog", "cat", "fish",
  "puzzle", "dice", "gamepad", "palette", "pencil", "book", "microscope", "baby", "wand", "drama", "crosshair", "music",
  "bot", "backpack", "lamp", "tree", "tent", "castle", "volleyball", "trophy", "waves", "umbrella", "bath", "shirt",
  "candy", "cake", "party", "gift", "star", "heart", "sparkles", "snowflake", "sun", "ghost", "flame", "tag", "percent",
] as const;
export type CategoryIconName = (typeof CATEGORY_ICONS)[number];

const DEFAULT_ICON: Record<string, CategoryIconName> = {
  konstruktori: "toy-brick",
  kukli: "crown",
  "prevozni-sredstva": "car",
  figurki: "shapes",
  plyusheni: "rabbit",
  pazeli: "puzzle",
  "nastolni-igri": "dice",
  tvorchestvo: "palette",
  obrazovatelni: "microscope",
  bebeshki: "baby",
  "rolevi-igri": "wand",
  "na-otkrito": "bike",
  blasteri: "crosshair",
  muzikalni: "music",
  interaktivni: "bot",
  "modeli-i-hobi": "plane",
  "za-uchilishte": "backpack",
  aksesoari: "lamp",
  darveni: "tree",
  "drugi-igrachki": "gift",
};

export function defaultIcon(slug: string): CategoryIconName {
  return DEFAULT_ICON[slug] ?? "gift";
}

export type SubCategoryEntry = { slug: string; name: string; hidden: boolean; builtIn: boolean };

export type CategoryEntry = {
  slug: string;
  name: string;
  tagline: string;
  /** Tile background. */
  color: string;
  /** Tile text / icon. */
  accent: string;
  icon: CategoryIconName;
  /** Picture chosen by the admin; empty = the most popular product's picture. */
  image: string;
  /** Hidden from the menu, home page and footer (its page and products still work). */
  hidden: boolean;
  builtIn: boolean;
  subs: SubCategoryEntry[];
};

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

function image(v: unknown): string {
  const t = typeof v === "string" ? v.trim() : "";
  if (/^\/uploads\/[a-z0-9]+\.[a-z]+$/.test(t)) return t;
  if (/^https?:\/\/[^\s<>"]+$/i.test(t)) return t.slice(0, 1000);
  return "";
}

export function defaultCategories(): CategoryEntry[] {
  return CATEGORIES.map((c) => ({
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    color: c.color.toLowerCase(),
    accent: c.accent.toLowerCase(),
    icon: defaultIcon(c.slug),
    image: "",
    hidden: false,
    builtIn: true,
    subs: c.subs.map((s) => ({ slug: s.slug, name: s.name, hidden: false, builtIn: true })),
  }));
}

/** Saved categories (store.db → settings "categories") merged with the built-in ones and cleaned up. */
export function mergeCategories(saved: unknown): CategoryEntry[] {
  const defaults = defaultCategories();
  const builtIn = new Map(defaults.map((c) => [c.slug, c]));
  const builtInSub = new Map(defaults.flatMap((c) => c.subs.map((s) => [s.slug, c.slug] as const)));
  const raw = isObj(saved) && Array.isArray(saved.categories) ? saved.categories : Array.isArray(saved) ? saved : [];
  const used = new Set<string>();
  const out: CategoryEntry[] = [];

  for (const r of raw.slice(0, 80)) {
    if (!isObj(r) || typeof r.slug !== "string" || !SLUG_RE.test(r.slug) || r.slug.length > 60 || used.has(r.slug)) continue;
    // A built-in subcategory can't become a category of its own; retired categories are gone.
    if (builtInSub.has(r.slug) || r.slug in RETIRED_CATEGORY_REDIRECTS) continue;
    const d = builtIn.get(r.slug);
    used.add(r.slug);
    const subs: SubCategoryEntry[] = [];
    for (const s of Array.isArray(r.subs) ? r.subs.slice(0, 60) : []) {
      if (!isObj(s) || typeof s.slug !== "string" || !SLUG_RE.test(s.slug) || s.slug.length > 60 || used.has(s.slug) || builtIn.has(s.slug)) continue;
      const owner = builtInSub.get(s.slug);
      if (owner && owner !== r.slug) continue; // built-in subcategories stay under their category
      const ds = d?.subs.find((x) => x.slug === s.slug);
      used.add(s.slug);
      subs.push({ slug: s.slug, name: text(s.name, 60) || ds?.name || s.slug, hidden: s.hidden === true, builtIn: !!ds });
    }
    // Built-in subcategories missing from the saved list come back at the end.
    for (const ds of d?.subs ?? []) {
      if (used.has(ds.slug)) continue;
      used.add(ds.slug);
      subs.push({ ...ds });
    }
    const icon = typeof r.icon === "string" && (CATEGORY_ICONS as readonly string[]).includes(r.icon) ? (r.icon as CategoryIconName) : (d?.icon ?? "gift");
    out.push({
      slug: r.slug,
      name: text(r.name, 60) || d?.name || r.slug,
      tagline: typeof r.tagline === "string" ? text(r.tagline, 120) : (d?.tagline ?? ""),
      color: parseColor(String(r.color ?? "")) ?? d?.color ?? "#f1f5f9",
      accent: parseColor(String(r.accent ?? "")) ?? d?.accent ?? "#475569",
      icon,
      image: image(r.image),
      hidden: r.hidden === true,
      builtIn: !!d,
      subs,
    });
  }
  // Built-in categories missing from the saved list (e.g. added to the code later) come back at the end.
  for (const d of defaults) {
    if (used.has(d.slug)) continue;
    used.add(d.slug);
    const subs = d.subs.filter((s) => !used.has(s.slug));
    subs.forEach((s) => used.add(s.slug));
    out.push({ ...d, subs });
  }
  return out;
}
