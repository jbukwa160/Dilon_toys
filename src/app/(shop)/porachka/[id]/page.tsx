import { getSettings } from "@/lib/settings";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, Star } from "lucide-react";
import { storeDb } from "@/lib/db";
import { PAYMENT_METHODS, type OrderLine, type PaymentKey } from "@/lib/checkout";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Поръчката е приета", robots: { index: false } };

type OrderRow = {
  id: string;
  number: number;
  created_at: string;
  customer: string;
  delivery: string;
  payment: string;
  items: string;
  subtotal: number;
  shipping: number;
  total: number;
  points: number;
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = getSettings();
  const row = storeDb().prepare("SELECT * FROM orders WHERE id = ?").get(id) as OrderRow | undefined;
  if (!row) notFound();
  const customer = JSON.parse(row.customer) as { firstName: string; email: string; phone: string };
  const delivery = JSON.parse(row.delivery) as { label: string; city: string; address: string };
  const items = JSON.parse(row.items) as OrderLine[];

  return (
    <div className="container-shop max-w-3xl py-10">
      <div className="rounded-3xl border border-line bg-white p-6 text-center md:p-10">
        <CircleCheck className="mx-auto h-16 w-16 text-mint" />
        <h1 className="mt-4 text-3xl font-black">Благодарим, {customer.firstName}!</h1>
        <p className="mt-2 text-lg text-ink-soft">
          Поръчка <strong className="text-ink">№{row.number}</strong> е приета. Ще се свържем с вас на {customer.phone} за потвърждение.
        </p>
        <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-grape-soft px-5 py-2 font-extrabold text-grape">
          <Star className="h-5 w-5 fill-grape" /> Спечелихте {row.points} бонус точки
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-line bg-white p-6">
          <h2 className="font-black">Доставка</h2>
          <p className="mt-2 text-ink-soft">
            {delivery.label}
            <br />
            {delivery.city}, {delivery.address}
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-white p-6">
          <h2 className="font-black">Плащане</h2>
          <p className="mt-2 text-ink-soft">{PAYMENT_METHODS[row.payment as PaymentKey]?.label ?? row.payment}</p>
          <p className="mt-1 text-sm text-muted">Имейл за връзка: {customer.email}</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-line bg-white p-6">
        <h2 className="font-black">Продукти</h2>
        <ul className="mt-3 divide-y divide-line">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-3">
              <Link href={`/produkt/${i.slug}`} className="font-semibold hover:text-brand">
                {i.name} <span className="text-muted">× {i.qty}</span>
              </Link>
              <span className="shrink-0 font-bold">{formatPrice(i.total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-2 border-t border-line pt-3">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Продукти</dt>
            <dd className="font-bold">{formatPrice(row.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Доставка</dt>
            <dd className="font-bold">{row.shipping ? formatPrice(row.shipping) : "Безплатна"}</dd>
          </div>
          <div className="flex justify-between text-lg">
            <dt className="font-black">Общо</dt>
            <dd className="font-black">{formatPrice(row.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="btn btn-primary h-12 px-8">
          Обратно към {s.name}
        </Link>
      </div>
    </div>
  );
}
