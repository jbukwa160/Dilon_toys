import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProductCard as Card } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products, eagerCount = 4 }: { products: Card[]; eagerCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} eager={i < eagerCount} />
        </li>
      ))}
    </ul>
  );
}

export function ProductShelf({
  title,
  subtitle,
  href,
  products,
  accent,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  products: Card[];
  accent?: React.ReactNode;
}) {
  if (!products.length) return null;
  return (
    <section className="container-shop py-8 md:py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight md:text-3xl">
            {accent}
            {title}
          </h2>
          {subtitle ? <p className="mt-1 text-muted">{subtitle}</p> : null}
        </div>
        {href ? (
          <Link href={href} className="hidden shrink-0 items-center gap-1 font-extrabold text-brand hover:underline sm:inline-flex">
            Виж всички <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      <ul className="scroll-row -mx-1 px-1">
        {products.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
      {href ? (
        <Link href={href} className="btn btn-ghost mt-4 h-11 w-full sm:hidden">
          Виж всички <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </section>
  );
}
