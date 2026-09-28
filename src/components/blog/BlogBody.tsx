import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import type { ProductCard as Card } from "@/lib/catalog";
import type { Block, Inline } from "@/lib/blog-markup";
import { isExternalHref } from "@/lib/settings-types";
import { ProductCard } from "@/components/product/ProductCard";

// Renders a post's blocks (see lib/blog-markup.ts). Used on the site and in the admin preview.

function Inlines({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.t) {
          case "text":
            return n.v;
          case "br":
            return <br key={i} />;
          case "b":
            return (
              <strong key={i} className="font-extrabold text-ink">
                <Inlines nodes={n.c} />
              </strong>
            );
          case "i":
            return (
              <em key={i}>
                <Inlines nodes={n.c} />
              </em>
            );
          case "a":
            return isExternalHref(n.href) ? (
              <a key={i} href={n.href} target="_blank" rel="noopener" className="font-bold text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand">
                <Inlines nodes={n.c} />
              </a>
            ) : (
              <Link key={i} href={n.href} className="font-bold text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand">
                <Inlines nodes={n.c} />
              </Link>
            );
        }
      })}
    </>
  );
}

export function BlogBody({ blocks, products }: { blocks: Block[]; products: Record<string, Card> }) {
  return (
    <div className="text-[1.075rem] leading-[1.75] text-ink-soft">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2 key={i} id={b.id} className="mb-3 mt-10 scroll-mt-48 text-2xl font-black leading-tight tracking-tight text-ink md:text-[1.7rem]">
                {b.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} id={b.id} className="mb-2 mt-7 scroll-mt-48 text-xl font-extrabold leading-snug text-ink">
                {b.text}
              </h3>
            );
          case "p":
            return (
              <p key={i} className="my-4">
                <Inlines nodes={b.c} />
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="my-4 list-disc space-y-2 pl-6 marker:text-brand">
                {b.items.map((it, j) => (
                  <li key={j} className="pl-1">
                    <Inlines nodes={it} />
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="my-4 list-decimal space-y-2 pl-6 marker:font-black marker:text-brand">
                {b.items.map((it, j) => (
                  <li key={j} className="pl-1">
                    <Inlines nodes={it} />
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <aside key={i} className="my-6 flex gap-3 rounded-2xl border-l-4 border-sun bg-sun-soft px-5 py-4 font-semibold text-ink">
                <Lightbulb className="mt-1 h-5 w-5 shrink-0 text-[#c98a00]" aria-hidden />
                <p>
                  <Inlines nodes={b.c} />
                </p>
              </aside>
            );
          case "image":
            return (
              <figure key={i} className="my-7">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.src} alt={b.alt} loading="lazy" referrerPolicy="no-referrer" className="w-full rounded-2xl border border-line bg-white object-contain" />
                {b.alt ? <figcaption className="mt-2 text-center text-sm text-muted">{b.alt}</figcaption> : null}
              </figure>
            );
          case "products": {
            const list = b.skus.map((s) => products[s]).filter(Boolean);
            if (!list.length) return null;
            return (
              <div key={i} className="not-prose my-7 rounded-3xl bg-canvas p-3 sm:p-4">
                <ul className={list.length === 1 ? "grid max-w-xs grid-cols-1 gap-3" : "grid grid-cols-2 gap-3 md:grid-cols-3"}>
                  {list.map((p) => (
                    <li key={p.id}>
                      <ProductCard product={p} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
          case "button":
            return (
              <p key={i} className="my-7 text-center">
                {isExternalHref(b.href) ? (
                  <a href={b.href} target="_blank" rel="noopener" className="btn btn-primary h-12 px-7">
                    {b.label} <ArrowRight className="h-4 w-4" />
                  </a>
                ) : (
                  <Link href={b.href} className="btn btn-primary h-12 px-7">
                    {b.label} <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </p>
            );
        }
      })}
    </div>
  );
}
