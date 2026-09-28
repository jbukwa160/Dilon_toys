"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { applyBulk, applyPriceImport, previewBulk, previewPriceFile, type BulkInput, type PricePreview } from "@/lib/admin/prices";

const MAX_FILE = 15 * 1024 * 1024;

export async function previewPriceFileAction(fd: FormData): Promise<PricePreview | { error: string }> {
  await requireAdmin();
  const file = fd.get("file");
  if (!(file instanceof File) || !file.size) return { error: "Изберете файл." };
  if (file.size > MAX_FILE) return { error: "Файлът е твърде голям (максимум 15 MB)." };
  return previewPriceFile(Buffer.from(await file.arrayBuffer()), file.name);
}

export async function applyPriceFileAction(id: string): Promise<{ ok?: boolean; changed?: number; error?: string }> {
  await requireAdmin();
  if (!/^[a-f0-9]{24}$/.test(id)) return { error: "Невалидна заявка." };
  const changed = applyPriceImport(id);
  if (changed == null) return { error: "Прегледът е изтекъл. Качете файла отново." };
  revalidatePath("/", "layout");
  return { ok: true, changed };
}

function cleanBulk(input: BulkInput): BulkInput | null {
  const scope = ["all", "category", "brand"].includes(input.scope) ? input.scope : null;
  const action = ["increase", "decrease", "sale", "endSale"].includes(input.action) ? input.action : null;
  const percent = Number(input.percent);
  if (!scope || !action) return null;
  if (action !== "endSale" && (!Number.isFinite(percent) || percent <= 0 || percent > 90)) return null;
  if (scope !== "all" && !String(input.value ?? "").trim()) return null;
  return { scope, action, percent: action === "endSale" ? 0 : percent, round99: !!input.round99, value: String(input.value ?? "").trim().slice(0, 100) };
}

export async function previewBulkAction(input: BulkInput) {
  await requireAdmin();
  const clean = cleanBulk(input);
  if (!clean) return { error: "Проверете избора: обхват, действие и процент (между 1 и 90)." };
  return previewBulk(clean);
}

export async function applyBulkAction(input: BulkInput): Promise<{ ok?: boolean; changed?: number; error?: string }> {
  await requireAdmin();
  const clean = cleanBulk(input);
  if (!clean) return { error: "Проверете избора." };
  const changed = applyBulk(clean);
  revalidatePath("/", "layout");
  return { ok: true, changed };
}
