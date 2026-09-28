"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { catalogDb } from "@/lib/db";
import { normalizeManufacturer, saveManufacturer, type Manufacturer } from "@/lib/manufacturers";

export async function saveManufacturerAction(brandSlug: string, data: Manufacturer): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  if (!catalogDb().prepare("SELECT 1 FROM brands WHERE slug = ?").get(brandSlug)) return { error: "Марката не е намерена." };
  const m = normalizeManufacturer(data);
  for (const [label, email] of [["Имейл на производителя", m.email], ["Имейл на отговорното лице", m.euEmail]] as const) {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: `${label} не изглежда правилен.` };
  }
  saveManufacturer(brandSlug, m);
  revalidatePath("/", "layout");
  return { ok: true };
}
