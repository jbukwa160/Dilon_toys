"use server";

import { randomBytes } from "node:crypto";
import { getSettings } from "@/lib/settings";
import { getProductsByIds } from "@/lib/catalog";
import { storeDb } from "@/lib/db";
import { pointsFor } from "@/lib/format";
import { PAYMENT_METHODS, type OrderLine } from "@/lib/checkout";
import { quoteShipping, resolveDelivery } from "@/lib/shipping";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function subscribeNewsletter(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) return { error: "Моля, въведете валиден имейл." };
  storeDb().prepare("INSERT OR IGNORE INTO newsletter (email, created_at) VALUES (?, ?)").run(email, new Date().toISOString());
  return { ok: true };
}

export type CheckoutState = {
  ok?: boolean;
  orderId?: string;
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  changed?: boolean;
  /** Echoed back so the form keeps what the shopper typed (React resets forms after an action). */
  values?: Record<string, string>;
};

function text(fd: FormData, key: string, max = 200): string {
  return String(fd.get(key) ?? "").trim().slice(0, max);
}

export async function placeOrder(_prev: CheckoutState | null, fd: FormData): Promise<CheckoutState> {
  const f = {
    firstName: text(fd, "firstName", 80),
    lastName: text(fd, "lastName", 80),
    phone: text(fd, "phone", 30),
    email: text(fd, "email", 200).toLowerCase(),
    delivery: text(fd, "delivery", 30),
    officeId: text(fd, "officeId", 20),
    cityId: text(fd, "cityId", 20),
    address: text(fd, "address", 300),
    payment: text(fd, "payment", 20),
    note: text(fd, "note", 1000),
    terms: fd.get("terms") === "on",
  };

  const values = { firstName: f.firstName, lastName: f.lastName, phone: f.phone, email: f.email, address: f.address, note: f.note, terms: f.terms ? "on" : "" };
  const fail = (s: CheckoutState): CheckoutState => ({ ...s, values });

  const errors: Record<string, string> = {};
  if (!f.firstName) errors.firstName = "Въведете име.";
  if (!f.lastName) errors.lastName = "Въведете фамилия.";
  if (!/^[+\d][\d\s()-]{6,20}$/.test(f.phone)) errors.phone = "Въведете валиден телефон.";
  if (!EMAIL_RE.test(f.email)) errors.email = "Въведете валиден имейл.";
  if (!(f.payment in PAYMENT_METHODS)) errors.payment = "Изберете начин на плащане.";
  if (!f.terms) errors.terms = "Трябва да приемете общите условия.";

  let requested: { id: number; qty: number }[] = [];
  try {
    const raw = JSON.parse(String(fd.get("items") ?? "[]")) as unknown;
    if (Array.isArray(raw)) {
      requested = raw
        .map((r) => ({ id: Number((r as { id: unknown }).id), qty: Math.floor(Number((r as { qty: unknown }).qty)) }))
        .filter((r) => Number.isInteger(r.id) && r.qty > 0 && r.qty <= 99);
    }
  } catch {
    requested = [];
  }
  if (!requested.length) return fail({ error: "Количката е празна." });

  // Office / city must exist in the courier's data.
  const resolved = await resolveDelivery({ method: f.delivery, officeId: f.officeId, cityId: f.cityId, address: f.address });
  if ("error" in resolved) errors[resolved.field] = resolved.error;
  if (Object.keys(errors).length) return fail({ fieldErrors: errors, error: "Моля, проверете маркираните полета." });
  if ("error" in resolved) return fail({ error: resolved.error });

  // Prices and availability always come from the catalogue, never from the browser.
  const settings = getSettings();
  const products = new Map(getProductsByIds(requested.map((r) => r.id)).map((p) => [p.id, p]));
  const lines: OrderLine[] = [];
  for (const r of requested) {
    const p = products.get(r.id);
    if (!p) return fail({ error: "Някой от продуктите вече не е наличен. Моля, прегледайте количката.", changed: true });
    if (!settings.allowOutOfStockOrders && p.stock < r.qty) {
      return fail({
        error: p.stock > 0 ? `„${p.name}“ е наличен само в ${p.stock} бр.` : `„${p.name}“ е изчерпан.`,
        changed: true,
      });
    }
    lines.push({ id: p.id, slug: p.slug, name: p.name, price: p.price, qty: r.qty, total: Math.round(p.price * r.qty * 100) / 100 });
  }

  const subtotal = Math.round(lines.reduce((s, l) => s + l.total, 0) * 100) / 100;
  const quote = await quoteShipping({
    method: f.delivery,
    officeId: resolved.delivery.officeId,
    cityId: resolved.delivery.cityId,
    items: requested,
    subtotal,
    cashOnDelivery: f.payment === "cod",
  });
  const shipping = quote.price;
  const total = Math.round((subtotal + shipping) * 100) / 100;
  const points = pointsFor(subtotal, settings.points.perEuro);

  const db = storeDb();
  const id = randomBytes(9).toString("base64url");
  const insert = db.transaction(() => {
    const last = db.prepare("SELECT MAX(number) AS n FROM orders").get() as { n: number | null };
    const number = (last.n ?? 100000) + 1;
    db.prepare(
      `INSERT INTO orders (id, number, created_at, status, customer, delivery, payment, items, subtotal, shipping, total, points, note)
       VALUES (?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      number,
      new Date().toISOString(),
      JSON.stringify({ firstName: f.firstName, lastName: f.lastName, phone: f.phone, email: f.email }),
      JSON.stringify(resolved.delivery),
      f.payment,
      JSON.stringify(lines),
      subtotal,
      shipping,
      total,
      points,
      f.note || null,
    );
  });
  insert();

  return { ok: true, orderId: id };
}
