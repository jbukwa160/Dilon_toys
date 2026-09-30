"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, ChevronDown, Crown, Gift, Rocket } from "lucide-react";
import { GIFT_SIDE_SLUG, type GiftSideKey, type MenuItem } from "@/lib/settings-types";
import { MenuLabel, menuItemProps } from "./MenuLabel";
import type { GiftSummary, GiftSideSummary } from "@/lib/gifts";
import { ProductImage } from "@/components/product/ProductImage";

const STYLE: Record<GiftSideKey, { bg: string; ring: string; chip: string; button: string; icon: typeof Rocket; title: string; sub: string }> = {
  boys: {
    bg: "bg-sky-soft/70",
    ring: "from-sky-300 via-sky-500 to-blue-600",
    chip: "border-sky/30 bg-white text-[#0369a1] hover:border-sky hover:bg-sky-soft",
    button: "bg-sky text-white hover:bg-[#1b8bcb]",
    icon: Rocket,
    title: "text-[#0369a1]",
    sub: "text-[#0369a1]/75",
  },
  girls: {
    bg: "bg-pink-50",
    ring: "from-pink-300 via-pink-500 to-fuchsia-600",
    chip: "border-pink-300/60 bg-white text-pink-700 hover:border-pink-400 hover:bg-pink-50",
    button: "bg-pink-500 text-white hover:bg-pink-600",
    icon: Crown,
    title: "text-pink-700",
    sub: "text-pink-700/75",
  },
};

function Side({ side }: { side: GiftSideSummary }) {
  const st = STYLE[side.key];
  const Icon = st.icon;
  const href = `/podaratsi/${GIFT_SIDE_SLUG[side.key]}`;
  return (
    <div className={clsx("relative p-6", st.bg)}>
      <div className="relative">
        <Link href={href} className="group flex items-center gap-3">
          <span className={clsx("grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br shadow-sm ring-4 ring-white", st.ring)}>
            <Icon className="h-6 w-6 text-white" />
          </span>
          <span>
            <span className={clsx("block text-xl font-black uppercase tracking-wide group-hover:underline", st.title)}>{side.title}</span>
            <span className={clsx("text-sm font-semibold", st.sub)}>{side.count} подбрани подаръка</span>
          </span>
        </Link>
        {side.images.length ? (
          <div className="mt-4 flex gap-2">
            {side.images.map((src) => (
              <span key={src} className="h-16 w-16 rounded-xl bg-white p-1.5 shadow-sm">
                <ProductImage src={src} alt="" />
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {side.sections.slice(0, 8).map((s) => (
            <Link key={s.id} href={`${href}#s-${s.id}`} className={clsx("rounded-full border px-3 py-1 text-sm font-bold transition", st.chip)}>
              {s.title}
            </Link>
          ))}
        </div>
        <Link href={href} className={clsx("mt-5 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-extrabold", st.button)}>
          Всички идеи <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export function GiftsMenu({ gifts, item }: { gifts: GiftSummary; item: MenuItem }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const hover = (v: boolean) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(v), v ? 120 : 200);
  };

  const active = pathname.startsWith("/podaratsi");
  const p = menuItemProps(item.appearance, active || open);
  return (
    <div ref={ref} className="relative" onMouseEnter={() => hover(true)} onMouseLeave={() => hover(false)}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={p.className} style={p.style}>
        <MenuLabel label={item.label} appearance={item.appearance} />
        <ChevronDown className={clsx("h-4 w-4 opacity-60 transition", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="absolute left-1/2 top-[calc(100%+10px)] z-50 w-[min(860px,calc(100vw-3rem))] -translate-x-1/2 overflow-hidden rounded-3xl border border-line bg-white shadow-[var(--shadow-lift)] [animation:fade-in_.15s_ease-out]">
          <div className="relative grid grid-cols-2">
            <Side side={gifts.boys} />
            <Side side={gifts.girls} />
            <span className="pointer-events-none absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-sun-soft shadow-[var(--shadow-card)]">
              <Gift className="h-5 w-5 text-brand" />
            </span>
          </div>
          <Link href="/podaratsi" className="relative block border-t border-line bg-canvas py-3 text-center text-sm font-extrabold text-ink-soft hover:text-brand">
            Разгледай всички идеи за подаръци →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/** Compact version for the mobile menu. */
export function GiftsMobile({ gifts, label }: { gifts: GiftSummary; label: string }) {
  return (
    <div className="mx-2 mt-2 overflow-hidden rounded-2xl p-3 text-ink" style={{ background: "linear-gradient(120deg, #e3f3fd 0%, #fff8ef 50%, #fde2ef 100%)" }}>
      <Link href="/podaratsi" className="mb-2 flex items-center gap-2 px-1 font-black">
        <Gift className="h-5 w-5 text-brand" /> {label}
      </Link>
      <div className="grid grid-cols-2 gap-2">
        {(["boys", "girls"] as GiftSideKey[]).map((k) => {
          const Icon = STYLE[k].icon;
          return (
            <Link key={k} href={`/podaratsi/${GIFT_SIDE_SLUG[k]}`} className={clsx("flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-extrabold", STYLE[k].button)}>
              <Icon className="h-4 w-4" /> {gifts[k].title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
