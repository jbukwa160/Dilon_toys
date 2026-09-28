import { rateLimited } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/catalog";
import { quoteShipping } from "@/lib/shipping";

// Delivery price for the checkout summary. Prices come from the catalogue, not the browser;
// the order is re-quoted on the server when it is placed.
export async function POST(req: Request) {
  if (await rateLimited("quote", 60)) return NextResponse.json({ error: "too many requests" }, { status: 429 });
  let body: { method?: string; officeId?: string; cityId?: string; payment?: string; items?: { id: number; qty: number }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const items = (Array.isArray(body.items) ? body.items : [])
    .map((i) => ({ id: Number(i.id), qty: Math.floor(Number(i.qty)) }))
    .filter((i) => Number.isInteger(i.id) && i.qty > 0 && i.qty <= 99)
    .slice(0, 100);
  const products = new Map(getProductsByIds(items.map((i) => i.id)).map((p) => [p.id, p]));
  const known = items.filter((i) => products.has(i.id));
  const subtotal = Math.round(known.reduce((s, i) => s + products.get(i.id)!.price * i.qty, 0) * 100) / 100;
  const quote = await quoteShipping({
    method: String(body.method ?? ""),
    officeId: body.officeId ? String(body.officeId).slice(0, 20) : undefined,
    cityId: body.cityId ? String(body.cityId).slice(0, 20) : undefined,
    items: known,
    subtotal,
    cashOnDelivery: body.payment !== "bank",
  });
  return NextResponse.json(quote);
}
