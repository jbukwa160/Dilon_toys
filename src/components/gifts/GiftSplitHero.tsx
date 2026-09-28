import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Crown, Gift, Rocket, Star } from "lucide-react";
import type { GiftSideKey } from "@/lib/settings-types";
import { GIFT_SIDE_SLUG } from "@/lib/settings-types";
import type { GiftSideSummary } from "@/lib/gifts";
import { ProductImage } from "@/components/product/ProductImage";

export const SIDE_STYLE: Record<
  GiftSideKey,
  { glow: string; panel: string; emblem: string; button: string; chip: string; icon: typeof Rocket; ring: string; accent: string }
> = {
  boys: {
    glow: "shadow-[0_0_45px_rgba(56,189,248,0.55)]",
    panel: "border-sky-400/80 bg-sky-500/15",
    emblem: "bg-gradient-to-br from-sky-300 via-sky-500 to-blue-700 ring-sky-200/70",
    button: "bg-sky-500 text-white hover:bg-sky-400",
    chip: "bg-sky-400/20 text-sky-100",
    icon: Rocket,
    ring: "ring-sky-300",
    accent: "#38bdf8",
  },
  girls: {
    glow: "shadow-[0_0_45px_rgba(244,114,182,0.6)]",
    panel: "border-pink-400/80 bg-pink-500/15",
    emblem: "bg-gradient-to-br from-pink-300 via-pink-500 to-fuchsia-700 ring-pink-200/70",
    button: "bg-pink-500 text-white hover:bg-pink-400",
    chip: "bg-pink-400/20 text-pink-100",
    icon: Crown,
    ring: "ring-pink-300",
    accent: "#f472b6",
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
          "relative w-full rounded-3xl border-2 backdrop-blur transition group-hover:brightness-110",
          compact ? "mt-0 p-4" : "mt-6 p-5",
          st.panel,
          (selected || !active) && st.glow,
        )}
      >
        <div className="flex items-center gap-4 text-left">
          <span className={clsx("grid shrink-0 place-items-center rounded-full ring-4", compact ? "h-12 w-12" : "h-16 w-16", st.emblem)}>
            <Icon className={clsx("text-white drop-shadow", compact ? "h-6 w-6" : "h-8 w-8")} strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <div className={clsx("font-black uppercase tracking-wide text-white", compact ? "text-xl" : "text-2xl md:text-3xl")}>{side.title}</div>
            {side.subtitle ? <div className="text-sm font-semibold text-white/75">{side.subtitle}</div> : null}
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

/** "Boys vs girls" split, in the style of a game's team-select screen. */
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
    <section className={clsx("relative overflow-hidden rounded-[2rem] bg-[#0a0f2c] text-white", compact ? "px-4 py-6 md:px-8 md:py-8" : "px-5 py-10 md:px-10 md:py-14")}>
      <div className="bg-stars pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-3/5 bg-[radial-gradient(ellipse_at_28%_55%,rgba(56,189,248,0.5),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-3/5 bg-[radial-gradient(ellipse_at_72%_55%,rgba(236,72,153,0.5),transparent_62%)]" />
      <div className="pointer-events-none absolute left-0 right-0 top-[48%] h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <div className="pointer-events-none absolute left-0 right-0 top-[48%] h-6 -translate-y-1/2 bg-gradient-to-r from-sky-400/0 via-white/15 to-pink-400/0 blur-md" />

      <div className="relative text-center">
        <H className={clsx("text-gold font-black uppercase tracking-wide", compact ? "text-3xl md:text-4xl" : "text-4xl md:text-6xl")}>Идеи за подаръци</H>
        {!compact ? <p className="mt-2 font-semibold text-white/75">Изберете за кого търсите подарък — подбрали сме най-обичаните играчки.</p> : null}
      </div>

      <div className={clsx("relative grid gap-6 md:grid-cols-2", compact ? "mt-5 md:gap-14" : "mt-8 md:gap-20")}>
        <SideCard side={boys} active={active} compact={compact} />
        <SideCard side={girls} active={active} compact={compact} />
        <div
          className={clsx(
            "pointer-events-none absolute left-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 flex-col place-items-center rounded-full border-2 border-white/70 bg-[#0a0f2c] shadow-[0_0_40px_rgba(255,255,255,0.45)] md:grid",
            compact ? "top-1/2 h-14 w-14" : "top-[62%] h-20 w-20",
          )}
          aria-hidden
        >
          <Gift className={clsx("text-sun", compact ? "h-6 w-6" : "h-8 w-8")} />
          {!compact ? <span className="-mt-3 text-[0.65rem] font-black tracking-widest text-white/80">ИЛИ</span> : null}
        </div>
      </div>
    </section>
  );
}
