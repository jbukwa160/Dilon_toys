import clsx from "clsx";
import { Newspaper } from "lucide-react";
import { THEMES, type ThemeKey } from "@/lib/settings-types";
import { ProductImage } from "@/components/product/ProductImage";

/** The post's own picture, or a coloured card with the toys the post shows. */
export function BlogCover({
  cover,
  theme,
  images,
  title,
  size = "card",
  eager = false,
}: {
  cover: string;
  theme: ThemeKey;
  images: string[];
  title: string;
  size?: "card" | "hero";
  eager?: boolean;
}) {
  if (cover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={cover} alt={title} loading={eager ? "eager" : "lazy"} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
    );
  }
  const t = THEMES[theme] ?? THEMES.sunrise;
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ background: t.background }} role="img" aria-label={title}>
      <div className={clsx("pointer-events-none absolute -right-8 -top-10 rounded-full", t.dark ? "bg-white/10" : "bg-white/50", size === "hero" ? "h-64 w-64" : "h-40 w-40")} />
      <div className={clsx("pointer-events-none absolute -bottom-12 -left-6 rounded-full", t.dark ? "bg-white/10" : "bg-white/40", size === "hero" ? "h-56 w-56" : "h-32 w-32")} />
      {images.length ? (
        <div className={clsx("relative flex items-end justify-center", size === "hero" ? "gap-4 px-8" : "gap-2.5 px-5")}>
          {images.slice(0, 3).map((src, i) => (
            <span
              key={src}
              className={clsx(
                "block overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]",
                size === "hero" ? "p-3" : "p-2",
                i === 1 ? (size === "hero" ? "h-44 w-44 md:h-52 md:w-52" : "h-28 w-28") : size === "hero" ? "h-32 w-32 md:h-40 md:w-40" : "h-20 w-20",
                i === 0 && "-rotate-6",
                i === 2 && "rotate-6",
              )}
            >
              <ProductImage src={src} alt="" eager={eager} />
            </span>
          ))}
        </div>
      ) : (
        <Newspaper className={clsx("relative", t.dark ? "text-white/80" : "text-ink/30", size === "hero" ? "h-24 w-24" : "h-14 w-14")} />
      )}
    </div>
  );
}
