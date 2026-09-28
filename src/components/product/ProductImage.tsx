"use client";

import { useState } from "react";
import clsx from "clsx";

// Product photos are hotlinked from many supplier hosts, so next/image's allow-list
// doesn't fit; a plain <img> with a friendly fallback does.
export function ProductImage({
  src,
  alt,
  className,
  eager = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const url = !src || failed ? "/placeholder.svg" : src;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={clsx("h-full w-full object-contain", className)}
    />
  );
}
