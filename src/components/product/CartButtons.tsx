"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart, useWishlist, type CartProduct } from "@/lib/store";
import { useSettings } from "@/components/SettingsProvider";

function useCanBuy(p: CartProduct) {
  const { allowOutOfStockOrders } = useSettings();
  return p.stock > 0 || allowOutOfStockOrders;
}

export function AddToCartIcon({ product }: { product: CartProduct }) {
  const { add } = useCart();
  const [done, setDone] = useState(false);
  const disabled = !useCanBuy(product);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        add(product);
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
      aria-label={disabled ? "Изчерпан" : `Добави ${product.name} в количката`}
      className={clsx(
        "grid h-11 w-11 shrink-0 place-items-center rounded-full transition",
        disabled
          ? "cursor-not-allowed bg-line text-muted"
          : done
            ? "bg-mint text-white"
            : "bg-brand text-white shadow-[0_3px_0_var(--color-brand-dark)] hover:bg-brand-dark active:translate-y-px",
      )}
    >
      {done ? <Check className="h-5 w-5" strokeWidth={3} /> : <ShoppingCart className="h-5 w-5" strokeWidth={2.5} />}
    </button>
  );
}

export function WishlistButton({ product, className, withLabel = false }: { product: CartProduct; className?: string; withLabel?: boolean }) {
  const { has, toggle } = useWishlist();
  const active = has(product.id);
  return (
    <button
      type="button"
      onClick={() => toggle(product)}
      aria-pressed={active}
      aria-label={active ? "Премахни от любими" : "Добави в любими"}
      className={clsx(
        withLabel
          ? "btn btn-ghost h-12 px-5"
          : "grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-110",
        className,
      )}
    >
      <Heart className={clsx("h-5 w-5 transition", active ? "fill-brand text-brand" : "text-ink-soft")} strokeWidth={2.2} />
      {withLabel && <span>{active ? "В любими" : "Любими"}</span>}
    </button>
  );
}

export function BuyBox({ product }: { product: CartProduct }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const disabled = !useCanBuy(product);
  const max = product.stock > 0 ? Math.min(product.stock, 99) : 99;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex h-12 items-center rounded-full border-2 border-line bg-white">
        <button
          type="button"
          className="grid h-full w-11 place-items-center text-ink-soft hover:text-ink disabled:opacity-40"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={disabled || qty <= 1}
          aria-label="Намали количеството"
        >
          <Minus className="h-4 w-4" strokeWidth={3} />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={max}
          value={qty}
          disabled={disabled}
          onChange={(e) => setQty(Math.max(1, Math.min(max, Number(e.target.value) || 1)))}
          className="w-10 bg-transparent text-center text-lg font-extrabold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          aria-label="Количество"
        />
        <button
          type="button"
          className="grid h-full w-11 place-items-center text-ink-soft hover:text-ink disabled:opacity-40"
          onClick={() => setQty((q) => Math.min(max, q + 1))}
          disabled={disabled || qty >= max}
          aria-label="Увеличи количеството"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>
      <button type="button" className="btn btn-primary h-12 flex-1 px-8 text-lg sm:flex-none" disabled={disabled} onClick={() => add(product, qty)}>
        <ShoppingCart className="h-5 w-5" strokeWidth={2.5} />
        {disabled ? "Изчерпан" : "Добави в количката"}
      </button>
      <WishlistButton product={product} withLabel />
    </div>
  );
}
