import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { getAllProductSlugs, getBrands, getCategories, getSeriesList } from "@/lib/catalog";
import { sitemapPosts } from "@/lib/blog";

export const revalidate = 86400;

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (path: string) => new URL(path, site.url).toString();
  const pages = ["/", "/igrachki", "/promotsii", "/novi", "/marki", "/geroi", "/dostavka", "/bonus-programa", "/kontakti", "/blog"].map((p) => ({ url: u(p) }));
  const posts = sitemapPosts().map((p) => ({ url: u(`/blog/${p.slug}`), lastModified: p.updatedAt }));
  const cats = getCategories().flatMap((c) => [{ url: u(`/kategoria/${c.slug}`) }, ...c.subs.map((s) => ({ url: u(`/kategoria/${s.slug}`) }))]);
  const brands = getBrands().map((b) => ({ url: u(`/marka/${b.slug}`) }));
  const series = getSeriesList().map((s) => ({ url: u(`/geroi/${s.slug}`) }));
  // Well under the 50,000 URL limit for a single sitemap.
  const products = getAllProductSlugs().map((p) => ({ url: u(`/produkt/${p.slug}`) }));
  return [...pages, ...posts, ...cats, ...brands, ...series, ...products];
}
