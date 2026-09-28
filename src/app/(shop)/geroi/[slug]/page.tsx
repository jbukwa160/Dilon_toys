import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSeries } from "@/lib/catalog";
import { Listing } from "@/components/listing/Listing";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductImage } from "@/components/product/ProductImage";
import { formatNumber } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = getSeries((await params).slug);
  if (!s) return {};
  return {
    title: `${s.name} — играчки`,
    description: `Играчки с ${s.name}: ${formatNumber(s.count)} продукта — фигурки, пъзели, конструктори и още.`,
    alternates: { canonical: `/geroi/${s.slug}` },
  };
}

export default async function SeriesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const s = getSeries(slug);
  if (!s) notFound();
  return (
    <div className="container-shop pb-10">
      <Breadcrumbs items={[{ href: "/geroi", label: "Герои" }, { label: s.name }]} />
      <div className="mb-7 flex items-center gap-5 rounded-3xl bg-sun-soft p-6 md:p-8">
        <span className="h-20 w-20 shrink-0 rounded-full border-4 border-white bg-white p-2 md:h-24 md:w-24">
          <ProductImage src={s.image} alt="" />
        </span>
        <div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">{s.name}</h1>
          <p className="mt-1 font-semibold text-ink/70">{formatNumber(s.count)} играчки с любимите герои</p>
        </div>
      </div>
      <Listing scope={{ kind: "series", slug }} basePath={`/geroi/${slug}`} searchParams={await searchParams} />
    </div>
  );
}
