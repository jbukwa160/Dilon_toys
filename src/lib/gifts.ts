import "server-only";
import { cache } from "react";
import { getProductsBySkus, popularInCategory, type ProductCard } from "./catalog";
import { getSavedGifts } from "./settings";
import { categoryLabel } from "./categories";
import {
  DEFAULT_GIFT_CATEGORIES,
  DEFAULT_GIFT_TEXT,
  GIFT_SIDES,
  type GiftIdeas,
  type GiftSection,
  type GiftSideKey,
} from "./settings-types";

// Keyword hints so automatic suggestions don't put a Barbie in "За момчета" (and vice versa).
const GIRLY =
  /barbie|барби|принцес|еднорог|кукл|пони|l\.o\.l|lol |gabby|габи|frozen|замръзналото|hello kitty|розов|фея|феи|бижу|грим|маникюр|козмет|friends|стич|stitch|балерин|русалк|minnie|мини маус|rainbow high|monster high|cry babies|baby born|пеперуд|котенц|коте |сърц|красота|прическ/i;
const BOYISH =
  /нърф|nerf|бластер|пистолет|танк|трансформър|transformers|батман|batman|спайдърмен|spider|джурасик|jurassic|динозав|ninjago|нинджаго|star wars|marvel|авенджърс|hot wheels|камион|багер|военн|minecraft|sonic|соник|technic|полиц|пожарн|трактор|робот|ракет|пират/i;

export function suggestSection(side: GiftSideKey, category: string, limit = 8): GiftSection {
  const avoid = side === "boys" ? GIRLY : BOYISH;
  const prefer = side === "boys" ? BOYISH : GIRLY;
  const pool = popularInCategory(category).filter((p) => !avoid.test(`${p.name} ${p.brand ?? ""}`));
  // Keep popularity order, but lead with clearly matching toys.
  const ranked = [...pool.filter((p) => prefer.test(p.name)), ...pool.filter((p) => !prefer.test(p.name))];
  return {
    id: `${side}-${category}`,
    title: categoryLabel(category),
    category,
    skus: ranked.slice(0, limit).map((p) => p.sku),
  };
}

export function suggestSide(side: GiftSideKey): GiftSection[] {
  return DEFAULT_GIFT_CATEGORIES[side].map((c) => suggestSection(side, c)).filter((s) => s.skus.length);
}

let fallback: { at: number; value: GiftIdeas } | null = null;

/** The admin's gift ideas, or automatic suggestions until they save their own. */
export function getGifts(): GiftIdeas {
  const saved = getSavedGifts();
  if (saved) return saved;
  if (!fallback || Date.now() - fallback.at > 10 * 60_000) {
    fallback = {
      at: Date.now(),
      value: {
        enabled: true,
        menuLabel: "Идеи за подаръци",
        boys: { ...DEFAULT_GIFT_TEXT.boys, sections: suggestSide("boys") },
        girls: { ...DEFAULT_GIFT_TEXT.girls, sections: suggestSide("girls") },
      },
    };
  }
  return fallback.value;
}

export type GiftPageSection = { id: string; title: string; category: string; products: ProductCard[] };

export function getGiftSections(side: GiftSideKey): GiftPageSection[] {
  const seen = new Set<number>(); // a product picked twice is shown once
  return getGifts()
    [side].sections.map((s) => ({
      id: s.id,
      title: s.title || (s.category ? categoryLabel(s.category) : "") || "Подаръци",
      category: s.category,
      products: getProductsBySkus(s.skus).filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      }),
    }))
    .filter((s) => s.products.length);
}

export type GiftSideSummary = {
  key: GiftSideKey;
  title: string;
  subtitle: string;
  count: number;
  sections: { id: string; title: string }[];
  images: string[];
};

export type GiftSummary = { enabled: boolean; menuLabel: string; boys: GiftSideSummary; girls: GiftSideSummary };

export const getGiftSummary = cache((): GiftSummary => {
  const g = getGifts();
  const summary = (key: GiftSideKey): GiftSideSummary => {
    const sections = getGiftSections(key);
    const products = sections.flatMap((s) => s.products);
    return {
      key,
      title: g[key].title,
      subtitle: g[key].subtitle,
      count: products.length,
      sections: sections.map((s) => ({ id: s.id, title: s.title })),
      images: products
        .filter((p) => p.stock > 0 && p.image)
        .slice(0, 3)
        .map((p) => p.image!),
    };
  };
  const [boys, girls] = GIFT_SIDES.map(summary);
  return { enabled: g.enabled, menuLabel: g.menuLabel, boys, girls };
});
