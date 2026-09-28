import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { RETIRED_CATEGORY_REDIRECTS } from "@/lib/taxonomy";
import { resolveCategory } from "@/lib/catalog";
import { Listing } from "@/components/listing/Listing";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategoryIcon } from "@/components/CategoryIcon";
import { formatNumber } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = resolveCategory(slug);
  if (!r) return {};
  const name = r.sub?.name ?? r.category.name;
  return {
    title: name,
    description: `${name} — ${r.category.tagline}. Разгледайте ${formatNumber(r.sub?.count ?? r.category.count)} продукта с бонус точки за всяка покупка.`,
    alternates: { canonical: `/kategoria/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const r = resolveCategory(slug);
  if (!r) {
    const moved = RETIRED_CATEGORY_REDIRECTS[slug];
    if (moved) permanentRedirect(`/kategoria/${moved}`);
    notFound();
  }
  const { category: c, sub } = r;
  const sp = await searchParams;

  return (
    <div className="container-shop pb-10">
      <Breadcrumbs items={sub ? [{ href: `/kategoria/${c.slug}`, label: c.name }, { label: sub.name }] : [{ label: c.name }]} />

      <div className="relative mb-7 flex items-center gap-5 overflow-hidden rounded-3xl p-6 md:p-8" style={{ background: c.color }}>
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/80 md:h-20 md:w-20" style={{ color: c.accent }}>
          <CategoryIcon icon={c.icon} slug={c.slug} className="h-8 w-8 md:h-10 md:w-10" />
        </span>
        <div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl" style={{ color: c.accent }}>
            {sub?.name ?? c.name}
          </h1>
          <p className="mt-1 font-semibold text-ink/70">
            {sub ? `${c.name} · ` : `${c.tagline} · `}
            {formatNumber(sub?.count ?? c.count)} продукта
          </p>
        </div>
      </div>

      <Listing
        scope={sub ? { kind: "sub", slug: sub.slug, parent: c.slug } : { kind: "category", slug: c.slug }}
        basePath={`/kategoria/${slug}`}
        searchParams={sp}
        subNavTitle={c.name}
        subNav={
          c.subs.length
            ? [{ slug: c.slug, name: "Всички", count: c.count, active: !sub }, ...c.subs.map((s) => ({ slug: s.slug, name: s.name, count: s.count, active: sub?.slug === s.slug }))]
            : undefined
        }
      />
    </div>
  );
}
