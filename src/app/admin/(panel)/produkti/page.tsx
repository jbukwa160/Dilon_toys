import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PackagePlus, Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { ADMIN_FILTERS, ADMIN_SORTS, listAdminProducts, type AdminFilter, type AdminSort } from "@/lib/admin/products";
import { categoryOptions } from "@/lib/categories";
import { formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductRows } from "@/components/admin/ProductRows";

export const metadata: Metadata = { title: "Продукти" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminProductsPage({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) ?? "";
  const q = one("q").slice(0, 100);
  const category = one("kat");
  const filter = (one("filter") in ADMIN_FILTERS ? one("filter") : "all") as AdminFilter;
  const sort = (one("sort") in ADMIN_SORTS ? one("sort") : "name") as AdminSort;
  const page = Math.max(1, parseInt(one("page") || "1", 10) || 1);
  const result = listAdminProducts({ q, category, filter, sort, page });

  const href = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (category) u.set("kat", category);
    if (filter !== "all") u.set("filter", filter);
    if (sort !== "name") u.set("sort", sort);
    if (p > 1) u.set("page", String(p));
    return `/admin/produkti${u.size ? `?${u}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Продукти"
        description="Търсете продукт и променете цената, промоцията или наличността направо в таблицата. За снимки, описание и категория натиснете „Редактирай“. За да преместите много продукти в друга категория, отметнете ги вляво."
        actions={
          <Link href="/admin/produkti/nov" className="btn btn-primary h-12 px-6">
            <PackagePlus className="h-5 w-5" /> Добави продукт
          </Link>
        }
      />

      <form className="mb-5 grid grid-cols-2 gap-3 rounded-3xl border border-line bg-white p-4 md:grid-cols-4 2xl:grid-cols-[minmax(14rem,1fr)_auto_auto_auto_auto]" action="/admin/produkti">
        <label className="col-span-2 flex items-center rounded-[0.875rem] border-2 border-line bg-white px-3 focus-within:border-sky md:col-span-4 2xl:col-span-1">
          <Search className="h-5 w-5 text-muted" />
          <input name="q" defaultValue={q} placeholder="Име, код (SKU) или баркод — може и част от тях" className="w-full bg-transparent px-2 py-2.5 outline-none focus-visible:outline-none" aria-label="Търсене" />
        </label>
        <select name="kat" defaultValue={category} className="field col-span-2 min-w-0 cursor-pointer md:col-span-1 2xl:w-56" aria-label="Категория">
          <option value="">Всички категории</option>
          {categoryOptions().map((c) => (
            <optgroup key={c.slug} label={c.hidden ? `${c.name} (скрита)` : c.name}>
              <option value={c.slug}>{c.name} — всички</option>
              {c.subs.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select name="filter" defaultValue={filter} className="field min-w-0 cursor-pointer 2xl:w-48" aria-label="Филтър">
          {Object.entries(ADMIN_FILTERS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className="field min-w-0 cursor-pointer 2xl:w-40" aria-label="Подреждане">
          {Object.entries(ADMIN_SORTS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary col-span-2 h-12 px-6 !shadow-none md:col-span-1">
          Покажи
        </button>
      </form>

      <p className="mb-3 font-bold text-ink-soft">
        Намерени: <span className="text-ink">{formatNumber(result.total)}</span> продукта
        {q || category || filter !== "all" ? (
          <Link href="/admin/produkti" className="ml-3 text-sm text-brand hover:underline">
            Изчисти търсенето
          </Link>
        ) : null}
      </p>

      {result.items.length ? (
        <ProductRows
          key={`${q}|${category}|${filter}|${sort}|${result.page}`}
          items={result.items}
          categories={categoryOptions()}
          total={result.total}
          query={{ q, category, filter }}
        />
      ) : (
        <div className="rounded-3xl border border-dashed border-line bg-white p-10 text-center font-bold text-ink-soft">Няма продукти, отговарящи на търсенето.</div>
      )}

      {result.pageCount > 1 ? (
        <nav className="mt-6 flex items-center justify-center gap-2 sm:gap-3" aria-label="Страници">
          <Link
            href={href(result.page - 1)}
            aria-disabled={result.page <= 1}
            className={`btn btn-ghost h-11 px-4 ${result.page <= 1 ? "pointer-events-none opacity-40" : ""}`}
          >
            <ChevronLeft className="h-5 w-5" /> <span className="max-sm:sr-only">Предишна</span>
          </Link>
          <span className="text-center font-bold text-ink-soft">
            Страница {result.page} от {formatNumber(result.pageCount)}
          </span>
          <Link
            href={href(result.page + 1)}
            aria-disabled={result.page >= result.pageCount}
            className={`btn btn-ghost h-11 px-4 ${result.page >= result.pageCount ? "pointer-events-none opacity-40" : ""}`}
          >
            <span className="max-sm:sr-only">Следваща</span> <ChevronRight className="h-5 w-5" />
          </Link>
        </nav>
      ) : null}
    </>
  );
}
