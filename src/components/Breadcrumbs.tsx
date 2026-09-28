import Link from "next/link";
import { ChevronRight, House } from "lucide-react";
import { site } from "@/config/site";

export type Crumb = { href?: string; label: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ href: "/", label: "Начало" }, ...items];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: new URL(c.href, site.url).toString() } : {}),
    })),
  };
  return (
    <nav aria-label="Навигация" className="py-4 text-sm font-semibold text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {all.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
            {c.href && i < all.length - 1 ? (
              <Link href={c.href} className="flex items-center gap-1 hover:text-brand">
                {i === 0 ? <House className="h-3.5 w-3.5" /> : null}
                {c.label}
              </Link>
            ) : (
              <span className="line-clamp-1 text-ink-soft">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </nav>
  );
}

export function PageTitle({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-ink-soft">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}
