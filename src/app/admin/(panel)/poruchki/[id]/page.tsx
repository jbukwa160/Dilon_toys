import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getOrder } from "@/lib/admin/orders";
import { PAYMENT_METHODS, type PaymentKey } from "@/lib/checkout";
import { formatDateTime, formatPrice } from "@/lib/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";

export const metadata: Metadata = { title: "Поръчка" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const o = getOrder((await params).id);
  if (!o) notFound();
  return (
    <>
      <Link href="/admin/poruchki" className="mb-3 inline-flex items-center gap-1.5 font-bold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Всички поръчки
      </Link>
      <PageHeader title={`Поръчка №${o.number}`} description={`Направена на ${formatDateTime(o.createdAt)}`} />
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="rounded-3xl border border-line bg-white p-6">
            <h2 className="text-lg font-black">Продукти</h2>
            <ul className="mt-3 divide-y divide-line">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-3">
                  <a href={`/produkt/${i.slug}`} target="_blank" rel="noopener" className="font-semibold hover:text-brand">
                    {i.name} <span className="text-muted">× {i.qty}</span>
                  </a>
                  <span className="shrink-0 font-bold">{formatPrice(i.total)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-line pt-3">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Продукти</dt>
                <dd className="font-bold">{formatPrice(o.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Доставка</dt>
                <dd className="font-bold">{o.shipping ? formatPrice(o.shipping) : "Безплатна"}</dd>
              </div>
              <div className="flex justify-between text-lg">
                <dt className="font-black">Общо</dt>
                <dd className="font-black">{formatPrice(o.total)}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-ink-soft">Бонус точки за клиента</dt>
                <dd className="font-bold text-grape">{o.points}</dd>
              </div>
            </dl>
          </section>
          <section className="grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-line bg-white p-6">
              <h2 className="text-lg font-black">Клиент</h2>
              <p className="mt-2 font-bold">
                {o.customer.firstName} {o.customer.lastName}
              </p>
              <p className="mt-1 flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted" />
                <a href={`tel:${o.customer.phone.replace(/\s/g, "")}`} className="font-bold text-sky hover:underline">
                  {o.customer.phone}
                </a>
              </p>
              <p className="mt-1 flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted" />
                <a href={`mailto:${o.customer.email}`} className="text-sky hover:underline">
                  {o.customer.email}
                </a>
              </p>
            </div>
            <div className="rounded-3xl border border-line bg-white p-6">
              <h2 className="text-lg font-black">Доставка и плащане</h2>
              <p className="mt-2 font-bold">{o.delivery.label}</p>
              <p className="text-ink-soft">
                {o.delivery.city}
                {o.delivery.postCode ? ` ${o.delivery.postCode}` : ""}, {o.delivery.address}
              </p>
              {o.delivery.officeId ? (
                <p className="mt-1 text-sm text-muted">
                  Код на {o.delivery.courier === "econt" ? "офиса в Еконт" : "офиса в Спиди"}: <b className="text-ink">{o.delivery.officeId}</b>
                </p>
              ) : null}
              <p className="mt-2">
                <span className="text-ink-soft">Плащане:</span> <b>{PAYMENT_METHODS[o.payment as PaymentKey]?.label ?? o.payment}</b>
              </p>
            </div>
          </section>
          {o.note ? (
            <section className="rounded-3xl border border-line bg-white p-6">
              <h2 className="text-lg font-black">Бележка от клиента</h2>
              <p className="mt-2 whitespace-pre-line text-ink-soft">{o.note}</p>
            </section>
          ) : null}
        </div>
        <OrderStatusForm id={o.id} status={o.status} note={o.adminNote ?? ""} />
      </div>
    </>
  );
}
