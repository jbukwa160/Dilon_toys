"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { ProductImage } from "@/components/product/ProductImage";
import { formatNumber, formatPrice } from "@/lib/format";

type Suggest = {
  products: { id: number; slug: string; name: string; image: string | null; price: number; brand: string | null; code: { sku: string; ean: string | null } | null }[];
  categories: { slug: string; name: string }[];
  brands: { slug: string; name: string }[];
  total: number;
};

export function SearchBox({ autoFocus = false, onNavigate }: { autoFocus?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [data, setData] = useState<Suggest | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: Suggest | null) => setData(d))
        .catch(() => {});
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const done = () => {
    setOpen(false);
    onNavigate?.();
  };

  const showPanel = open && q.trim().length >= 2 && data;

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        role="search"
        action="/tarsene"
        onSubmit={(e) => {
          e.preventDefault();
          const term = q.trim();
          if (!term) return;
          done();
          router.push(`/tarsene?q=${encodeURIComponent(term)}`);
        }}
        className="flex h-12 items-center rounded-full border-2 border-line bg-white pl-4 pr-1.5 transition focus-within:border-sky"
      >
        <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
        <input
          name="q"
          value={q}
          autoFocus={autoFocus}
          autoComplete="off"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Търси играчки, марки, герои…"
          aria-label="Търсене"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={!!showPanel}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[1rem] outline-none placeholder:text-muted focus-visible:outline-none"
        />
        {q ? (
          <button type="button" onClick={() => setQ("")} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-canvas" aria-label="Изчисти">
            <X className="h-4 w-4" />
          </button>
        ) : null}
        <button type="submit" className="btn btn-primary h-9 px-4 text-sm !shadow-none">
          Търси
        </button>
      </form>

      {showPanel ? (
        <div id={listId} className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-lift)]">
          {data.categories.length || data.brands.length ? (
            <div className="flex flex-wrap gap-2 border-b border-line p-3">
              {data.categories.map((c) => (
                <Link key={c.slug} href={`/kategoria/${c.slug}`} onClick={done} className="chip !bg-sun-soft !border-sun-soft">
                  {c.name}
                </Link>
              ))}
              {data.brands.map((b) => (
                <Link key={b.slug} href={`/marka/${b.slug}`} onClick={done} className="chip">
                  Марка: {b.name}
                </Link>
              ))}
            </div>
          ) : null}
          {data.products.length ? (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {data.products.map((p) => (
                <li key={p.id}>
                  <Link href={`/produkt/${p.slug}`} onClick={done} className="flex items-center gap-3 px-3 py-2 hover:bg-canvas">
                    <span className="h-12 w-12 shrink-0 rounded-lg border border-line bg-white p-1">
                      <ProductImage src={p.image} alt="" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm font-bold">{p.name}</span>
                      {p.code ? (
                        <span className="text-xs font-semibold text-muted">
                          Код {p.code.sku}
                          {p.code.ean ? ` · Баркод ${p.code.ean}` : ""}
                        </span>
                      ) : p.brand ? (
                        <span className="text-xs text-muted">{p.brand}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-sm font-black">{formatPrice(p.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-sm text-muted">Няма намерени играчки за „{q.trim()}“.</p>
          )}
          {data.total > data.products.length ? (
            <Link
              href={`/tarsene?q=${encodeURIComponent(q.trim())}`}
              onClick={done}
              className="block border-t border-line bg-canvas px-4 py-3 text-center text-sm font-extrabold text-brand hover:underline"
            >
              Виж всички {formatNumber(data.total)} резултата
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
