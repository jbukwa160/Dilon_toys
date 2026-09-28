// Technical constants. Store name, contacts, shipping prices and points are edited in the
// admin panel (Настройки) — defaults live in src/lib/settings-types.ts.
export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  currency: "EUR",
  locale: "bg-BG",
};
