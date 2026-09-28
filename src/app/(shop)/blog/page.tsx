import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Gift } from "lucide-react";
import { site } from "@/config/site";
import { listPublished } from "@/lib/blog";
import { getSettings } from "@/lib/settings";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";
import { BlogCard } from "@/components/blog/BlogCard";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function read(searchParams: Props["searchParams"]) {
  const sp = await searchParams;
  const tema = one(sp.tema).slice(0, 60) || null;
  const page = Math.max(1, parseInt(one(sp.stranitsa), 10) || 1);
  return { tema, page, data: listPublished({ topic: tema, page }) };
}

const href = (tema: string | null, page = 1) => {
  const q = new URLSearchParams();
  if (tema) q.set("tema", tema);
  if (page > 1) q.set("stranitsa", String(page));
  const s = q.toString();
  return s ? `/blog?${s}` : "/blog";
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { data } = await read(searchParams);
  const title = data.topic ? `${data.topic.name} — блог` : "Блог — съвети за играчки и идеи за подаръци";
  const description = data.topic
    ? `Статии в рубрика „${data.topic.name}“: практични съвети за родители и идеи за подаръци от ${getSettings().name}.`
    : "Как да изберем играчка според възрастта, идеи за подаръци за момчета и момичета, образователни игри, безопасност и още съвети за родители.";
  return {
    title,
    description,
    alternates: { canonical: href(data.topic?.slug ?? null, data.page) },
    openGraph: { title, description, type: "website" },
  };
}

export default async function BlogIndex({ searchParams }: Props) {
  const { data } = await read(searchParams);
  const { items, topic, topics, page, pageCount } = data;
  const featured = page === 1 && !topic ? items[0] : undefined;
  const rest = featured ? items.slice(1) : items;
  const crumbs: Crumb[] = topic ? [{ href: "/blog", label: "Блог" }, { label: topic.name }] : [{ label: "Блог" }];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `Блог на ${getSettings().name}`,
    url: new URL("/blog", site.url).toString(),
    inLanguage: "bg",
    blogPost: items.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: new URL(`/blog/${p.slug}`, site.url).toString(),
      ...(p.publishedAt ? { datePublished: p.publishedAt } : {}),
    })),
  };

  return (
    <div className="container-shop pb-10">
      <Breadcrumbs items={crumbs} />
      <header className="mb-6 max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight md:text-5xl">{topic ? topic.name : "Блог"}</h1>
        <p className="mt-3 text-lg text-ink-soft">
          {topic
            ? `Всички статии в рубрика „${topic.name}“.`
            : "Съвети как да изберете подходяща играчка, идеи за подаръци по възраст и интереси и игри за цялото семейство."}
        </p>
      </header>

      {topics.length > 1 ? (
        <nav aria-label="Рубрики" className="mb-8 flex flex-wrap gap-2">
          <Link href="/blog" className={clsx("chip", !topic && "!border-ink !bg-ink !text-white")}>
            Всички
          </Link>
          {topics.map((t) => (
            <Link key={t.slug} href={href(t.slug)} className={clsx("chip", topic?.slug === t.slug && "!border-ink !bg-ink !text-white")}>
              {t.name} <span className="opacity-60">{t.count}</span>
            </Link>
          ))}
        </nav>
      ) : null}

      {items.length ? (
        <>
          {featured ? (
            <div className="mb-6">
              <BlogCard post={featured} featured eager />
            </div>
          ) : null}
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p, i) => (
              <li key={p.id}>
                <BlogCard post={p} eager={!featured && i < 3} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="rounded-3xl border border-dashed border-line bg-white p-10 text-center font-bold text-ink-soft">Все още няма статии тук.</p>
      )}

      {pageCount > 1 ? (
        <nav aria-label="Страници" className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {page > 1 ? (
            <Link href={href(topic?.slug ?? null, page - 1)} className="btn btn-ghost h-11 px-4" rel="prev">
              <ArrowLeft className="h-4 w-4" /> Предишна
            </Link>
          ) : null}
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={href(topic?.slug ?? null, n)}
              aria-current={n === page ? "page" : undefined}
              className={clsx("grid h-11 min-w-11 place-items-center rounded-full px-3 font-extrabold", n === page ? "bg-ink text-white" : "hover:bg-white")}
            >
              {n}
            </Link>
          ))}
          {page < pageCount ? (
            <Link href={href(topic?.slug ?? null, page + 1)} className="btn btn-ghost h-11 px-4" rel="next">
              Следваща <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </nav>
      ) : null}

      <section className="mt-12 flex flex-col items-start gap-4 rounded-[2rem] bg-[linear-gradient(120deg,#0284c7,#7552f5_55%,#ec4899)] p-7 text-white md:flex-row md:items-center md:p-10">
        <Gift className="h-12 w-12 shrink-0" />
        <div className="flex-1">
          <h2 className="text-2xl font-black">Търсите подарък?</h2>
          <p className="mt-1 text-white/85">Подбрахме идеи за момчета и момичета, подредени по категории.</p>
        </div>
        <Link href="/podaratsi" className="btn h-12 bg-white px-7 text-ink hover:bg-sun-soft">
          Идеи за подаръци <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
