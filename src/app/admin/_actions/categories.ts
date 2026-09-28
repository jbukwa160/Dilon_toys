"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { catalogDb } from "@/lib/db";
import { getCategoryEntries, writeSetting } from "@/lib/settings";
import { SLUG_RE, defaultCategories, mergeCategories, type CategoryEntry } from "@/lib/category-config";
import { refreshAggregates, type ProductEdit } from "@/lib/catalog-write";
import { saveProductEdits } from "@/lib/admin/products";

export type CategoriesInput = {
  categories: CategoryEntry[];
  /** Deleted categories (that had products) → the category their products move to. */
  moves: Record<string, string>;
};

export async function saveCategoriesAction(input: CategoriesInput): Promise<{ ok?: boolean; moved?: number; error?: string }> {
  await requireAdmin();
  const raw = Array.isArray(input?.categories) ? input.categories : [];
  if (!raw.length) return { error: "Трябва да има поне една категория." };

  // Names and addresses.
  const builtInSlugs = new Set(defaultCategories().flatMap((c) => [c.slug, ...c.subs.map((s) => s.slug)]));
  const seen = new Set<string>();
  for (const c of raw) {
    if (!String(c?.name ?? "").trim()) return { error: "Всяка категория трябва да има име." };
    for (const s of c.subs ?? []) if (!String(s?.name ?? "").trim()) return { error: `Всяка подкатегория в „${c.name}“ трябва да има име.` };
    for (const slug of [c.slug, ...(c.subs ?? []).map((s) => s.slug)]) {
      if (typeof slug !== "string" || !SLUG_RE.test(slug)) return { error: `Невалиден адрес „${slug}“.` };
      if (seen.has(slug)) return { error: `Две категории имат еднакъв адрес „${slug}“ — дайте им различни имена.` };
      seen.add(slug);
    }
  }
  const before = getCategoryEntries();
  const next = mergeCategories({ categories: raw });
  const kept = new Set(next.flatMap((c) => [c.slug, ...c.subs.map((s) => s.slug)]));
  const nextCats = new Set(next.map((c) => c.slug));

  // Products of deleted categories / subcategories.
  const db = catalogDb();
  const changes: { sku: string; edit: ProductEdit }[] = [];
  const removedCats = before.filter((c) => !c.builtIn && !kept.has(c.slug) && !builtInSlugs.has(c.slug));
  for (const c of removedCats) {
    const skus = (db.prepare("SELECT sku FROM products WHERE category = ?").all(c.slug) as { sku: string }[]).map((r) => r.sku);
    if (!skus.length) continue;
    const target = input.moves?.[c.slug];
    if (!target || !nextCats.has(target)) return { error: `Изберете къде да отидат продуктите от „${c.name}“, преди да я изтриете.` };
    for (const sku of skus) changes.push({ sku, edit: { category: target, subcategory: null } });
  }
  const movedSkus = new Set(changes.map((c) => c.sku));
  for (const c of before) {
    for (const s of c.subs) {
      if (s.builtIn || kept.has(s.slug)) continue;
      const skus = (db.prepare("SELECT sku FROM products WHERE subcategory = ?").all(s.slug) as { sku: string }[]).map((r) => r.sku);
      // They stay in the category, just without a subcategory.
      for (const sku of skus) if (!movedSkus.has(sku)) changes.push({ sku, edit: { subcategory: null } });
    }
  }

  const moved = changes.length ? saveProductEdits(changes) : 0;
  writeSetting("categories", { categories: next });
  refreshAggregates(db, next);
  revalidatePath("/", "layout");
  return { ok: true, moved };
}
