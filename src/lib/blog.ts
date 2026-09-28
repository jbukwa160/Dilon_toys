import "server-only";
import { storeDb } from "./db";
import { productImagesBySku } from "./catalog";
import { parseBody, productSkus, readingMinutes } from "./blog-markup";
import { THEMES, type ThemeKey } from "./settings-types";
import { slugify } from "./slug";
import { SEED_POSTS } from "./blog-seed";

export type BlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover: string;
  theme: ThemeKey;
  topic: string;
  metaTitle: string;
  metaDescription: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** A post for lists and cards: no body, but reading time and product pictures for the cover. */
export type BlogCardData = Omit<BlogPost, "body"> & { readingMinutes: number; coverImages: string[] };

type Row = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover: string;
  theme: string;
  topic: string;
  meta_title: string;
  meta_description: string;
  published: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export const BLOG_PER_PAGE = 9;

function toPost(r: Row): BlogPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    cover: r.cover,
    theme: r.theme in THEMES ? (r.theme as ThemeKey) : "sunrise",
    topic: r.topic,
    metaTitle: r.meta_title,
    metaDescription: r.meta_description,
    published: !!r.published,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Cards with the first three products of each post (in stock and visible) as cover pictures. */
function toCards(rows: Row[]): BlogCardData[] {
  const skusByPost = rows.map((r) => productSkus(parseBody(r.body)).slice(0, 6));
  const bySku = productImagesBySku(skusByPost.flat());
  return rows.map((r, k) => {
    const { body, ...rest } = toPost(r);
    return {
      ...rest,
      readingMinutes: readingMinutes(body),
      coverImages: skusByPost[k].map((s) => bySku.get(s)).filter((x): x is string => !!x).slice(0, 3),
    };
  });
}

// ---------------------------------------------------------------------------
// Starter posts: added once, the first time the blog is opened. Deleting them later is final.

const g = globalThis as unknown as { __blogSeeded?: boolean };
const DAY = 24 * 60 * 60 * 1000;

function ensureSeeded() {
  if (g.__blogSeeded) return;
  const db = storeDb();
  if (!db.prepare("SELECT 1 FROM settings WHERE key = 'blog_seeded'").get()) {
    db.transaction(() => {
      const empty = (db.prepare("SELECT COUNT(*) AS n FROM blog_posts").get() as { n: number }).n === 0;
      if (empty && SEED_POSTS.length) {
        const insert = db.prepare(
          `INSERT OR IGNORE INTO blog_posts (slug, title, excerpt, body, cover, theme, topic, meta_title, meta_description, published, published_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, '', ?, ?, ?, ?, 1, ?, ?, ?)`,
        );
        const now = Date.now();
        SEED_POSTS.forEach((p, i) => {
          // Newest first in the list, a few days apart.
          const at = new Date(now - i * 3 * DAY).toISOString();
          insert.run(p.slug, p.title, p.excerpt, p.body, p.theme, p.topic, p.metaTitle, p.metaDescription, at, at, at);
        });
      }
      db.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('blog_seeded', 'true', ?)").run(new Date().toISOString());
    })();
  }
  g.__blogSeeded = true;
}

// ---------------------------------------------------------------------------
// Site

const PUBLISHED = "published = 1 AND published_at IS NOT NULL AND published_at <= ?";

export function topicSlug(topic: string): string {
  return slugify(topic, 40);
}

export function listPublished(opts: { topic?: string | null; page?: number; perPage?: number } = {}) {
  ensureSeeded();
  const db = storeDb();
  const now = new Date().toISOString();
  const perPage = opts.perPage ?? BLOG_PER_PAGE;
  const all = db.prepare(`SELECT * FROM blog_posts WHERE ${PUBLISHED} ORDER BY published_at DESC, id DESC`).all(now) as Row[];
  const topics = new Map<string, { slug: string; name: string; count: number }>();
  for (const r of all) {
    if (!r.topic) continue;
    const slug = topicSlug(r.topic);
    const t = topics.get(slug) ?? { slug, name: r.topic, count: 0 };
    t.count++;
    topics.set(slug, t);
  }
  const topic = opts.topic ? topics.get(opts.topic) ?? null : null;
  const rows = topic ? all.filter((r) => topicSlug(r.topic) === topic.slug) : all;
  const pageCount = Math.max(1, Math.ceil(rows.length / perPage));
  const page = Math.min(Math.max(1, opts.page ?? 1), pageCount);
  return {
    items: toCards(rows.slice((page - 1) * perPage, page * perPage)),
    total: rows.length,
    page,
    pageCount,
    topic,
    topics: [...topics.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "bg")),
  };
}

export function latestPosts(limit = 3, exceptId?: number): BlogCardData[] {
  ensureSeeded();
  const rows = storeDb()
    .prepare(`SELECT * FROM blog_posts WHERE ${PUBLISHED} AND id != ? ORDER BY published_at DESC, id DESC LIMIT ?`)
    .all(new Date().toISOString(), exceptId ?? 0, limit) as Row[];
  return toCards(rows);
}

export function getPublishedPost(slug: string): BlogPost | null {
  ensureSeeded();
  const r = storeDb().prepare(`SELECT * FROM blog_posts WHERE slug = ? AND ${PUBLISHED}`).get(slug, new Date().toISOString()) as Row | undefined;
  return r ? toPost(r) : null;
}

/** The current address of a post whose address was changed. */
export function renamedPostSlug(oldSlug: string): string | null {
  const r = storeDb()
    .prepare(
      `SELECT p.slug FROM blog_redirects r JOIN blog_posts p ON p.id = r.post_id
       WHERE r.old_slug = ? AND p.published = 1 AND p.published_at IS NOT NULL AND p.published_at <= ?`,
    )
    .get(oldSlug, new Date().toISOString()) as { slug: string } | undefined;
  return r?.slug ?? null;
}

/** Same topic first, then the newest. */
export function relatedPosts(post: BlogPost, limit = 3): BlogCardData[] {
  const rows = storeDb()
    .prepare(`SELECT * FROM blog_posts WHERE ${PUBLISHED} AND id != ? ORDER BY (topic = ?) DESC, published_at DESC LIMIT ?`)
    .all(new Date().toISOString(), post.id, post.topic, limit) as Row[];
  return toCards(rows);
}

export function publishedPostLinks(): { slug: string; title: string }[] {
  ensureSeeded();
  return storeDb().prepare(`SELECT slug, title FROM blog_posts WHERE ${PUBLISHED} ORDER BY published_at DESC`).all(new Date().toISOString()) as { slug: string; title: string }[];
}

export function sitemapPosts(): { slug: string; updatedAt: string }[] {
  ensureSeeded();
  return (storeDb().prepare(`SELECT slug, updated_at FROM blog_posts WHERE ${PUBLISHED} ORDER BY published_at DESC`).all(new Date().toISOString()) as { slug: string; updated_at: string }[]).map(
    (r) => ({ slug: r.slug, updatedAt: r.updated_at }),
  );
}

// ---------------------------------------------------------------------------
// Admin

export function listAllPosts(): BlogCardData[] {
  ensureSeeded();
  return toCards(storeDb().prepare("SELECT * FROM blog_posts ORDER BY COALESCE(published_at, created_at) DESC, id DESC").all() as Row[]);
}

export function getPost(id: number): BlogPost | null {
  ensureSeeded();
  const r = storeDb().prepare("SELECT * FROM blog_posts WHERE id = ?").get(id) as Row | undefined;
  return r ? toPost(r) : null;
}

export function allTopics(): string[] {
  ensureSeeded();
  return (storeDb().prepare("SELECT DISTINCT topic FROM blog_posts WHERE topic != '' ORDER BY topic").all() as { topic: string }[]).map((r) => r.topic);
}

export type BlogPostInput = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover: string;
  theme: string;
  topic: string;
  metaTitle: string;
  metaDescription: string;
  published: boolean;
  /** YYYY-MM-DD from the date field, or empty for "today". */
  publishedDate: string;
};

/** YYYY-MM-DD in local time — what the admin's date field shows. */
export function localDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim().slice(0, max) : "");
const oneLine = (v: unknown, max: number) => clip(v, max).replace(/\s+/g, " ");

function coverImage(v: unknown): string {
  const t = typeof v === "string" ? v.trim() : "";
  if (/^\/uploads\/[a-z0-9]+\.[a-z]+$/.test(t)) return t;
  if (/^https?:\/\/[^\s<>"]+$/i.test(t)) return t.slice(0, 1000);
  return "";
}

export function savePost(id: number | null, input: BlogPostInput): { id: number; slug: string } | { error: string } {
  const db = storeDb();
  const existing = id ? getPost(id) : null;
  if (id && !existing) return { error: "Статията не е намерена." };
  const title = oneLine(input.title, 140);
  if (!title) return { error: "Въведете заглавие на статията." };
  const slug = slugify(oneLine(input.slug, 100) || title, 80);
  if (!slug) return { error: "Въведете адрес на страницата (с латински букви)." };
  const clash = db.prepare("SELECT id FROM blog_posts WHERE slug = ? AND id != ?").get(slug, id ?? 0);
  if (clash) return { error: `Адресът „/blog/${slug}“ вече се използва от друга статия. Сменете го.` };

  let publishedAt: string | null = existing?.publishedAt ?? null;
  const date = oneLine(input.publishedDate, 10);
  // A new date from the date field; an unchanged one keeps the time of day.
  if (/^\d{4}-\d{2}-\d{2}$/.test(date) && (!publishedAt || localDate(publishedAt) !== date)) {
    // Today means "now"; another day starts at 9:00.
    const d = date === localDate(new Date().toISOString()) ? new Date() : new Date(`${date}T09:00:00`);
    if (Number.isNaN(d.getTime())) return { error: "Невалидна дата на публикуване." };
    publishedAt = d.toISOString();
  }
  if (input.published && !publishedAt) publishedAt = new Date().toISOString();

  const now = new Date().toISOString();
  const values = {
    slug,
    title,
    excerpt: oneLine(input.excerpt, 300),
    body: clip(input.body, 60_000),
    cover: coverImage(input.cover),
    theme: input.theme in THEMES ? input.theme : "sunrise",
    topic: oneLine(input.topic, 40),
    meta_title: oneLine(input.metaTitle, 90),
    meta_description: oneLine(input.metaDescription, 300),
    published: input.published ? 1 : 0,
    published_at: publishedAt,
    updated_at: now,
  };

  return db.transaction(() => {
    let postId = id;
    if (existing) {
      db.prepare(
        `UPDATE blog_posts SET slug = @slug, title = @title, excerpt = @excerpt, body = @body, cover = @cover, theme = @theme, topic = @topic,
           meta_title = @meta_title, meta_description = @meta_description, published = @published, published_at = @published_at, updated_at = @updated_at
         WHERE id = @id`,
      ).run({ ...values, id });
      // The old address keeps working (and tells Google the page moved).
      if (existing.slug !== slug) db.prepare("INSERT OR REPLACE INTO blog_redirects (old_slug, post_id) VALUES (?, ?)").run(existing.slug, id);
    } else {
      const r = db
        .prepare(
          `INSERT INTO blog_posts (slug, title, excerpt, body, cover, theme, topic, meta_title, meta_description, published, published_at, created_at, updated_at)
           VALUES (@slug, @title, @excerpt, @body, @cover, @theme, @topic, @meta_title, @meta_description, @published, @published_at, @created_at, @updated_at)`,
        )
        .run({ ...values, created_at: now });
      postId = Number(r.lastInsertRowid);
    }
    // A post now living at an old address takes it over.
    db.prepare("DELETE FROM blog_redirects WHERE old_slug = ?").run(slug);
    return { id: postId!, slug };
  })();
}

export function deletePost(id: number) {
  const db = storeDb();
  db.transaction(() => {
    db.prepare("DELETE FROM blog_redirects WHERE post_id = ?").run(id);
    db.prepare("DELETE FROM blog_posts WHERE id = ?").run(id);
  })();
}
