import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getCategories, getHeroProducts, getSeriesList } from "@/lib/catalog";
import { getHomeContent } from "@/lib/settings";
import { getLinkOptions } from "@/lib/admin/link-options";
import { PageHeader } from "@/components/admin/PageHeader";
import { HomeEditor } from "@/components/admin/HomeEditor";

export const metadata: Metadata = { title: "Начална страница" };

export default async function HomeEditorPage() {
  await requireAdmin();
  const collage = getHeroProducts().map((p) => ({ id: p.id, slug: p.slug, name: p.name, image: p.image }));
  const autoImages: Record<string, string | null> = {};
  for (const c of getCategories()) {
    autoImages[`/kategoria/${c.slug}`] = c.image;
    for (const s of c.subs) autoImages[`/kategoria/${s.slug}`] = s.image;
  }
  for (const s of getSeriesList()) autoImages[`/geroi/${s.slug}`] = s.image;

  return (
    <>
      <PageHeader
        title="Начална страница"
        description="Сменете банерите, текстовете и бутоните на началната страница. Промените се виждат в сайта веднага след „Запази“."
      />
      <HomeEditor initial={getHomeContent()} linkOptions={getLinkOptions()} collage={collage} autoImages={autoImages} />
    </>
  );
}
