import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { catalogDb } from "@/lib/db";
import { getCategoryEntries } from "@/lib/settings";
import { PageHeader } from "@/components/admin/PageHeader";
import { CategoriesEditor } from "@/components/admin/CategoriesEditor";

export const metadata: Metadata = { title: "Категории" };

export default async function CategoriesPage() {
  await requireAdmin();
  const db = catalogDb();
  // Every product counts here (hidden ones too), so nothing is lost when a category is deleted.
  const rows = db.prepare("SELECT category, subcategory, COUNT(*) AS n FROM products GROUP BY category, subcategory").all() as {
    category: string;
    subcategory: string | null;
    n: number;
  }[];
  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.category] = (counts[r.category] ?? 0) + r.n;
    if (r.subcategory) counts[r.subcategory] = (counts[r.subcategory] ?? 0) + r.n;
  }
  const autoImages = Object.fromEntries(
    (db.prepare("SELECT slug, image FROM categories WHERE image IS NOT NULL").all() as { slug: string; image: string }[]).map((r) => [r.slug, r.image]),
  );
  return (
    <>
      <PageHeader
        title="Категории"
        description="Подредете, преименувайте, скрийте или добавете категории. Промените се виждат в бутона „Всички категории“, в менюто на телефона, на началната страница и долу в сайта."
      />
      <CategoriesEditor initial={getCategoryEntries()} counts={counts} autoImages={autoImages} />
    </>
  );
}
