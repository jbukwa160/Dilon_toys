import Link from "next/link";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { THEMES, isExternalHref, type PromoCard } from "@/lib/settings-types";
import { ProductImage } from "@/components/product/ProductImage";

/** Row of promo banners under the hero. `autoImage` fills in a picture when the admin didn't upload one. */
export function PromoCards({ cards, autoImage = {} }: { cards: PromoCard[]; autoImage?: Record<string, string | null> }) {
  if (!cards.length) return null;
  return (
    <div className={clsx("grid gap-4", cards.length === 1 ? "" : cards.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3")}>
      {cards.map((c) => {
        const theme = THEMES[c.theme];
        const image = c.image || autoImage[c.id] || null;
        const body = (
          <>
            <div className="relative z-10 flex max-w-[62%] flex-col">
              <span className="text-2xl font-black leading-tight">{c.title}</span>
              {c.text ? <span className={clsx("mt-1.5 text-sm font-semibold", theme.dark ? "text-white/85" : "text-ink/70")}>{c.text}</span> : null}
              {c.buttonLabel ? (
                <span className={clsx("mt-4 inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold", theme.dark ? "bg-white text-ink" : "bg-ink text-white")}>
                  {c.buttonLabel} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              ) : null}
            </div>
            {image ? (
              <span className="absolute -bottom-2 -right-2 h-40 w-40 rounded-full bg-white/70 p-5 transition group-hover:scale-105">
                <ProductImage src={image} alt="" className={c.image ? "" : "mix-blend-multiply"} />
              </span>
            ) : null}
          </>
        );
        const cls = clsx(
          "group relative flex min-h-44 overflow-hidden rounded-3xl p-6 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
          theme.dark ? "text-white" : "text-ink",
        );
        return c.href ? (
          <Link
            key={c.id}
            href={c.href}
            className={cls}
            style={{ background: theme.background }}
            target={isExternalHref(c.href) ? "_blank" : undefined}
          >
            {body}
          </Link>
        ) : (
          <div key={c.id} className={cls} style={{ background: theme.background }}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
