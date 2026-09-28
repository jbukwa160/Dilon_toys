import { NextResponse, type NextRequest } from "next/server";
import { suggest } from "@/lib/catalog";

export function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  const s = suggest(q);
  return NextResponse.json(
    {
      products: s.products.map((p) => ({ id: p.id, slug: p.slug, name: p.name, image: p.image, price: p.price, brand: p.brand, code: p.code })),
      categories: s.categories,
      brands: s.brands,
      total: s.total,
    },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
