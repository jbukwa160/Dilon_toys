"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { writeSetting } from "@/lib/settings";
import { normalizeGifts } from "@/lib/settings-normalize";
import type { GiftIdeas, GiftSection, GiftSideKey } from "@/lib/settings-types";
import { findCategory } from "@/lib/categories";
import { suggestSide } from "@/lib/gifts";
import { productInfosBySku, type ProductInfo } from "@/lib/admin/products";

export async function saveGiftsAction(input: GiftIdeas): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  const clean = normalizeGifts(input);
  if (!clean) return { error: "Невалидни данни." };
  // Drop SKUs that no longer exist and categories we don't know.
  const known = productInfosBySku([...clean.boys.sections, ...clean.girls.sections].flatMap((s) => s.skus));
  for (const side of ["boys", "girls"] as GiftSideKey[]) {
    clean[side].sections = clean[side].sections.map((s) => ({
      ...s,
      category: findCategory(s.category) ? s.category : "",
      skus: s.skus.filter((sku) => known[sku]),
    }));
  }
  writeSetting("gifts", clean);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function suggestGiftsAction(side: GiftSideKey): Promise<{ sections: GiftSection[]; infos: Record<string, ProductInfo> }> {
  await requireAdmin();
  const sections = suggestSide(side === "girls" ? "girls" : "boys").map((s) => ({ ...s, id: `${s.id}-${Date.now().toString(36)}` }));
  return { sections, infos: productInfosBySku(sections.flatMap((s) => s.skus)) };
}
