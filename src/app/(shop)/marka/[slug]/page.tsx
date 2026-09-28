import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrand } from "@/lib/catalog";
import { Listing } from "@/components/listing/Listing";
import { Breadcrumbs, PageTitle } from "@/components/Breadcrumbs";
import { formatNumber } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brand = getBrand((await params).slug);
  if (!brand) return {};
  return {
    title: `${brand.name} играчки`,
    description: `Всички играчки на ${brand.name} — ${formatNumber(brand.count)} продукта с бонус точки и бърза доставка.`,
    alternates: { canonical: `/marka/${brand.slug}` },
  };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) notFound();
  return (
    <div className="container-shop pb-10">
      <Breadcrumbs items={[{ href: "/marki", label: "Марки" }, { label: brand.name }]} />
      <PageTitle title={brand.name} subtitle={`${formatNumber(brand.count)} продукта · ${formatNumber(brand.inStock)} налични`} />
      <Listing scope={{ kind: "brand", slug }} basePath={`/marka/${slug}`} searchParams={await searchParams} />
    </div>
  );
}
