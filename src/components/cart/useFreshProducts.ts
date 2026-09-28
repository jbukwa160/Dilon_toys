"use client";

import { useEffect, useRef } from "react";
import type { CartProduct } from "@/lib/store";

/** Once per mount, re-fetch price/stock for the given ids and hand them to `apply`. */
export function useFreshProducts(ids: number[], apply: (fresh: CartProduct[]) => void) {
  const done = useRef(false);
  const key = ids.join(",");
  useEffect(() => {
    if (done.current || !key) return;
    done.current = true;
    fetch(`/api/products?ids=${key}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { products: CartProduct[] } | null) => {
        if (d) apply(d.products);
      })
      .catch(() => {});
  }, [key, apply]);
}
