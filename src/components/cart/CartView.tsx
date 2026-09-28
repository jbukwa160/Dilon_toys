"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { useSettings } from "@/components/SettingsProvider";
import { PointsBadge } from "@/components/product/PointsBadge";
import { CartLine } from "./CartLine";
import { FreeShippingProgress } from "./FreeShippingProgress";
import { useFreshProducts } from "./useFreshProducts";

export function CartView() {
  const { items, subtotal, count, refresh } = useCart();
  const settings = useSettings();
  useFreshProducts(
    items.map((i) => i.id),
    refresh,
  );
  const unavailable = items.filter((i) => i.stock <= 0 && !settings.allowOutOfStockOrders);

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-white px-6 py-16 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-sun-soft">
          <ShoppingBag className="h-9 w-9" />
        </span>
        <p className="text-xl font-black">Количката ви е празна</p>
        <p className="text-muted">Разгледайте хилядите играчки и добавете любимите си.</p>
        <Link href="/igrachki" className="btn btn-primary h-12 px-8">
          Към играчките
        </Link>
      </div>
    );
  }

  const shippingFrom = subtotal >= settings.shipping.freeOver ? 0 : settings.shipping.office;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
      <div className="rounded-3xl border border-line bg-white">
        <div className="border-b border-line p-5">
          <FreeShippingProgress subtotal={subtotal} />
        </div>
        <ul className="divide-y divide-line px-5">
          {items.map((item) => (
            <li key={item.id} className="py-5">
              <CartLine item={item} />
            </li>
          ))}
        </ul>
      </div>

      <aside className="rounded-3xl border border-line bg-white p-6 lg:sticky lg:top-44">
        <h2 className="text-xl font-black">Обобщение</h2>
        <dl className="mt-4 space-y-3 text-[0.95rem]">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Продукти ({count})</dt>
            <dd className="font-bold">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Доставка</dt>
            <dd className="font-bold">{shippingFrom === 0 ? <span className="text-mint">Безплатна</span> : `от ${formatPrice(shippingFrom)}`}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-3">
            <dt className="font-extrabold">Общо</dt>
            <dd className="text-2xl font-black">{formatPrice(subtotal + shippingFrom)}</dd>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-grape-soft px-4 py-3">
            <dt className="text-sm font-bold text-ink-soft">Бонус точки</dt>
            <dd>
              <PointsBadge amount={subtotal} size="lg" className="!bg-white" />
            </dd>
          </div>
        </dl>
        {unavailable.length ? (
          <p className="mt-4 rounded-2xl bg-brand-soft p-3 text-sm font-bold text-brand-dark">
            Премахнете изчерпаните продукти, за да продължите.
          </p>
        ) : null}
        {unavailable.length ? (
          <button type="button" disabled className="btn btn-primary mt-5 h-14 w-full text-lg">
            Продължи към поръчка
          </button>
        ) : (
          <Link href="/porachka" className="btn btn-primary mt-5 h-14 w-full text-lg">
            Продължи към поръчка <ArrowRight className="h-5 w-5" />
          </Link>
        )}
        <Link href="/igrachki" className="mt-3 block text-center text-sm font-extrabold text-ink-soft hover:text-brand">
          или продължи пазаруването
        </Link>
      </aside>
    </div>
  );
}
