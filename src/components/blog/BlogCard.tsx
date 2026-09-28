import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Clock } from "lucide-react";
import type { BlogCardData } from "@/lib/blog";
import { BlogCover } from "./BlogCover";

export function formatPostDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("bg-BG", { day: "numeric", month: "long", year: "numeric" });
}

export function PostMeta({ post, className }: { post: Pick<BlogCardData, "publishedAt" | "readingMinutes">; className?: string }) {
  return (
    <p className={clsx("flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-muted", className)}>
      {post.publishedAt ? <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time> : null}
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" /> {post.readingMinutes} мин. четене
      </span>
    </p>
  );
}

export function BlogCard({ post, featured = false, eager = false }: { post: BlogCardData; featured?: boolean; eager?: boolean }) {
  return (
    <article
      className={clsx(
        "group relative flex h-full overflow-hidden rounded-[1.75rem] border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        featured ? "flex-col md:grid md:grid-cols-[1.15fr_1fr]" : "flex-col",
      )}
    >
      <div className={clsx("overflow-hidden", featured ? "aspect-[16/10] md:aspect-auto md:min-h-80" : "aspect-[16/10]")}>
        <div className="h-full w-full transition duration-500 group-hover:scale-[1.03]">
          <BlogCover cover={post.cover} theme={post.theme} images={post.coverImages} title={post.title} size={featured ? "hero" : "card"} eager={eager} />
        </div>
      </div>
      <div className={clsx("flex flex-1 flex-col", featured ? "p-6 md:p-9" : "p-5")}>
        {post.topic ? <span className="mb-2 w-fit rounded-full bg-sun-soft px-3 py-1 text-xs font-extrabold text-ink">{post.topic}</span> : null}
        <h3 className={clsx("font-black leading-tight tracking-tight", featured ? "text-2xl md:text-3xl" : "text-lg")}>
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-brand">
            {post.title}
          </Link>
        </h3>
        {post.excerpt ? <p className={clsx("mt-2 text-ink-soft", featured ? "text-lg" : "line-clamp-3 text-[0.95rem]")}>{post.excerpt}</p> : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <PostMeta post={post} />
          <ArrowRight className="h-5 w-5 shrink-0 text-brand transition group-hover:translate-x-1" />
        </div>
      </div>
    </article>
  );
}
