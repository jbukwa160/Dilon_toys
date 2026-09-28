import type { Metadata } from "next";
import { Listing } from "@/components/listing/Listing";
import { Breadcrumbs, PageTitle } from "@/components/Breadcrumbs";
import { getMeta } from "@/lib/catalog";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Всички играчки", description: "Всички детски играчки в магазина — филтрирайте по категория, марка, цена и герои." };

export default async function AllPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { productCount } = getMeta();
  return (
    <div className="container-shop pb-10">
      <Breadcrumbs items={[{ label: "Всички играчки" }]} />
      <PageTitle title="Всички играчки" subtitle={`${formatNumber(productCount)} продукта от стотици марки`} />
      <Listing scope={{ kind: "all" }} basePath="/igrachki" searchParams={await searchParams} />
    </div>
  );
}
