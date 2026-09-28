import type { Metadata } from "next";
import Link from "next/link";
import { getBrands } from "@/lib/catalog";
import { Breadcrumbs, PageTitle } from "@/components/Breadcrumbs";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Марки", description: "Всички марки играчки в магазина — от LEGO и Playmobil до Ravensburger и Hape." };

export default function BrandsPage() {
  const brands = getBrands().filter((b) => b.count > 0);
  const groups = new Map<string, typeof brands>();
  for (const b of brands) {
    const first = b.name.trim().charAt(0).toUpperCase();
    const key = /[A-Z]/.test(first) ? first : /[А-Я]/.test(first) ? first : "0–9";
    groups.set(key, [...(groups.get(key) ?? []), b]);
  }
  const keys = [...groups.keys()].sort((a, b) => a.localeCompare(b, "bg"));
  const top = [...brands].sort((a, b) => b.inStock - a.inStock).slice(0, 12);

  return (
    <div className="container-shop pb-10">
      <Breadcrumbs items={[{ label: "Марки" }]} />
      <PageTitle title="Марки" subtitle={`${formatNumber(brands.length)} марки играчки`} />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {top.map((b) => (
          <Link key={b.slug} href={`/marka/${b.slug}`} className="rounded-2xl border border-line bg-white p-4 text-center transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
            <div className="truncate text-lg font-black">{b.name}</div>
            <div className="text-sm text-muted">{formatNumber(b.count)} продукта</div>
          </Link>
        ))}
      </div>

      <nav className="sticky top-[4.5rem] z-10 -mx-1 mb-6 flex flex-wrap gap-1 bg-canvas/95 px-1 py-2 backdrop-blur md:top-44" aria-label="Азбучен указател">
        {keys.map((k) => (
          <a key={k} href={`#b-${k}`} className="grid h-9 min-w-9 place-items-center rounded-lg bg-white px-2 text-sm font-extrabold ring-1 ring-line hover:bg-ink hover:text-white">
            {k}
          </a>
        ))}
      </nav>

      <div className="space-y-8">
        {keys.map((k) => (
          <section key={k} id={`b-${k}`} className="scroll-mt-60">
            <h2 className="mb-3 text-2xl font-black text-brand">{k}</h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-5">
              {groups.get(k)!.map((b) => (
                <li key={b.slug}>
                  <Link href={`/marka/${b.slug}`} className="flex justify-between gap-2 rounded-lg px-2 py-1 hover:bg-white">
                    <span className="truncate font-semibold">{b.name}</span>
                    <span className="text-sm text-muted">{b.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
