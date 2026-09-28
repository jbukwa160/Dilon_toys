import "server-only";
import { catalogDb } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { DELIVERY_METHODS, type City, type Courier, type DeliveryKey, type Office, type OrderDelivery, type ShippingQuote } from "@/lib/checkout";
import { normalizeSearch } from "./cache";
import { speedyCities, speedyCity, speedyOffices, speedyQuote } from "./speedy";
import { econtCities, econtOffices, econtQuote } from "./econt";

export function officesFor(courier: Courier): Promise<Office[]> {
  return courier === "speedy" ? speedyOffices() : econtOffices();
}

/** Offices whose city, name or address contain every word typed. Offices before lockers. */
export async function searchOffices(courier: Courier, query: string, limit = 40): Promise<Office[]> {
  const words = normalizeSearch(query).split(" ").filter(Boolean);
  if (!words.length) return [];
  const all = await officesFor(courier);
  const scored: { o: Office; score: number }[] = [];
  for (const o of all) {
    const city = normalizeSearch(o.city);
    const hay = `${city} ${normalizeSearch(o.name)} ${normalizeSearch(o.address)} ${o.postCode}`;
    if (!words.every((w) => hay.includes(w))) continue;
    // Exact city match ranks first, then offices before lockers.
    const score = (city === words.join(" ") ? 0 : city.startsWith(words[0]) ? 1 : 2) * 2 + (o.locker ? 1 : 0);
    scored.push({ o, score });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.o.name.localeCompare(b.o.name, "bg"))
    .slice(0, limit)
    .map((s) => s.o);
}

export async function searchCities(courier: Courier, query: string): Promise<City[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (courier === "speedy") return speedyCities(q);
  const words = normalizeSearch(q);
  const [all, offices] = await Promise.all([econtCities(), econtOffices().catch(() => [] as Office[])]);
  // Bigger towns (more Econt offices) first, so "Плов" finds Пловдив before Пловка.
  const officeCount = new Map<string, number>();
  for (const o of offices) officeCount.set(o.city, (officeCount.get(o.city) ?? 0) + 1);
  return all
    .filter((c) => normalizeSearch(c.name).startsWith(words) || c.postCode === q)
    .sort((a, b) => (officeCount.get(b.name) ?? 0) - (officeCount.get(a.name) ?? 0) || a.name.length - b.name.length)
    .slice(0, 25);
}

async function findCity(courier: Courier, id: string): Promise<City | null> {
  if (courier === "speedy") return speedyCity(id);
  return (await econtCities()).find((c) => c.id === id) ?? null;
}

export type DeliveryInput = { method: string; officeId?: string; cityId?: string; address?: string };

/** Check the customer's delivery choice against the courier's data. Returns an error message or the delivery to store. */
export async function resolveDelivery(input: DeliveryInput): Promise<{ delivery: OrderDelivery; office?: Office; city?: City } | { error: string; field: string }> {
  const m = DELIVERY_METHODS[input.method as DeliveryKey];
  if (!m) return { error: "Изберете начин на доставка.", field: "delivery" };
  try {
    if (m.kind === "office") {
      const office = input.officeId ? (await officesFor(m.courier)).find((o) => o.id === input.officeId) : undefined;
      if (!office) return { error: "Изберете офис от списъка.", field: "office" };
      return {
        office,
        delivery: {
          method: input.method,
          label: m.label,
          courier: m.courier,
          officeId: office.id,
          officeName: office.name,
          city: office.city,
          postCode: office.postCode,
          address: `${office.locker ? "Автомат" : "Офис"} „${office.name}“, ${office.address}`,
        },
      };
    }
    const city = input.cityId ? await findCity(m.courier, input.cityId) : null;
    if (!city) return { error: "Изберете населено място от списъка.", field: "city" };
    const address = (input.address ?? "").trim().slice(0, 300);
    if (address.length < 4) return { error: "Въведете улица и номер.", field: "address" };
    return {
      city,
      delivery: { method: input.method, label: m.label, courier: m.courier, cityId: city.id, city: city.name, postCode: city.postCode, address },
    };
  } catch (e) {
    console.error("[shipping] resolve failed:", (e as Error).message);
    return { error: "Куриерската услуга не отговаря в момента. Моля, опитайте отново след малко.", field: "delivery" };
  }
}

function parcelWeight(items: { id: number; qty: number }[]): number {
  if (!items.length) return 1;
  const ids = items.map((i) => i.id);
  const rows = catalogDb()
    .prepare(`SELECT id, weight FROM products WHERE id IN (${ids.map(() => "?").join(",")})`)
    .all(...ids) as { id: number; weight: number | null }[];
  const w = new Map(rows.map((r) => [r.id, r.weight]));
  // Unknown weights count as 0.5 kg; add 10% for packaging.
  const total = items.reduce((sum, i) => sum + (w.get(i.id) || 0.5) * i.qty, 0);
  return Math.min(50, Math.max(0.2, total * 1.1));
}

const quoteCache = new Map<string, { at: number; value: number | null }>();

/** Delivery price for the customer: free over the threshold, else the courier's price or the fixed price from settings. */
export async function quoteShipping(input: {
  method: string;
  officeId?: string;
  cityId?: string;
  items: { id: number; qty: number }[];
  subtotal: number;
  cashOnDelivery: boolean;
}): Promise<ShippingQuote> {
  const s = getSettings();
  const m = DELIVERY_METHODS[input.method as DeliveryKey];
  const fixed = m?.kind === "address" ? s.shipping.address : s.shipping.office;
  if (input.subtotal >= s.shipping.freeOver) return { price: 0, free: true, source: "fixed" };
  if (!m || s.shipping.mode !== "courier" || (m.kind === "office" ? !input.officeId : !input.cityId)) {
    return { price: fixed, free: false, source: "fixed" };
  }

  const weight = parcelWeight(input.items);
  const cod = input.cashOnDelivery ? input.subtotal + fixed : 0;
  const key = [input.method, input.officeId ?? input.cityId, weight.toFixed(1), Math.round(cod / 10)].join("|");
  let price: number | null;
  const hit = quoteCache.get(key);
  if (hit && Date.now() - hit.at < 30 * 60_000) price = hit.value;
  else {
    if (m.courier === "speedy") {
      price = await speedyQuote({ officeId: input.officeId, siteId: input.cityId, weight, codAmount: cod });
    } else {
      const city = input.cityId ? await findCity("econt", input.cityId).catch(() => null) : null;
      price = await econtQuote({ officeCode: input.officeId, city: city ?? undefined, weight, codAmount: cod });
    }
    quoteCache.set(key, { at: Date.now(), value: price });
  }
  if (price == null || !(price > 0)) return { price: fixed, free: false, source: "fixed" };
  return { price: Math.ceil(price * 100) / 100, free: false, source: "courier" };
}
