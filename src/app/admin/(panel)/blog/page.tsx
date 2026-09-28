import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listAllPosts } from "@/lib/blog";
import { PageHeader } from "@/components/admin/PageHeader";
import { BlogCover } from "@/components/blog/BlogCover";
import { formatPostDate } from "@/components/blog/BlogCard";

export const metadata: Metadata = { title: "Блог" };

export default async function AdminBlogPage() {
  await requireAdmin();
  const posts = listAllPosts();
  const now = new Date().toISOString();
  const live = posts.filter((p) => p.published && p.publishedAt && p.publishedAt <= now).length;
  return (
    <>
      <PageHeader
        title="Блог"
        description="Статиите помагат на магазина да се показва в Google, когато родителите търсят съвети и идеи за подаръци. Пишете полезно, с подзаглавия и връзки към категории и продукти."
        actions={
          <Link href="/admin/blog/nova" className="btn btn-primary h-12 px-6">
            <Plus className="h-5 w-5" strokeWidth={3} /> Нова статия
          </Link>
        }
      />
      <p className="mb-4 text-sm font-bold text-muted">
        {live} публикувани · {posts.length - live} чернови или насрочени
      </p>
      {posts.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white">
          {posts.map((p) => {
            const scheduled = p.published && p.publishedAt && p.publishedAt > now;
            const isLive = p.published && !scheduled;
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl">
                  <BlogCover cover={p.cover} theme={p.theme} images={p.coverImages.slice(0, 1)} title="" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/blog/${p.id}`} className="line-clamp-2 font-black leading-snug hover:text-brand">
                    {p.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
                    {isLive ? (
                      <span className="rounded-full bg-mint-soft px-2 py-0.5 text-mint">Публикувана</span>
                    ) : scheduled ? (
                      <span className="rounded-full bg-sky-soft px-2 py-0.5 text-sky">Насрочена за {formatPostDate(p.publishedAt)}</span>
                    ) : (
                      <span className="rounded-full bg-canvas px-2 py-0.5 text-ink-soft">Чернова</span>
                    )}
                    {p.topic ? <span>{p.topic}</span> : null}
                    {p.publishedAt && !scheduled ? <span>· {formatPostDate(p.publishedAt)}</span> : null}
                    <span>· {p.readingMinutes} мин. четене</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/blog/${p.id}`} className="btn btn-ghost h-10 px-4 text-sm">
                    <Pencil className="h-4 w-4" /> Редактирай
                  </Link>
                  {isLive ? (
                    <a href={`/blog/${p.slug}`} target="_blank" rel="noopener" className="btn btn-ghost h-10 w-10 !px-0" aria-label={`Виж „${p.title}“ в сайта`}>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-3xl border border-dashed border-line bg-white p-10 text-center font-bold text-ink-soft">Все още няма статии. Натиснете „Нова статия“.</div>
      )}
    </>
  );
}
