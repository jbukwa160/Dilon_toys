import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { brandNames } from "@/lib/admin/products";
import { categoryOptions } from "@/lib/categories";
import { PageHeader } from "@/components/admin/PageHeader";
import { PriceTools } from "@/components/admin/PriceTools";

export const metadata: Metadata = { title: "Цени и промоции" };

export default async function PricesPage() {
  await requireAdmin();
  const categories = categoryOptions().map((c) => ({ slug: c.slug, name: c.name, subs: c.subs }));
  return (
    <>
      <PageHeader
        title="Цени и промоции"
        description="Сменете много цени наведнъж — с Excel файл или с процент. Отделен продукт можете да промените и от „Продукти“."
      />
      <PriceTools categories={categories} brands={brandNames()} />
    </>
  );
}
