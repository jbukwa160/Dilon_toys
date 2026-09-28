import "server-only";
import { getBrands, getCategories, getSeriesList } from "@/lib/catalog";
import { publishedPostLinks } from "@/lib/blog";
import type { LinkOptions } from "@/components/admin/LinkPicker";

export function getLinkOptions(): LinkOptions {
  return {
    categories: getCategories().map((c) => ({ slug: c.slug, name: c.name, subs: c.subs.map((s) => ({ slug: s.slug, name: s.name })) })),
    series: getSeriesList().map((s) => ({ slug: s.slug, name: s.name })),
    brands: getBrands().map((b) => ({ slug: b.slug, name: b.name })),
    posts: publishedPostLinks(),
  };
}
