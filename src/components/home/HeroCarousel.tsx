"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSlide } from "@/lib/settings-types";
import { HeroSlideView, type CollageProduct } from "./HeroSlideView";

export function HeroCarousel({ slides, collage, autoplaySeconds }: { slides: HeroSlide[]; collage: CollageProduct[]; autoplaySeconds: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const startX = useRef<number | null>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const count = slides.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused || autoplaySeconds <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), autoplaySeconds * 1000);
    return () => clearInterval(t);
  }, [count, paused, autoplaySeconds]);

  // Banners can have different heights (text vs. a ready-made picture): follow the active one.
  useEffect(() => {
    const el = slideRefs.current[index];
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [index, count]);

  if (!count) return null;
  if (count === 1) return <HeroSlideView slide={slides[0]} collage={collage} headingLevel={1} eager />;

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label="Банери"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current == null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) > 60) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="overflow-hidden rounded-[2rem] transition-[height] duration-500 ease-out" style={{ height }}>
        <div className="flex items-start transition-transform duration-500 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((s, i) => (
            <div
              key={s.id}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className="w-full shrink-0"
              aria-roledescription="slide"
              aria-label={`${i + 1} от ${count}`}
              aria-hidden={i !== index}
            >
              <HeroSlideView slide={s} collage={collage} headingLevel={i === 0 ? 1 : 2} eager={i === 0} inactive={i !== index} />
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => go(index - 1)}
        className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md hover:bg-white md:grid"
        aria-label="Предишен банер"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md hover:bg-white md:grid"
        aria-label="Следващ банер"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="mt-4 flex justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => go(i)}
            aria-label={`Банер ${i + 1}`}
            aria-current={i === index}
            className={clsx("h-2.5 rounded-full transition-all", i === index ? "w-8 bg-brand" : "w-2.5 bg-line hover:bg-muted")}
          />
        ))}
      </div>
    </div>
  );
}
