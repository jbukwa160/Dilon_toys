import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Crown, Gift, Rocket, Star } from "lucide-react";
import type { GiftSideKey } from "@/lib/settings-types";
import { GIFT_SIDE_SLUG } from "@/lib/settings-types";
import type { GiftSideSummary } from "@/lib/gifts";
import { ProductImage } from "@/components/product/ProductImage";

export const SIDE_STYLE: Record<
  GiftSideKey,
  { glow: string; panel: string; emblem: string; button: string; chip: string; icon: typeof Rocket; ring: string; accent: string; title: string }
> = {
  boys: {
    glow: "shadow-[0_10px_30px_rgba(2,132,199,0.18)]",
    panel: "border-sky/30 bg-white",
    emblem: "bg-gradient-to-br from-sky-300 via-sky-500 to-blue-600 ring-sky-soft",
    button: "bg-sky text-white hover:bg-[#1b8bcb]",
    chip: "bg-sky-soft text-[#0369a1]",
    icon: Rocket,
    ring: "ring-sky-300",
    accent: "#2f9fe0",
    title: "text-[#0369a1]",
  },
  girls: {
    glow: "shadow-[0_10px_30px_rgba(219,39,119,0.18)]",
    panel: "border-pink-300/60 bg-white",
    emblem: "bg-gradient-to-br from-pink-300 via-pink-500 to-fuchsia-600 ring-pink-100",
    button: "bg-pink-500 text-white hover:bg-pink-600",
    chip: "bg-pink-50 text-pink-700",
    icon: Crown,
    ring: "ring-pink-300",
    accent: "#ec4899",
    title: "text-pink-700",
  },
};

const TILT = [-8, 0, 8];

function SideCard({ side, active, compact }: { side: GiftSideSummary; active: GiftSideKey | null; compact: boolean }) {
  const st = SIDE_STYLE[side.key];
  const Icon = st.icon;
  const dimmed = active !== null && active !== side.key;
  const selected = active === side.key;
  const images = side.images.length === 3 ? [side.images[1], side.images[0], side.images[2]] : side.images;
  return (
    <Link
      href={`/podaratsi/${GIFT_SIDE_SLUG[side.key]}`}
      aria-current={selected ? "page" : undefined}
      className={clsx("group relative flex flex-col items-center text-center transition duration-300", dimmed && "opacity-60 hover:opacity-100 md:scale-95")}
    >
      {!compact && images.length ? (
        <div className="relative flex h-40 w-full items-end justify-center md:h-52">
          {images.map((src, i) => (
            <span
              key={src}
              className={clsx(
                "relative -mx-3 block rounded-3xl bg-white p-2.5 transition duration-300 group-hover:-translate-y-1",
                st.glow,
                images.length === 3 && i === 1 ? "z-10 h-36 w-36 md:h-48 md:w-48" : "h-28 w-28 md:h-36 md:w-36",
              )}
              style={{ transform: `rotate(${images.length === 3 ? TILT[i] : 0}deg)` }}
            >
              <ProductImage src={src} alt="" />
            </span>
          ))}
        </div>
      ) : null}
      <div
        className={clsx(
          "relative w-full rounded-3xl border-2 transition group-hover:-translate-y-0.5",
          compact ? "mt-0 p-4" : "mt-6 p-5",
          st.panel,
          (selected || !active) && st.glow,
        )}
      >
        <div className="flex items-center gap-4 text-left">
          <span className={clsx("grid shrink-0 place-items-center rounded-full ring-4", compact ? "h-12 w-12" : "h-16 w-16", st.emblem)}>
            <Icon className={clsx("text-white drop-shadow-sm", compact ? "h-6 w-6" : "h-8 w-8")} strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <div className={clsx("font-black uppercase tracking-wide", st.title, compact ? "text-xl" : "text-2xl md:text-3xl")}>{side.title}</div>
            {side.subtitle ? <div className="text-sm font-semibold text-ink-soft">{side.subtitle}</div> : null}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-extrabold", st.chip)}>
            <Star className="h-4 w-4 fill-sun text-sun" /> {side.count} идеи
          </span>
          <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold transition", st.button)}>
            {selected ? "Разглеждате" : "Разгледай"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** "Boys vs girls" split: blue on the left, pink on the right, in the shop's light colours. */
export function GiftSplitHero({
  boys,
  girls,
  active = null,
  compact = false,
  headingLevel = 1,
}: {
  boys: GiftSideSummary;
  girls: GiftSideSummary;
  active?: GiftSideKey | null;
  compact?: boolean;
  headingLevel?: 1 | 2;
}) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <section
      className={clsx("relative overflow-hidden rounded-[2rem] text-ink", compact ? "px-4 py-6 md:px-8 md:py-8" : "px-5 py-10 md:px-10 md:py-14")}
      style={{ background: "linear-gradient(120deg, #e3f3fd 0%, #fff8ef 50%, #fde2ef 100%)" }}
    >
      <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-sky/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-pink-400/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-4 h-40 w-40 -translate-x-1/2 rounded-full bg-sun/30 blur-3xl" />

      <div className="relative text-center">
        <H className={clsx("font-black tracking-tight", compact ? "text-3xl md:text-4xl" : "text-4xl md:text-6xl")}>
          Идеи за <span className="bg-gradient-to-r from-sky via-grape to-pink-500 bg-clip-text text-transparent">подаръци</span>
        </H>
        {!compact ? <p className="mt-2 font-semibold text-ink-soft">Изберете за кого търсите подарък — подбрали сме най-обичаните играчки.</p> : null}
      </div>

      <div className={clsx("relative grid gap-6 md:grid-cols-2", compact ? "mt-5 md:gap-14" : "mt-8 md:gap-20")}>
        <SideCard side={boys} active={active} compact={compact} />
        <SideCard side={girls} active={active} compact={compact} />
        <div
          className={clsx(
            "pointer-events-none absolute left-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 flex-col place-items-center rounded-full border-4 border-white bg-sun-soft shadow-[var(--shadow-lift)] md:grid",
            compact ? "top-1/2 h-14 w-14" : "top-[62%] h-20 w-20",
          )}
          aria-hidden
        >
          <Gift className={clsx("text-brand", compact ? "h-6 w-6" : "h-8 w-8")} />
          {!compact ? <span className="-mt-3 text-[0.65rem] font-black tracking-widest text-ink-soft">ИЛИ</span> : null}
        </div>
      </div>
    </section>
  );
}
