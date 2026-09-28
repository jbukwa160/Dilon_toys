import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { THEMES, isExternalHref, type HeroSlide } from "@/lib/settings-types";
import { ProductImage } from "@/components/product/ProductImage";

export type CollageProduct = { id: number; slug: string; name: string; image: string | null };

const ROTATE = [-3, 2.5, 2, -2];

function SmartLink({ href, className, children, tabIndex }: { href: string; className?: string; children: React.ReactNode; tabIndex?: number }) {
  const external = isExternalHref(href);
  return (
    <Link href={href} className={className} tabIndex={tabIndex} target={external ? "_blank" : undefined} rel={external ? "noopener" : undefined}>
      {children}
    </Link>
  );
}

/** One home-page banner. Used by the storefront carousel and by the admin preview. */
export function HeroSlideView({
  slide,
  collage,
  headingLevel = 2,
  eager = false,
  inactive = false,
}: {
  slide: HeroSlide;
  collage: CollageProduct[];
  headingLevel?: 1 | 2;
  eager?: boolean;
  /** Slides off screen in the carousel: keep their links out of the tab order. */
  inactive?: boolean;
}) {
  const theme = THEMES[slide.theme];
  const tab = inactive ? -1 : undefined;

  if (slide.layout === "image-only") {
    const picture = slide.image ? (
      <picture>
        {slide.mobileImage ? <source media="(max-width: 767px)" srcSet={slide.mobileImage} /> : null}
        <img src={slide.image} alt={slide.title || "Банер"} loading={eager ? "eager" : "lazy"} className="block h-auto w-full" />
      </picture>
    ) : (
      <div className="grid aspect-[3/1] place-items-center text-lg font-bold text-muted">Качете снимка за банера</div>
    );
    return (
      <div className="overflow-hidden rounded-[2rem]" style={{ background: theme.background }}>
        {slide.href ? (
          <SmartLink href={slide.href} className="block w-full" tabIndex={tab}>
            {picture}
          </SmartLink>
        ) : (
          <div className="w-full">{picture}</div>
        )}
      </div>
    );
  }

  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <div
      className={clsx("relative h-full overflow-hidden rounded-[2rem] px-6 py-10 md:px-12 md:py-14", theme.dark ? "text-white" : "text-ink")}
      style={{ background: theme.background }}
    >
      {!theme.dark ? (
        <>
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-sun/40 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 right-1/3 h-64 w-64 rounded-full bg-grape/15 blur-3xl" />
        </>
      ) : null}
      <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div>
          {slide.eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-extrabold text-brand shadow-sm">
              <Sparkles className="h-4 w-4" /> {slide.eyebrow}
            </span>
          ) : null}
          <H className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.6rem]">
            {slide.title}
            {slide.highlight ? <> <span className={theme.dark ? "text-sun" : "text-brand"}>{slide.highlight}</span></> : null}
          </H>
          {slide.text ? <p className={clsx("mt-5 max-w-xl text-lg font-semibold", theme.dark ? "text-white/85" : "text-ink-soft")}>{slide.text}</p> : null}
          {(slide.primary.label && slide.primary.href) || (slide.secondary.label && slide.secondary.href) ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {slide.primary.label && slide.primary.href ? (
                <SmartLink
                  href={slide.primary.href}
                  tabIndex={tab}
                  className={clsx("btn h-14 px-8 text-lg", theme.dark ? "bg-white text-ink shadow-[0_4px_0_rgb(0_0_0/0.15)] hover:bg-sun-soft" : "btn-primary")}
                >
                  {slide.primary.label} <ArrowRight className="h-5 w-5" />
                </SmartLink>
              ) : null}
              {slide.secondary.label && slide.secondary.href ? (
                <SmartLink
                  href={slide.secondary.href}
                  tabIndex={tab}
                  className={clsx("btn h-14 px-7 text-lg", theme.dark ? "border-2 border-white/50 text-white hover:bg-white/10" : "btn-ghost")}
                >
                  {slide.secondary.label}
                </SmartLink>
              ) : null}
            </div>
          ) : null}
        </div>

        {slide.image ? (
          <div className="relative mx-auto w-full max-w-[560px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.image} alt="" loading={eager ? "eager" : "lazy"} className="max-h-[440px] w-full rounded-3xl object-contain" />
          </div>
        ) : collage.length ? (
          <div className="relative mx-auto grid w-full max-w-[520px] grid-cols-2 gap-4">
            {collage.slice(0, 4).map((p, i) => (
              <Link
                key={p.id}
                href={`/produkt/${p.slug}`}
                tabIndex={tab}
                className="group relative aspect-square overflow-hidden rounded-3xl bg-white p-5 shadow-[var(--shadow-lift)] transition hover:-translate-y-1"
                style={{ transform: `rotate(${ROTATE[i]}deg)` }}
              >
                <ProductImage src={p.image} alt={p.name} eager={eager} />
                <span className="absolute bottom-3 left-3 right-3 truncate rounded-full bg-ink/85 px-3 py-1 text-center text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">
                  {p.name}
                </span>
              </Link>
            ))}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-grape px-5 py-2 text-sm font-extrabold text-white shadow-lg">
              <Star className="-mt-0.5 mr-1 inline h-4 w-4 fill-sun text-sun" />
              Бонус точки с всяка покупка
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
