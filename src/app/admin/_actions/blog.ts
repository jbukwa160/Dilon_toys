"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { deletePost, getPost, savePost, type BlogPostInput } from "@/lib/blog";
import { productCardsBySku, type ProductCard } from "@/lib/catalog";

export async function saveBlogPostAction(id: number | null, input: BlogPostInput): Promise<{ ok?: boolean; id?: number; slug?: string; error?: string }> {
  await requireAdmin();
  const r = savePost(id, input);
  if ("error" in r) return { error: r.error };
  revalidatePath("/", "layout");
  return { ok: true, id: r.id, slug: r.slug };
}

export async function deleteBlogPostAction(id: number): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  if (!getPost(id)) return { error: "Статията вече е изтрита." };
  deletePost(id);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Product cards for the editor's preview. */
export async function blogPreviewProductsAction(skus: string[]): Promise<Record<string, ProductCard>> {
  await requireAdmin();
  return productCardsBySku(Array.isArray(skus) ? skus.filter((s) => typeof s === "string").slice(0, 60) : []);
}
