import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { allTopics, localDate } from "@/lib/blog";
import { getLinkOptions } from "@/lib/admin/link-options";
import { getSettings } from "@/lib/settings";
import { site } from "@/config/site";
import { PageHeader } from "@/components/admin/PageHeader";
import { BlogEditor } from "@/components/admin/BlogEditor";

export const metadata: Metadata = { title: "Нова статия" };

export default async function NewBlogPostPage() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/blog" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Всички статии
      </Link>
      <PageHeader title="Нова статия" description="Напишете заглавие и текст. Статията се появява в сайта, когато е включено „Публикувана“ и я запазите." />
      <BlogEditor
        id={null}
        initial={{
          title: "",
          slug: "",
          excerpt: "",
          body: "",
          cover: "",
          theme: "sunrise",
          topic: "",
          metaTitle: "",
          metaDescription: "",
          published: true,
          publishedDate: localDate(new Date().toISOString()),
        }}
        topics={allTopics()}
        linkOptions={getLinkOptions()}
        siteUrl={site.url}
        storeName={getSettings().name}
      />
    </>
  );
}
