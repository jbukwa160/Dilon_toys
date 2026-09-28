import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { getGiftSections, getGiftSummary } from "@/lib/gifts";
import { GIFT_SIDE_BY_SLUG, GIFT_SIDE_SLUG } from "@/lib/settings-types";
import { findCategory } from "@/lib/categories";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GiftSplitHero, SIDE_STYLE } from "@/components/gifts/GiftSplitHero";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CategoryIcon } from "@/components/CategoryIcon";

type Props = { params: Promise<{ side: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const key = GIFT_SIDE_BY_SLUG[(await params).side];
  if (!key) return {};
  const s = getGiftSummary()[key];
  return { title: `Идеи за подаръци ${s.title.toLowerCase()}`, description: s.subtitle, alternates: { canonical: `/podaratsi/${GIFT_SIDE_SLUG[key]}` } };
}

export default async function GiftSidePage({ params }: Props) {
  const key = GIFT_SIDE_BY_SLUG[(await params).side];
  const summary = getGiftSummary();
  if (!key || !summary.enabled) notFound();
  const sections = getGiftSections(key);
  const side = summary[key];
  const st = SIDE_STYLE[key];

  return (
    <div className="container-shop pb-10">
      <Breadcrumbs items={[{ href: "/podaratsi", label: "Идеи за подаръци" }, { label: side.title }]} />
      <GiftSplitHero boys={summary.boys} girls={summary.girls} active={key} compact />

      {sections.length ? (
        <>
          <nav className="sticky top-[4.5rem] z-10 -mx-1 mt-6 flex gap-2 overflow-x-auto bg-canvas/95 px-1 py-3 backdrop-blur lg:top-[10.3rem]" aria-label="Категории подаръци">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#s-${s.id}`}
                className={clsx("chip shrink-0 !border-2", key === "boys" ? "hover:!border-sky-500 hover:!text-sky-700" : "hover:!border-pink-500 hover:!text-pink-700")}
              >
                {s.title} <span className="text-muted">{s.products.length}</span>
              </a>
            ))}
          </nav>
          <div className="mt-4 space-y-12">
            {sections.map((s) => {
              const cat = findCategory(s.category);
              return (
                <section key={s.id} id={`s-${s.id}`} className="scroll-mt-48">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-4 pb-3" style={{ borderColor: st.accent }}>
                    <h2 className="flex items-center gap-3 text-2xl font-black md:text-3xl">
                      {cat ? (
                        <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: cat.color, color: cat.accent }}>
                          <CategoryIcon icon={cat.icon} slug={cat.slug} className="h-6 w-6" />
                        </span>
                      ) : null}
                      {s.title}
                      <span className="text-base font-bold text-muted">{s.products.length}</span>
                    </h2>
                    {cat ? (
                      <Link href={`/kategoria/${cat.slug}`} className="inline-flex items-center gap-1 font-extrabold text-brand hover:underline">
                        Още в „{cat.name}“ <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : null}
                  </div>
                  <ProductGrid products={s.products} eagerCount={0} />
                </section>
              );
            })}
          </div>
        </>
      ) : (
        <p className="mt-8 rounded-3xl border border-dashed border-line bg-white p-10 text-center font-bold text-ink-soft">Скоро тук ще има подбрани подаръци.</p>
      )}
    </div>
  );
}
