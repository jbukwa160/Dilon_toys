import type { Metadata } from "next";
import Link from "next/link";
import { getSeriesList } from "@/lib/catalog";
import { Breadcrumbs, PageTitle } from "@/components/Breadcrumbs";
import { ProductImage } from "@/components/product/ProductImage";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Любими герои", description: "Играчки с любимите герои — Пес Патрул, Frozen, Barbie, Marvel, Star Wars и още." };

export default function SeriesIndex() {
  const series = getSeriesList();
  return (
    <div className="container-shop pb-10">
      <Breadcrumbs items={[{ label: "Герои" }]} />
      <PageTitle title="Любими герои" subtitle="Играчки с героите от любимите филми и анимации" />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {series.map((s) => (
          <li key={s.slug}>
            <Link href={`/geroi/${s.slug}`} className="group flex flex-col items-center gap-3 rounded-3xl border border-line bg-white p-5 text-center transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
              <span className="aspect-square w-full overflow-hidden rounded-full bg-sun-soft p-4 transition group-hover:scale-105">
                <ProductImage src={s.image} alt="" />
              </span>
              <span className="font-black leading-tight">{s.name}</span>
              <span className="text-sm text-muted">{formatNumber(s.count)} продукта</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
