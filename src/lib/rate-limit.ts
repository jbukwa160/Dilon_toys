import "server-only";
import { headers } from "next/headers";

// Small in-memory limiter for public endpoints that call the couriers' APIs.
const hits = new Map<string, { count: number; reset: number }>();

export async function rateLimited(bucket: string, max: number, windowMs = 60_000): Promise<boolean> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
  const key = `${bucket}|${ip}`;
  const now = Date.now();
  const e = hits.get(key);
  if (!e || now > e.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    if (hits.size > 10_000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    return false;
  }
  e.count++;
  return e.count > max;
}
