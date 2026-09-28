"use client";

import Link from "next/link";
import clsx from "clsx";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, type CartItem } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "@/components/product/ProductImage";

export function CartLine({ item, highlight = false, compact = false }: { item: CartItem; highlight?: boolean; compact?: boolean }) {
  const { setQty, remove } = useCart();
  const max = item.stock > 0 ? Math.min(item.stock, 99) : 99;
  return (
    <div className={clsx("flex gap-4", highlight && "rounded-2xl bg-mint-soft/60 p-2 -m-2")}>
      <Link href={`/produkt/${item.slug}`} className={clsx("shrink-0 rounded-xl border border-line bg-white p-1.5", compact ? "h-20 w-20" : "h-24 w-24 md:h-28 md:w-28")}>
        <ProductImage src={item.image} alt={item.name} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        {item.brand ? <span className="text-xs font-bold uppercase tracking-wide text-muted">{item.brand}</span> : null}
        <Link href={`/produkt/${item.slug}`} className="line-clamp-2 font-bold leading-snug hover:text-brand">
          {item.name}
        </Link>
        {item.stock <= 0 ? <span className="mt-1 text-sm font-bold text-brand">Изчерпан</span> : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex h-9 items-center rounded-full border-2 border-line">
            <button
              type="button"
              className="grid h-full w-8 place-items-center disabled:opacity-40"
              onClick={() => setQty(item.id, item.qty - 1)}
              disabled={item.qty <= 1}
              aria-label="Намали"
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
            <span className="w-7 text-center font-extrabold" aria-live="polite">
              {item.qty}
            </span>
            <button
              type="button"
              className="grid h-full w-8 place-items-center disabled:opacity-40"
              onClick={() => setQty(item.id, item.qty + 1)}
              disabled={item.qty >= max}
              aria-label="Увеличи"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
          </div>
          <div className="text-right">
            <div className="font-black">{formatPrice(item.price * item.qty)}</div>
            {item.qty > 1 ? <div className="text-xs text-muted">{formatPrice(item.price)} / бр.</div> : null}
          </div>
          <button type="button" onClick={() => remove(item.id)} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-brand-soft hover:text-brand" aria-label={`Премахни ${item.name}`}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
