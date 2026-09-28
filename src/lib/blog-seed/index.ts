import type { SeedPost } from "./types";
import { POSTS_1 } from "./part-1";
import { POSTS_2 } from "./part-2";

// Newest first: the seasonal Christmas guide leads, then the evergreen guides.
const ORDER = [
  "koledni-podaratsi-za-detsa",
  "kak-da-izberem-igrachka-spored-vazrastta",
  "podaratsi-za-momcheta-idei-po-vazrast",
  "podaratsi-za-momicheta-idei-po-vazrast",
  "lego-za-nachinaeshti-koya-seriya-da-izberem",
  "obrazovatelni-igrachki-stem",
  "pazeli-za-detsa-kolko-chasti-spored-vazrastta",
  "bezopasni-igrachki-na-kakvo-da-obarnem-vnimanie",
  "igrachki-za-bebeta-0-12-meseca",
  "nastolni-igri-za-tsyaloto-semeystvo",
];

const rank = (slug: string) => {
  const i = ORDER.indexOf(slug);
  return i === -1 ? ORDER.length : i;
};

export const SEED_POSTS: SeedPost[] = [...POSTS_1, ...POSTS_2].sort((a, b) => rank(a.slug) - rank(b.slug));
