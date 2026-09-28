import type { ThemeKey } from "@/lib/settings-types";

/** A starter blog post, inserted once into store.db the first time the blog is used (see lib/blog.ts). */
export type SeedPost = {
  slug: string;
  title: string;
  /** Shown in the post list and used as the Google description if `metaDescription` is empty. */
  excerpt: string;
  topic: string;
  metaTitle: string;
  metaDescription: string;
  /** Background of the cover when the post has no cover picture. */
  theme: ThemeKey;
  /** Text in the blog's simple markup — see src/lib/blog-markup.ts. */
  body: string;
};
