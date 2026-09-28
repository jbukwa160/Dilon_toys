"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/store";
import { ProductCard } from "@/components/product/ProductCard";
import { useFreshProducts } from "./useFreshProducts";

export function WishlistView() {
  const { items, refresh } = useWishlist();
  useFreshProducts(
    items.map((i) => i.id),
    refresh,
  );

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-white px-6 py-16 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-soft">
          <Heart className="h-9 w-9 text-brand" />
        </span>
        <p className="text-xl font-black">Все още нямате любими играчки</p>
        <p className="text-muted">Натиснете сърчицето на продукт, за да го запазите тук.</p>
        <Link href="/igrachki" className="btn btn-primary h-12 px-8">
          Разгледай играчките
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <li key={p.id}>
          <ProductCard product={{ ...p, brandSlug: null, category: "", subcategory: null, ageMin: null }} />
        </li>
      ))}
    </ul>
  );
}
