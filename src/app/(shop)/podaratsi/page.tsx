import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getGiftSections, getGiftSummary } from "@/lib/gifts";
import { GIFT_SIDE_SLUG, type GiftSideKey } from "@/lib/settings-types";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GiftSplitHero, SIDE_STYLE } from "@/components/gifts/GiftSplitHero";
import { ProductShelf } from "@/components/product/ProductGrid";

// Also refreshed immediately whenever something is saved in the admin panel.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Идеи за подаръци",
  description: "Подбрани подаръци за момчета и момичета — конструктори, кукли, колички, творчество и още.",
};

export default function GiftsPage() {
  const s = getGiftSummary();
  if (!s.enabled) notFound();
  const preview = (key: GiftSideKey) => getGiftSections(key).flatMap((sec) => sec.products).filter((p) => p.stock > 0).slice(0, 12);
  return (
    <div className="pb-6">
      <div className="container-shop">
        <Breadcrumbs items={[{ label: "Идеи за подаръци" }]} />
        <GiftSplitHero boys={s.boys} girls={s.girls} />
      </div>
      {(["boys", "girls"] as GiftSideKey[]).map((key) => (
        <ProductShelf
          key={key}
          title={`${s[key].title}: любими подаръци`}
          subtitle={s[key].subtitle}
          href={`/podaratsi/${GIFT_SIDE_SLUG[key]}`}
          products={preview(key)}
          accent={<span className="h-7 w-2 rounded-full" style={{ background: SIDE_STYLE[key].accent }} />}
        />
      ))}
      <div className="container-shop flex flex-wrap justify-center gap-3">
        {(["boys", "girls"] as GiftSideKey[]).map((key) => (
          <Link key={key} href={`/podaratsi/${GIFT_SIDE_SLUG[key]}`} className={`btn h-12 px-7 ${SIDE_STYLE[key].button}`}>
            Всички идеи {key === "boys" ? "за момчета" : "за момичета"} <ArrowRight className="h-4 w-4" />
          </Link>
        ))}
      </div>
    </div>
  );
}
