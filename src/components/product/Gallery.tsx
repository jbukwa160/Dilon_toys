"use client";

import { useState } from "react";
import clsx from "clsx";
import { ProductImage } from "./ProductImage";

export function Gallery({ images, alt, badge }: { images: string[]; alt: string; badge?: React.ReactNode }) {
  const list = images.length ? images : [""];
  const [active, setActive] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-line bg-white p-6 md:p-10">
        <ProductImage src={list[active] || null} alt={alt} eager />
        {badge ? <div className="absolute left-4 top-4">{badge}</div> : null}
      </div>
      {list.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {list.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              className={clsx("h-20 w-20 shrink-0 rounded-2xl border-2 bg-white p-1.5 transition", i === active ? "border-brand" : "border-line hover:border-ink-soft")}
              aria-label={`Снимка ${i + 1}`}
              aria-current={i === active}
            >
              <ProductImage src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
