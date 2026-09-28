"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { storeDb } from "@/lib/db";
import { ORDER_STATUSES } from "@/lib/admin/orders";

export async function updateOrderAction(id: string, status: string, note: string): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  if (!(status in ORDER_STATUSES)) return { error: "Невалиден статус." };
  const r = storeDb()
    .prepare("UPDATE orders SET status = ?, admin_note = ? WHERE id = ?")
    .run(status, note.trim().slice(0, 2000) || null, id);
  if (!r.changes) return { error: "Поръчката не е намерена." };
  revalidatePath("/admin", "layout");
  return { ok: true };
}
