import { NextResponse, type NextRequest } from "next/server";
import { getProductsByIds } from "@/lib/catalog";

// Fresh price/stock for items kept in the browser (cart, wishlist).
export function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 200);
  const products = getProductsByIds(ids).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    image: p.image,
    price: p.price,
    oldPrice: p.oldPrice,
    stock: p.stock,
  }));
  return NextResponse.json({ products });
}
