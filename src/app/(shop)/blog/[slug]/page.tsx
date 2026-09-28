import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, Gift, ListOrdered, Star } from "lucide-react";
import { site } from "@/config/site";
import { getPublishedPost, relatedPosts, renamedPostSlug, topicSlug, type BlogPost } from "@/lib/blog";
import { faq, headings, parseBody, productSkus, readingMinutes, wordCount } from "@/lib/blog-markup";
import { productCardsBySku, productImagesBySku } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";
import { BlogBody } from "@/components/blog/BlogBody";
import { BlogCard, PostMeta } from "@/components/blog/BlogCard";
import { BlogCover } from "@/components/blog/BlogCover";
import { ShareButtons } from "@/components/blog/ShareButtons";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

function coverImages(post: BlogPost): string[] {
  const skus = productSkus(parseBody(post.body)).slice(0, 6);
  const imgs = productImagesBySku(skus);
  return skus.map((s) => imgs.get(s)).filter((x): x is string => !!x).slice(0, 3);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPublishedPost((await params).slug);
  if (!post) return {};
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt;
  const image = post.cover ? new URL(post.cover, site.url).toString() : coverImages(post)[0];
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      section: post.topic || undefined,
      images: image ? [image] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPublishedPost(slug);
  if (!post) {
    const moved = renamedPostSlug(slug);
    if (moved) permanentRedirect(`/blog/${moved}`);
    notFound();
  }
  const s = getSettings();
  const blocks = parseBody(post.body);
  const products = productCardsBySku(productSkus(blocks));
  const toc = headings(blocks).filter((h) => h.level === 2);
  const questions = faq(blocks);
  const related = relatedPosts(post, 3);
  const images = coverImages(post);
  const url = new URL(`/blog/${post.slug}`, site.url).toString();
  const minutes = readingMinutes(post.body);

  const crumbs: Crumb[] = [{ href: "/blog", label: "Блог" }];
  if (post.topic) crumbs.push({ href: `/blog?tema=${topicSlug(post.topic)}`, label: post.topic });
  crumbs.push({ label: post.title });

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.metaDescription || post.excerpt,
      url,
      mainEntityOfPage: url,
      inLanguage: "bg",
      ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
      dateModified: post.updatedAt,
      ...(post.cover || images.length ? { image: post.cover ? [new URL(post.cover, site.url).toString()] : images } : {}),
      ...(post.topic ? { articleSection: post.topic } : {}),
      wordCount: wordCount(post.body),
      author: { "@type": "Organization", name: s.name, url: site.url },
      publisher: { "@type": "Organization", name: s.name, url: site.url, logo: { "@type": "ImageObject", url: new URL("/icon.svg", site.url).toString() } },
    },
  ];
  if (questions.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: questions.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } })),
    });
  }

  const tocList = (
    <ol className="space-y-1.5 text-[0.95rem]">
      {toc.map((h, i) => (
        <li key={h.id} className="flex gap-2">
          <span className="font-black text-brand">{i + 1}.</span>
          <a href={`#${h.id}`} className="font-semibold text-ink-soft hover:text-brand">
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="container-shop pb-10">
      <Breadcrumbs items={crumbs} />

      <article>
        <header className="mx-auto max-w-4xl text-center">
          {post.topic ? (
            <Link href={`/blog?tema=${topicSlug(post.topic)}`} className="inline-block rounded-full bg-sun-soft px-3.5 py-1 text-sm font-extrabold text-ink hover:bg-sun">
              {post.topic}
            </Link>
          ) : null}
          <h1 className="mt-4 text-3xl font-black leading-[1.12] tracking-tight md:text-5xl">{post.title}</h1>
          {post.excerpt ? <p className="mx-auto mt-4 max-w-3xl text-lg text-ink-soft md:text-xl">{post.excerpt}</p> : null}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span className="text-sm font-extrabold">Екипът на {s.name}</span>
            <PostMeta post={{ publishedAt: post.publishedAt, readingMinutes: minutes }} />
          </div>
        </header>

        <div className="mx-auto mt-8 aspect-[16/9] max-w-5xl overflow-hidden rounded-[2rem] md:aspect-[21/9]">
          <BlogCover cover={post.cover} theme={post.theme} images={images} title={post.title} size="hero" eager />
        </div>

        <div className="mx-auto mt-8 grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 max-w-3xl">
            {toc.length > 2 ? (
              <details className="mb-6 rounded-2xl border border-line bg-white p-4 lg:hidden">
                <summary className="flex cursor-pointer items-center gap-2 font-black">
                  <ListOrdered className="h-5 w-5 text-brand" /> В тази статия
                </summary>
                <div className="mt-3">{tocList}</div>
              </details>
            ) : null}

            <BlogBody blocks={blocks} products={products} />

            <div className="mt-10 border-t border-line pt-6">
              <ShareButtons url={url} title={post.title} />
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-48 space-y-4">
              {toc.length > 2 ? (
                <nav aria-label="Съдържание" className="rounded-3xl border border-line bg-white p-5">
                  <p className="mb-3 flex items-center gap-2 font-black">
                    <ListOrdered className="h-5 w-5 text-brand" /> В тази статия
                  </p>
                  {tocList}
                </nav>
              ) : null}
              <div className="rounded-3xl bg-grape p-5 text-white">
                <Star className="h-7 w-7 fill-sun text-sun" />
                <p className="mt-2 font-black">Бонус точки с всяка покупка</p>
                <p className="mt-1 text-sm text-white/80">Събирайте точки и ги използвайте за отстъпка при следващата поръчка.</p>
                <Link href="/bonus-programa" className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-sun hover:underline">
                  Как работи <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <Link href="/podaratsi" className="flex items-center gap-3 rounded-3xl border border-line bg-white p-5 font-black hover:border-ink">
                <Gift className="h-7 w-7 text-brand" /> Идеи за подаръци <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </article>

      {related.length ? (
        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">Още полезни статии</h2>
            <Link href="/blog" className="inline-flex items-center gap-1 font-extrabold text-brand hover:underline">
              Всички статии <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <li key={p.id}>
                <BlogCard post={p} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {jsonLd.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }} />
      ))}
    </div>
  );
}
