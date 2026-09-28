import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { allTopics, getPost, localDate } from "@/lib/blog";
import { getLinkOptions } from "@/lib/admin/link-options";
import { getSettings } from "@/lib/settings";
import { site } from "@/config/site";
import { PageHeader } from "@/components/admin/PageHeader";
import { BlogEditor } from "@/components/admin/BlogEditor";

export const metadata: Metadata = { title: "Редактиране на статия" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

export default async function EditBlogPostPage({ params, searchParams }: Props) {
  await requireAdmin();
  const id = parseInt((await params).id, 10);
  const post = Number.isInteger(id) ? getPost(id) : null;
  if (!post) notFound();
  const justCreated = (await searchParams).saved === "1";
  return (
    <>
      <Link href="/admin/blog" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Всички статии
      </Link>
      <PageHeader title="Редактиране на статия" />
      {justCreated ? (
        <p className="mb-5 flex items-center gap-2 rounded-2xl bg-mint-soft px-4 py-3 font-bold text-mint">
          <Check className="h-5 w-5" strokeWidth={3} /> Статията е запазена.
        </p>
      ) : null}
      <BlogEditor
        key={post.id}
        id={post.id}
        initial={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          body: post.body,
          cover: post.cover,
          theme: post.theme,
          topic: post.topic,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          published: post.published,
          publishedDate: post.publishedAt ? localDate(post.publishedAt) : "",
        }}
        topics={allTopics()}
        linkOptions={getLinkOptions()}
        siteUrl={site.url}
        storeName={getSettings().name}
      />
    </>
  );
}
