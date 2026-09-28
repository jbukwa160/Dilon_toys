import "server-only";
import { getCategoryEntries } from "./settings";
import type { CategoryEntry, SubCategoryEntry } from "./category-config";

// Look-ups over the categories as edited in Admin → Категории.

export function findCategory(slug: string): CategoryEntry | undefined {
  return getCategoryEntries().find((c) => c.slug === slug);
}

/** A category or subcategory by its address. */
export function findCategoryOrSub(slug: string): { category: CategoryEntry; sub: SubCategoryEntry | null } | null {
  for (const c of getCategoryEntries()) {
    if (c.slug === slug) return { category: c, sub: null };
    const sub = c.subs.find((s) => s.slug === slug);
    if (sub) return { category: c, sub };
  }
  return null;
}

/** "Подкатегория" if there is one, otherwise the category's name (or the address if it no longer exists). */
export function categoryLabel(category: string, subcategory?: string | null): string {
  const c = findCategory(category);
  const sub = subcategory ? c?.subs.find((s) => s.slug === subcategory) : undefined;
  return sub?.name ?? c?.name ?? category;
}

/** For the admin's selects: every category (hidden ones too) with its subcategories. */
export function categoryOptions(): { slug: string; name: string; hidden: boolean; subs: { slug: string; name: string }[] }[] {
  return getCategoryEntries().map((c) => ({ slug: c.slug, name: c.name, hidden: c.hidden, subs: c.subs.map((s) => ({ slug: s.slug, name: s.name })) }));
}
