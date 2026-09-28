import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getGifts } from "@/lib/gifts";
import { getSavedGifts } from "@/lib/settings";
import { productInfosBySku } from "@/lib/admin/products";
import { categoryOptions } from "@/lib/categories";
import { PageHeader } from "@/components/admin/PageHeader";
import { GiftsEditor } from "@/components/admin/GiftsEditor";

export const metadata: Metadata = { title: "Идеи за подаръци" };

export default async function AdminGiftsPage() {
  await requireAdmin();
  const gifts = getGifts();
  const skus = [...gifts.boys.sections, ...gifts.girls.sections].flatMap((s) => s.skus);
  return (
    <>
      <PageHeader
        title="Идеи за подаръци"
        description="Подберете подаръци за момчета и за момичета. Продуктите се подреждат по категории — местете ги със стрелките или като ги провлачите с мишката."
      />
      <GiftsEditor
        initial={gifts}
        isSaved={getSavedGifts() !== null}
        infos={productInfosBySku(skus)}
        categories={categoryOptions().map((c) => ({ slug: c.slug, name: c.name }))}
      />
    </>
  );
}
