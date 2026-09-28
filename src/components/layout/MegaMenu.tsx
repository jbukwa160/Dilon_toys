"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ChevronDown, ChevronRight, LayoutGrid, Menu, X } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { SearchBox } from "./SearchBox";
import { ProductImage } from "@/components/product/ProductImage";
import { formatNumber } from "@/lib/format";
import { contrastText, type MenuConfig } from "@/lib/settings-types";
import { MenuLabel, menuItemProps } from "./MenuLabel";
import type { GiftSummary } from "@/lib/gifts";
import { GiftsMobile } from "./GiftsMenu";

export type NavCategory = {
  slug: string;
  name: string;
  icon: string;
  count: number;
  color: string;
  accent: string;
  tagline: string;
  image: string | null;
  brands: { slug: string; name: string }[];
  subs: { slug: string; name: string }[];
};

export function MegaMenu({ categories, label = "Всички категории", color = "#f0503a" }: { categories: NavCategory[]; label?: string; color?: string }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(categories[0]?.slug);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  const ref = useRef<HTMLDivElement>(null);

  // Close after navigating (adjusting state during render, not in an effect).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const current = categories.find((c) => c.slug === active) ?? categories[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-5 font-extrabold transition hover:brightness-95"
        style={{ background: color, color: contrastText(color) }}
      >
        <LayoutGrid className="h-5 w-5" />
        {label}
        <ChevronDown className={clsx("h-4 w-4 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+10px)] z-50 flex w-[min(1080px,calc(100vw-3rem))] overflow-hidden rounded-3xl border border-line bg-white shadow-[var(--shadow-lift)] [animation:fade-in_.15s_ease-out]">
          <ul className="max-h-[calc(100vh-15rem)] w-72 shrink-0 overflow-y-auto border-r border-line bg-canvas py-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/kategoria/${c.slug}`}
                  onMouseEnter={() => setActive(c.slug)}
                  onFocus={() => setActive(c.slug)}
                  className={clsx(
                    "mx-2 flex items-center gap-3 rounded-xl px-3 py-1.5 text-[0.93rem] font-bold transition",
                    c.slug === current?.slug ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink",
                  )}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ background: c.color, color: c.accent }}>
                    <CategoryIcon icon={c.icon} slug={c.slug} className="h-4 w-4" />
                  </span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
          {current ? (
            <div className="grid flex-1 grid-cols-[1fr_260px] gap-7 p-7">
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-2xl font-black">{current.name}</h3>
                  <span className="text-sm font-semibold text-muted">{formatNumber(current.count)} продукта</span>
                </div>
                {current.subs.length ? (
                  <div className="mt-5 grid grid-cols-2 gap-2.5">
                    {current.subs.map((s) => (
                      <Link key={s.slug} href={`/kategoria/${s.slug}`} className="rounded-2xl border border-line px-4 py-3 font-bold transition hover:border-ink">
                        {s.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
                {current.brands.length ? (
                  <>
                    <h4 className="mb-3 mt-6 text-sm font-extrabold uppercase tracking-wide text-muted">Популярни марки</h4>
                    <div className="flex flex-wrap gap-2">
                      {current.brands.map((b) => (
                        <Link key={b.slug} href={`/kategoria/${current.slug}?marka=${b.slug}`} className="chip">
                          {b.name}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
              <Link
                href={`/kategoria/${current.slug}`}
                className="group flex flex-col self-start rounded-3xl p-5 transition hover:-translate-y-0.5"
                style={{ background: current.color }}
              >
                <span className="mx-auto aspect-square w-full overflow-hidden rounded-full bg-white/70 p-6">
                  <ProductImage src={current.image} alt="" />
                </span>
                <span className="mt-4 text-sm font-semibold text-ink/70">{current.tagline}</span>
                <span className="mt-2 flex items-center gap-1 font-extrabold" style={{ color: current.accent }}>
                  Виж всички <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function MobileMenu({ categories, menu, gifts }: { categories: NavCategory[]; menu: MenuConfig; gifts: GiftSummary | null }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="grid h-12 w-12 place-items-center rounded-full hover:bg-canvas lg:hidden" aria-label="Меню">
        <Menu className="h-6 w-6" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-60 lg:hidden" role="dialog" aria-modal="true" aria-label="Меню">
          <div className="absolute inset-0 bg-ink/40 [animation:fade-in_.15s]" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line p-4">
              <span className="text-lg font-black">Меню</span>
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-canvas" aria-label="Затвори">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-line p-4">
              <SearchBox onNavigate={() => setOpen(false)} />
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
              <div className="flex flex-wrap gap-2 p-2">
                {menu.items
                  .filter((i) => i.kind === "link")
                  .map((i) => {
                    const p = menuItemProps(i.appearance);
                    return (
                      <Link key={i.id} href={i.href} className={clsx(p.className, "!py-1.5 !text-sm", i.appearance.style === "plain" && "border border-line")} style={p.style}>
                        <MenuLabel label={i.label} appearance={i.appearance} />
                      </Link>
                    );
                  })}
              </div>
              {menu.items.map((i) =>
                i.kind === "gifts" && gifts ? (
                  <GiftsMobile key={i.id} gifts={gifts} label={i.label} />
                ) : i.kind === "dropdown" ? (
                  <details key={i.id} className="group mx-2 mt-2 rounded-2xl border border-line">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 font-extrabold [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center gap-1.5" style={i.appearance.style === "plain" ? undefined : { color: i.appearance.color }}>
                        <MenuLabel label={i.label} appearance={i.appearance} />
                      </span>
                      <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
                    </summary>
                    <div className="space-y-3 px-3 pb-3">
                      {i.columns.map((c) =>
                        c.kind === "image" ? (
                          c.href ? (
                            <Link key={c.id} href={c.href} className="block font-bold text-ink-soft">
                              {c.title || "Виж"}
                            </Link>
                          ) : null
                        ) : (
                          <div key={c.id}>
                            {c.title ? <div className="mb-1 text-sm font-black text-muted">{c.title}</div> : null}
                            <div className="flex flex-wrap gap-1.5">
                              {c.links.map((l) => (
                                <Link key={l.id} href={l.href} className="chip !py-1 !text-sm">
                                  {l.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ),
                      )}
                      {i.href ? (
                        <Link href={i.href} className="block text-sm font-extrabold text-brand">
                          Виж всички →
                        </Link>
                      ) : null}
                    </div>
                  </details>
                ) : null,
              )}
              <ul className="mt-1">
                {categories.map((c) => (
                  <li key={c.slug} className="border-b border-line/70 last:border-0">
                    <div className="flex items-center">
                      <Link href={`/kategoria/${c.slug}`} className="flex flex-1 items-center gap-3 px-2 py-3 font-bold">
                        <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: c.color, color: c.accent }}>
                          <CategoryIcon icon={c.icon} slug={c.slug} className="h-5 w-5" />
                        </span>
                        {c.name}
                      </Link>
                      {c.subs.length ? (
                        <button
                          type="button"
                          onClick={() => setExpanded((e) => (e === c.slug ? null : c.slug))}
                          className="grid h-10 w-10 place-items-center rounded-full hover:bg-canvas"
                          aria-label={`Подкатегории на ${c.name}`}
                          aria-expanded={expanded === c.slug}
                        >
                          <ChevronDown className={clsx("h-5 w-5 transition", expanded === c.slug && "rotate-180")} />
                        </button>
                      ) : null}
                    </div>
                    {expanded === c.slug ? (
                      <ul className="mb-2 ml-14 space-y-1">
                        {c.subs.map((s) => (
                          <li key={s.slug}>
                            <Link href={`/kategoria/${s.slug}`} className="block rounded-lg px-2 py-1.5 text-ink-soft hover:bg-canvas">
                              {s.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
