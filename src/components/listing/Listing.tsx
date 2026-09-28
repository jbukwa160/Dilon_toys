import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, X, SearchX } from "lucide-react";
import { listProducts, SORTS, PRICE_BUCKETS, type Scope, type SortKey, type Facet } from "@/lib/catalog";
import { SERIES_BY_SLUG } from "@/lib/taxonomy";
import { categoryLabel } from "@/lib/categories";
import { listingHref, parseListingParams, type RawParams } from "@/lib/params";
import { formatNumber } from "@/lib/format";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SortSelect } from "./SortSelect";
import { MobileFilters } from "./MobileFilters";

type Props = {
  scope: Scope;
  basePath: string;
  searchParams: RawParams;
  defaultSort?: SortKey;
  /** Subcategory links shown at the top of the sidebar on category pages. */
  subNav?: { slug: string; name: string; count: number; active?: boolean }[];
  subNavTitle?: string;
  emptyText?: string;
};

function CheckLink({ href, active, label, count, disabled }: { href: string; active: boolean; label: string; count?: number; disabled?: boolean }) {
  return (
    <Link
      href={href}
      scroll={false}
      rel="nofollow"
      aria-disabled={disabled}
      className={clsx(
        "group flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-[0.93rem] transition hover:bg-canvas",
        active ? "font-extrabold text-ink" : "font-semibold text-ink-soft",
        disabled && !active && "pointer-events-none opacity-40",
      )}
    >
      <span
        className={clsx(
          "grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition",
          active ? "border-brand bg-brand text-white" : "border-line bg-white group-hover:border-ink-soft",
        )}
      >
        {active ? (
          <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
            <path d="M2 6.5 5 9l5-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {count != null ? <span className="text-xs font-bold text-muted">{formatNumber(count)}</span> : null}
    </Link>
  );
}

function FilterGroup({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-line py-4 last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between text-base font-black [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
      </summary>
      <div className="mt-3 space-y-0.5">{children}</div>
    </details>
  );
}

function BrandList({ brands, selected, hrefFor }: { brands: Facet[]; selected: string[]; hrefFor: (slug: string) => string }) {
  const top = brands.slice(0, 10);
  const rest = brands.slice(10);
  return (
    <>
      {top.map((b) => (
        <CheckLink key={b.slug} href={hrefFor(b.slug)} active={selected.includes(b.slug)} label={b.name} count={b.count} />
      ))}
      {rest.length ? (
        <details className="group/more">
          <summary className="cursor-pointer list-none px-1.5 py-1.5 text-sm font-extrabold text-brand [&::-webkit-details-marker]:hidden">
            <span className="group-open/more:hidden">+ Още {rest.length} марки</span>
            <span className="hidden group-open/more:inline">Скрий</span>
          </summary>
          <div className="max-h-72 space-y-0.5 overflow-y-auto">
            {rest.map((b) => (
              <CheckLink key={b.slug} href={hrefFor(b.slug)} active={selected.includes(b.slug)} label={b.name} count={b.count} />
            ))}
          </div>
        </details>
      ) : null}
    </>
  );
}

function pageList(current: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const add = (n: number) => out.push(n);
  const window = new Set([1, total, current - 1, current, current + 1].filter((n) => n >= 1 && n <= total));
  let prev = 0;
  for (const n of [...window].sort((a, b) => a - b)) {
    if (n - prev > 1) out.push("…");
    add(n);
    prev = n;
  }
  return out;
}

export function Listing({ scope, basePath, searchParams, defaultSort = "popular", subNav, subNavTitle, emptyText }: Props) {
  const state = parseListingParams(searchParams, defaultSort);
  const q = scope.kind === "search" ? scope.q : undefined;
  const st = { ...state, q };
  const result = listProducts(scope, state.filters, state.sort, state.page);
  const { facets, total } = result;
  const f = state.filters;
  const href = (patch: Parameters<typeof listingHref>[2]) => listingHref(basePath, st, patch, defaultSort);

  const sorts = SORTS.filter((s) => s.key !== "relevance" || scope.kind === "search").map((s) => ({
    key: s.key,
    label: s.label,
    href: href({ sort: s.key, page: 1 }),
  }));

  const chips: { label: string; href: string }[] = [];
  if (f.category) chips.push({ label: categoryLabel(f.category), href: href({ category: null }) });
  for (const b of f.brands) chips.push({ label: facets.brands.find((x) => x.slug === b)?.name ?? b, href: href({ brands: f.brands.filter((x) => x !== b) }) });
  if (f.price) chips.push({ label: PRICE_BUCKETS.find((p) => p.key === f.price)?.label ?? f.price, href: href({ price: null }) });
  if (f.series) chips.push({ label: SERIES_BY_SLUG.get(f.series)?.name ?? f.series, href: href({ series: null }) });
  if (f.age) chips.push({ label: `Възраст: ${facets.ages.find((a) => a.key === f.age)?.label ?? f.age}`, href: href({ age: null }) });
  if (f.audience) chips.push({ label: facets.audiences.find((a) => a.key === f.audience)?.label ?? f.audience, href: href({ audience: null }) });
  if (f.inStock) chips.push({ label: "Само налични", href: href({ inStock: false }) });
  if (f.sale) chips.push({ label: "Само промоции", href: href({ sale: false }) });

  const sidebar = (
    <div>
      {subNav?.length ? (
        <FilterGroup title={subNavTitle ?? "Подкатегории"}>
          {subNav.map((s) => (
            <Link
              key={s.slug}
              href={`/kategoria/${s.slug}`}
              className={clsx(
                "flex items-center justify-between rounded-lg px-2 py-1.5 text-[0.93rem] transition hover:bg-canvas",
                s.active ? "bg-brand-soft font-extrabold text-brand" : "font-semibold text-ink-soft",
              )}
            >
              <span className="truncate">{s.name}</span>
              <span className="text-xs font-bold text-muted">{formatNumber(s.count)}</span>
            </Link>
          ))}
        </FilterGroup>
      ) : null}

      {facets.categories.length > 1 || f.category ? (
        <FilterGroup title="Категория">
          {facets.categories.map((c) => (
            <CheckLink key={c.slug} href={href({ category: f.category === c.slug ? null : c.slug })} active={f.category === c.slug} label={c.name} count={c.count} />
          ))}
        </FilterGroup>
      ) : null}

      <FilterGroup title="Възраст">
        {facets.ages.map((a) => (
          <CheckLink key={a.key} href={href({ age: f.age === a.key ? null : a.key })} active={f.age === a.key} label={a.label} count={a.count} disabled={!a.count} />
        ))}
      </FilterGroup>

      <FilterGroup title="За кого">
        {facets.audiences.map((a) => (
          <CheckLink
            key={a.key}
            href={href({ audience: f.audience === a.key ? null : a.key })}
            active={f.audience === a.key}
            label={a.key === "all" ? "За всички (момчета и момичета)" : a.label}
            count={a.count}
            disabled={!a.count}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Наличност и оферти">
        <CheckLink href={href({ inStock: !f.inStock })} active={f.inStock} label="Само налични" count={facets.inStock} disabled={!facets.inStock} />
        {scope.kind !== "sale" ? (
          <CheckLink href={href({ sale: !f.sale })} active={f.sale} label="Само промоции" count={facets.sale} disabled={!facets.sale} />
        ) : null}
      </FilterGroup>

      <FilterGroup title="Цена">
        {facets.prices.map((p) => (
          <CheckLink key={p.key} href={href({ price: f.price === p.key ? null : p.key })} active={f.price === p.key} label={p.label} count={p.count} disabled={!p.count} />
        ))}
      </FilterGroup>

      {scope.kind !== "brand" && facets.brands.length ? (
        <FilterGroup title="Марка">
          <BrandList
            brands={facets.brands}
            selected={f.brands}
            hrefFor={(slug) => href({ brands: f.brands.includes(slug) ? f.brands.filter((b) => b !== slug) : [...f.brands, slug] })}
          />
        </FilterGroup>
      ) : null}

      {facets.series.length ? (
        <FilterGroup title="Герои" open={!!f.series}>
          {facets.series.map((s) => (
            <CheckLink key={s.slug} href={href({ series: f.series === s.slug ? null : s.slug })} active={f.series === s.slug} label={s.name} count={s.count} />
          ))}
        </FilterGroup>
      ) : null}
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[270px_1fr] lg:gap-8">
      <aside className="hidden lg:block">
        <div className="sticky top-[11.5rem] max-h-[calc(100vh-12.5rem)] overflow-y-auto rounded-3xl border border-line bg-white px-5 py-1">{sidebar}</div>
      </aside>

      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-bold text-ink-soft">
            <span className="text-ink">{formatNumber(total)}</span> {total === 1 ? "продукт" : "продукта"}
          </p>
          <div className="flex items-center gap-2">
            <MobileFilters active={chips.length} total={total}>
              {sidebar}
            </MobileFilters>
            <SortSelect value={state.sort} options={sorts} />
          </div>
        </div>

        {chips.length ? (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <Link key={c.label} href={c.href} scroll={false} className="chip !border-ink !bg-ink !text-white hover:!bg-ink-soft">
                {c.label} <X className="h-3.5 w-3.5" />
              </Link>
            ))}
            <Link
              href={listingHref(basePath, { ...st, filters: { ...f, brands: [], price: null, inStock: false, sale: false, category: null, series: null } }, {}, defaultSort)}
              scroll={false}
              className="px-2 text-sm font-extrabold text-brand hover:underline"
            >
              Изчисти всички
            </Link>
          </div>
        ) : null}

        {result.items.length ? (
          <ProductGrid products={result.items} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-white px-6 py-16 text-center">
            <SearchX className="h-12 w-12 text-muted" />
            <p className="text-lg font-extrabold">{emptyText ?? "Няма продукти, отговарящи на избраните филтри."}</p>
            {chips.length ? (
              <Link href={listingHref(basePath, { ...st, filters: { ...f, brands: [], price: null, inStock: false, sale: false, category: null, series: null } }, {}, defaultSort)} className="btn btn-primary h-11 px-6">
                Премахни филтрите
              </Link>
            ) : null}
          </div>
        )}

        {result.pageCount > 1 ? (
          <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Страници">
            <Link
              href={href({ page: result.page - 1 })}
              aria-disabled={result.page <= 1}
              className={clsx("grid h-11 w-11 place-items-center rounded-full border-2 border-line bg-white hover:border-ink", result.page <= 1 && "pointer-events-none opacity-40")}
              aria-label="Предишна страница"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            {pageList(result.page, result.pageCount).map((n, i) =>
              n === "…" ? (
                <span key={`e${i}`} className="px-1 font-bold text-muted">
                  …
                </span>
              ) : (
                <Link
                  key={n}
                  href={href({ page: n })}
                  aria-current={n === result.page ? "page" : undefined}
                  className={clsx(
                    "grid h-11 min-w-11 place-items-center rounded-full px-3 font-extrabold",
                    n === result.page ? "bg-ink text-white" : "border-2 border-line bg-white hover:border-ink",
                  )}
                >
                  {n}
                </Link>
              ),
            )}
            <Link
              href={href({ page: result.page + 1 })}
              aria-disabled={result.page >= result.pageCount}
              className={clsx(
                "grid h-11 w-11 place-items-center rounded-full border-2 border-line bg-white hover:border-ink",
                result.page >= result.pageCount && "pointer-events-none opacity-40",
              )}
              aria-label="Следваща страница"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
