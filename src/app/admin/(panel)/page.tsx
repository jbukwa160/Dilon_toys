import Link from "next/link";
import { ArrowRight, Images, MessagesSquare, Package, PackagePlus, ShoppingBag, Tags, TriangleAlert } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { catalogDb } from "@/lib/db";
import { ORDER_STATUSES, listOrders, orderCounts, salesSummary } from "@/lib/admin/orders";
import { formatDateTime, formatNumber, formatPrice } from "@/lib/format";
import { unreadConversationCount } from "@/lib/chat";
import { PageHeader } from "@/components/admin/PageHeader";

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const stats = catalogDb()
    .prepare(
      `SELECT COUNT(*) AS total, SUM(hidden = 0) AS visible, SUM(hidden = 0 AND stock > 0) AS inStock,
         SUM(hidden = 0 AND old_price IS NOT NULL) AS sale, SUM(demo_price) AS demo, SUM(admin_edited) AS edited
       FROM products`,
    )
    .get() as { total: number; visible: number; inStock: number; sale: number; demo: number; edited: number };
  const counts = orderCounts();
  const sales = salesSummary();
  const recent = listOrders("", 1, 6).items;
  const unreadChats = unreadConversationCount();

  const tiles = [
    { label: "Продукти в сайта", value: formatNumber(stats.visible), sub: `${formatNumber(stats.inStock)} налични`, href: "/admin/produkti" },
    { label: "В промоция", value: formatNumber(stats.sale), sub: "с намалена цена", href: "/admin/produkti?filter=sale" },
    { label: "Нови поръчки", value: formatNumber(counts.new ?? 0), sub: `${formatNumber(counts.all)} общо`, href: "/admin/poruchki?status=new" },
    { label: "Оборот (30 дни)", value: formatPrice(sales.revenue30), sub: `${formatPrice(sales.revenue)} общо`, href: "/admin/poruchki" },
  ];

  return (
    <>
      <PageHeader title={`Здравейте, ${admin.username}!`} description="Оттук управлявате продуктите, цените, банерите и поръчките на магазина." />

      {unreadChats > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl border-2 border-brand bg-brand-soft p-5">
          <MessagesSquare className="h-6 w-6 shrink-0 text-brand" />
          <p className="min-w-[13rem] flex-1 font-bold">
            {unreadChats === 1 ? "1 разговор в чата чака отговор." : `${unreadChats} разговора в чата чакат отговор.`}
          </p>
          <Link href="/admin/chat" className="btn btn-primary h-11 px-5 !shadow-none max-sm:w-full">
            Към чата
          </Link>
        </div>
      ) : null}

      {stats.demo > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl border-2 border-sun bg-sun-soft p-5">
          <TriangleAlert className="h-6 w-6 shrink-0" />
          <p className="min-w-[13rem] flex-1 font-bold">
            {formatNumber(stats.demo)} продукта все още са с примерни (демо) цени. Качете реалните цени от „Цени и промоции“ → „Качи файл“.
          </p>
          <Link href="/admin/tseni" className="btn btn-primary h-11 px-5 !shadow-none max-sm:w-full">
            Към цените
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="rounded-3xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
            <div className="text-sm font-bold text-muted">{t.label}</div>
            <div className="mt-1 text-3xl font-black">{t.value}</div>
            <div className="text-sm text-ink-soft">{t.sub}</div>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-xl font-black">Бързи действия</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/produkti", icon: Package, title: "Промени продукт", text: "Цена, наличност, снимки, описание" },
          { href: "/admin/produkti/nov", icon: PackagePlus, title: "Добави продукт", text: "Нов продукт, който не е във файла" },
          { href: "/admin/tseni", icon: Tags, title: "Цени и промоции", text: "Excel файл или промяна с %" },
          { href: "/admin/nachalna", icon: Images, title: "Банери", text: "Снимки, текстове и бутони на началната страница" },
        ].map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="group flex items-start gap-3 rounded-3xl border border-line bg-white p-5 transition hover:border-ink">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-black">{title}</span>
              <span className="text-sm text-ink-soft">{text}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mb-3 mt-8 flex items-end justify-between">
        <h2 className="text-xl font-black">Последни поръчки</h2>
        <Link href="/admin/poruchki" className="inline-flex items-center gap-1 font-extrabold text-brand hover:underline">
          Всички <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {recent.length ? (
        <div className="overflow-x-auto rounded-3xl border border-line bg-white">
          <table className="w-full min-w-[560px] text-left text-[0.95rem]">
            <tbody className="divide-y divide-line">
              {recent.map((o) => (
                <tr key={o.id} className="hover:bg-canvas">
                  <td className="px-5 py-3 font-black">
                    <Link href={`/admin/poruchki/${o.id}`} className="hover:text-brand">
                      №{o.number}
                    </Link>
                  </td>
                  <td className="px-2 py-3 text-ink-soft">{formatDateTime(o.createdAt)}</td>
                  <td className="px-2 py-3">
                    {o.customer.firstName} {o.customer.lastName}
                  </td>
                  <td className="px-2 py-3 font-bold">{formatPrice(o.total)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${ORDER_STATUSES[o.status].color}`}>{ORDER_STATUSES[o.status].label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-3xl border border-dashed border-line bg-white p-6 text-ink-soft">
          <ShoppingBag className="h-6 w-6" /> Все още няма поръчки.
        </div>
      )}
    </>
  );
}
