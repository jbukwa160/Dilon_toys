"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart, useCartDrawer, useWishlist } from "@/lib/store";
import { formatPrice } from "@/lib/format";

export function HeaderActions() {
  const { count, subtotal } = useCart();
  const wish = useWishlist();
  const { openDrawer } = useCartDrawer();
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Link href="/lyubimi" className="relative grid h-12 w-12 place-items-center rounded-full hover:bg-canvas" aria-label={`Любими (${wish.count})`}>
        <Heart className="h-6 w-6" strokeWidth={2.2} />
        {wish.count ? (
          <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[0.7rem] font-black text-white">
            {wish.count}
          </span>
        ) : null}
      </Link>
      <button
        type="button"
        onClick={openDrawer}
        className="relative flex h-12 items-center gap-2 rounded-full bg-ink pl-3.5 pr-4 text-white transition hover:bg-ink-soft"
        aria-label={`Количка (${count} продукта)`}
      >
        <ShoppingCart className="h-5 w-5" strokeWidth={2.4} />
        <span className="hidden text-sm font-extrabold sm:inline">{count ? formatPrice(subtotal) : "Количка"}</span>
        {count ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-sun px-1 text-[0.7rem] font-black text-ink">
            {count}
          </span>
        ) : null}
      </button>
    </div>
  );
}
