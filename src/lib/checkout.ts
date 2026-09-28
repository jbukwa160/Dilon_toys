// Delivery / payment options shared by the checkout (client) and order handling (server).

export type Courier = "econt" | "speedy";
export type DeliveryKind = "office" | "address";

export const DELIVERY_METHODS = {
  "econt-office": { courier: "econt" as Courier, kind: "office" as DeliveryKind, label: "До офис или Еконтомат на Еконт", short: "Офис на Еконт" },
  "speedy-office": { courier: "speedy" as Courier, kind: "office" as DeliveryKind, label: "До офис или автомат на Спиди", short: "Офис на Спиди" },
  "econt-address": { courier: "econt" as Courier, kind: "address" as DeliveryKind, label: "До адрес с Еконт", short: "Адрес (Еконт)" },
  "speedy-address": { courier: "speedy" as Courier, kind: "address" as DeliveryKind, label: "До адрес със Спиди", short: "Адрес (Спиди)" },
};
export type DeliveryKey = keyof typeof DELIVERY_METHODS;
export const DELIVERY_KEYS = Object.keys(DELIVERY_METHODS) as DeliveryKey[];

export const COURIER_NAMES: Record<Courier, string> = { econt: "Еконт", speedy: "Спиди" };

export const PAYMENT_METHODS = {
  cod: { label: "Наложен платеж", hint: "Плащате в брой или с карта на куриера при получаване." },
  bank: { label: "Банков превод", hint: "Ще получите данни за превод по имейл след потвърждение." },
};
export type PaymentKey = keyof typeof PAYMENT_METHODS;

export type OrderLine = { id: number; slug: string; name: string; price: number; qty: number; total: number };

/** A courier office or parcel locker. */
export type Office = {
  id: string;
  courier: Courier;
  name: string;
  city: string;
  postCode: string;
  address: string;
  locker: boolean;
};

/** A city / village the courier delivers to (for address delivery). */
export type City = {
  id: string;
  courier: Courier;
  name: string;
  region: string;
  postCode: string;
};

export type ShippingQuote = {
  /** What the customer pays for delivery. */
  price: number;
  free: boolean;
  /** "courier" = live price from the courier, "fixed" = price from the store settings. */
  source: "courier" | "fixed";
};

/** What gets stored with an order. */
export type OrderDelivery = {
  method: DeliveryKey | string;
  label: string;
  courier?: Courier;
  city: string;
  address: string;
  postCode?: string;
  officeId?: string;
  officeName?: string;
  cityId?: string;
};
