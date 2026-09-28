"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, X } from "lucide-react";
import { useCart, useCartDrawer } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { CartLine } from "./CartLine";
import { FreeShippingProgress } from "./FreeShippingProgress";
import { PointsBadge } from "@/components/product/PointsBadge";

export function CartDrawer() {
  const { items, subtotal, count } = useCart();
  const { open, lastAdded, closeDrawer } = useCartDrawer();
  const pathname = usePathname();

  useEffect(() => closeDrawer(), [pathname, closeDrawer]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, closeDrawer]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-70" role="dialog" aria-modal="true" aria-label="Количка">
      <div className="absolute inset-0 bg-ink/40 [animation:fade-in_.15s]" onClick={closeDrawer} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl [animation:drawer-in_.22s_ease-out]">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-xl font-black">
            Количка <span className="text-muted">({count})</span>
          </h2>
          <button type="button" onClick={closeDrawer} className="grid h-10 w-10 place-items-center rounded-full hover:bg-canvas" aria-label="Затвори количката">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length ? (
          <>
            <div className="border-b border-line px-5 py-3">
              <FreeShippingProgress subtotal={subtotal} />
            </div>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {[...items]
                .sort((a, b) => (a.id === lastAdded ? -1 : b.id === lastAdded ? 1 : 0))
                .map((item) => (
                  <li key={item.id} className="py-4">
                    <CartLine item={item} highlight={item.id === lastAdded} compact />
                  </li>
                ))}
            </ul>
            <div className="space-y-3 border-t border-line bg-canvas px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink-soft">Междинна сума</span>
                <span className="text-2xl font-black">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">С тази поръчка ще спечелите</span>
                <PointsBadge amount={subtotal} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link href="/kolichka" className="btn btn-ghost h-12">
                  Към количката
                </Link>
                <Link href="/porachka" className="btn btn-primary h-12">
                  Поръчай
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-sun-soft">
              <ShoppingBag className="h-9 w-9 text-ink" />
            </span>
            <p className="text-lg font-extrabold">Количката е празна</p>
            <p className="text-muted">Разгледайте хилядите играчки и добавете любимите си.</p>
            <button type="button" onClick={closeDrawer} className="btn btn-primary h-12 px-8">
              Продължи пазаруването
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
