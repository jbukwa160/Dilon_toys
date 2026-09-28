import { site } from "@/config/site";
import type { StoreSettings } from "./settings-types";

const money = new Intl.NumberFormat(site.locale, { style: "currency", currency: site.currency });
const integer = new Intl.NumberFormat(site.locale);

export function formatPrice(value: number): string {
  return money.format(value);
}

export function formatNumber(value: number): string {
  return integer.format(value);
}

export function pointsFor(amount: number, perEuro: number): number {
  return Math.floor(amount * perEuro);
}

export function discountPercent(price: number, oldPrice: number | null | undefined): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round((1 - price / oldPrice) * 100);
}

/** Fixed delivery price from the settings (the courier's live price may differ at checkout). */
export function shippingFor(subtotal: number, method: "office" | "address", shipping: StoreSettings["shipping"]): number {
  if (subtotal >= shipping.freeOver) return 0;
  return method === "address" ? shipping.address : shipping.office;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(site.locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
