import Link from "next/link";
import type { ProductCard as Card } from "@/lib/catalog";
import { discountPercent, formatPrice } from "@/lib/format";
import { ProductImage } from "./ProductImage";
import { AddToCartIcon, WishlistButton } from "./CartButtons";
import { PointsBadge } from "./PointsBadge";
import { ageBadge } from "@/lib/toy-info";

export function toCartProduct(p: Card) {
  return { id: p.id, slug: p.slug, name: p.name, brand: p.brand, image: p.image, price: p.price, oldPrice: p.oldPrice, stock: p.stock };
}

export function ProductCard({ product: p, eager = false }: { product: Card; eager?: boolean }) {
  const off = discountPercent(p.price, p.oldPrice);
  const inStock = p.stock > 0;
  const age = ageBadge(p.ageMin);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <Link href={`/produkt/${p.slug}`} className="relative block aspect-square overflow-hidden bg-white p-4" tabIndex={-1} aria-hidden>
        <ProductImage src={p.image} alt="" eager={eager} className={inStock ? "" : "opacity-60 grayscale-[35%]"} />
      </Link>
      <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
        {off ? <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-extrabold text-white">-{off}%</span> : null}
        {!inStock ? <span className="rounded-full bg-ink/80 px-2.5 py-1 text-xs font-bold text-white">Изчерпан</span> : null}
      </div>
      <WishlistButton product={toCartProduct(p)} className="absolute right-3 top-3 z-10" />

      <div className="flex flex-1 flex-col gap-2 border-t border-line/70 p-4">
        <div className="flex min-h-4 items-center justify-between gap-2">
          {p.brand && p.brandSlug ? (
            <Link href={`/marka/${p.brandSlug}`} className="relative z-10 w-fit truncate text-xs font-bold uppercase tracking-wide text-muted hover:text-brand">
              {p.brand}
            </Link>
          ) : (
            <span className="h-4 truncate text-xs font-bold uppercase tracking-wide text-muted">{p.brand}</span>
          )}
          {age ? (
            <span className="shrink-0 rounded-full bg-sky-soft px-2 py-0.5 text-[0.7rem] font-extrabold text-sky" title="Подходяща възраст">
              {age}
            </span>
          ) : null}
        </div>
        <h3 className="line-clamp-2 min-h-[2.6em] text-[0.95rem] font-bold leading-snug text-ink">
          <Link href={`/produkt/${p.slug}`} className="after:absolute after:inset-0 after:content-[''] hover:text-brand focus-visible:outline-none">
            {p.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="relative z-10 min-w-0">
            {p.oldPrice ? <div className="text-sm font-semibold text-muted line-through">{formatPrice(p.oldPrice)}</div> : null}
            <div className={`text-xl font-black leading-tight ${off ? "text-brand" : "text-ink"}`}>{formatPrice(p.price)}</div>
            <PointsBadge amount={p.price} className="mt-1.5" />
          </div>
          <div className="relative z-10">
            <AddToCartIcon product={toCartProduct(p)} />
          </div>
        </div>
      </div>
    </article>
  );
}
