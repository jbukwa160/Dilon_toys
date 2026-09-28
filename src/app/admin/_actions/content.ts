"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { writeSetting } from "@/lib/settings";
import { normalizeHome, normalizeMenu, normalizeSettings } from "@/lib/settings-normalize";
import type { HomeContent, MenuConfig, StoreSettings } from "@/lib/settings-types";
import { parseColor, safeHref } from "@/lib/settings-types";

type Result = { ok?: boolean; error?: string };

/** Links must be site paths (/…) or full http(s) addresses — anything else is rejected, not silently dropped. */
function badLinks(hrefs: string[]): string | null {
  const bad = hrefs.find((h) => h && safeHref(h) === null);
  return bad ? `Невалиден линк: „${bad}“. Използвайте избора на връзка или адрес, започващ с https://` : null;
}

export async function saveHomeAction(input: HomeContent): Promise<Result> {
  await requireAdmin();
  const hrefs = [
    input.announcement?.href,
    input.bonus?.href,
    ...(input.slides ?? []).flatMap((s) => [s.href, s.primary?.href, s.secondary?.href]),
    ...(input.promos ?? []).map((p) => p.href),
  ].filter((h): h is string => typeof h === "string");
  const err = badLinks(hrefs);
  if (err) return { error: err };
  writeSetting("home", normalizeHome(input));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveMenuAction(input: MenuConfig): Promise<Result> {
  await requireAdmin();
  const items = Array.isArray(input?.items) ? input.items : [];
  const hrefs = items.flatMap((i) => [i.href, ...(i.columns ?? []).flatMap((c) => [c.href, ...(c.links ?? []).map((l) => l.href)])]).filter((h): h is string => typeof h === "string");
  const err = badLinks(hrefs);
  if (err) return { error: err };
  const colors = [input?.categories?.color, ...items.flatMap((i) => [i.appearance?.color, i.appearance?.color2])];
  if (colors.some((c) => typeof c === "string" && !parseColor(c))) return { error: "Има невалиден цвят. Използвайте формат #f0503a или 240, 80, 58." };
  const noLabel = items.find((i) => !String(i.label ?? "").trim());
  if (noLabel) return { error: "Всеки елемент в менюто трябва да има надпис." };
  const noHref = items.find((i) => i.kind === "link" && !String(i.href ?? "").trim());
  if (noHref) return { error: `„${noHref.label}“ трябва да води някъде — изберете връзка.` };
  const badSub = items.flatMap((i) => i.columns ?? []).flatMap((c) => c.links ?? []).find((l) => String(l.label ?? "").trim() && !String(l.href ?? "").trim());
  if (badSub) return { error: `Връзката „${badSub.label}“ в падащото меню няма адрес.` };
  writeSetting("menu", normalizeMenu(input));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveSettingsAction(input: StoreSettings): Promise<Result> {
  await requireAdmin();
  if (!String(input?.name ?? "").trim()) return { error: "Въведете име на магазина." };
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(input.email).trim())) return { error: "Невалиден имейл." };
  writeSetting("store", normalizeSettings(input));
  revalidatePath("/", "layout");
  return { ok: true };
}
