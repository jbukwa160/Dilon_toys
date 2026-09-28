import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES, listOrders, orderCounts } from "@/lib/admin/orders";
import { formatDateTime, formatPrice } from "@/lib/format";
import { PageHeader } from "@/components/admin/PageHeader";

export const metadata: Metadata = { title: "Поръчки" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = sp.status && sp.status in ORDER_STATUSES ? sp.status : "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const counts = orderCounts();
  const result = listOrders(status, page);
  const tabs = [{ key: "", label: "Всички", count: counts.all }, ...Object.entries(ORDER_STATUSES).map(([k, v]) => ({ key: k, label: v.label, count: counts[k] ?? 0 }))];

  return (
    <>
      <PageHeader title="Поръчки" description="Натиснете поръчка, за да видите подробностите и да смените статуса ѝ." />
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/admin/poruchki?status=${t.key}` : "/admin/poruchki"}
            className={clsx("chip", status === t.key && "!border-ink !bg-ink !text-white")}
          >
            {t.label} <span className="opacity-70">{t.count}</span>
          </Link>
        ))}
      </div>
      {result.items.length ? (
        <div className="overflow-x-auto rounded-3xl border border-line bg-white">
          <table className="w-full min-w-[720px] text-left text-[0.95rem]">
            <thead className="border-b border-line bg-canvas text-xs font-extrabold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">№</th>
                <th className="px-2 py-3">Дата</th>
                <th className="px-2 py-3">Клиент</th>
                <th className="px-2 py-3">Телефон</th>
                <th className="px-2 py-3">Доставка</th>
                <th className="px-2 py-3 text-right">Сума</th>
                <th className="px-5 py-3 text-right">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.items.map((o) => (
                <tr key={o.id} className="hover:bg-canvas">
                  <td className="px-5 py-3 font-black">
                    <Link href={`/admin/poruchki/${o.id}`} className="hover:text-brand">
                      №{o.number}
                    </Link>
                  </td>
                  <td className="px-2 py-3 text-ink-soft">{formatDateTime(o.createdAt)}</td>
                  <td className="px-2 py-3">
                    <Link href={`/admin/poruchki/${o.id}`} className="font-bold hover:text-brand">
                      {o.customer.firstName} {o.customer.lastName}
                    </Link>
                  </td>
                  <td className="px-2 py-3">{o.customer.phone}</td>
                  <td className="px-2 py-3 text-ink-soft">{o.delivery.city}</td>
                  <td className="px-2 py-3 text-right font-bold">{formatPrice(o.total)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${ORDER_STATUSES[o.status].color}`}>{ORDER_STATUSES[o.status].label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-line bg-white p-10 text-center font-bold text-ink-soft">Няма поръчки.</div>
      )}
      {result.pageCount > 1 ? (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/admin/poruchki?${new URLSearchParams({ ...(status ? { status } : {}), page: String(n) })}`}
              className={clsx("grid h-10 min-w-10 place-items-center rounded-full font-bold", n === result.page ? "bg-ink text-white" : "border-2 border-line bg-white")}
            >
              {n}
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}
