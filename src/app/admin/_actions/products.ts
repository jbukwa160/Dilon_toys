"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { catalogDb } from "@/lib/db";
import { refreshAggregates, type ProductEdit } from "@/lib/catalog-write";
import { getCategoryEntries } from "@/lib/settings";
import { categoryOptions } from "@/lib/categories";
import {
  adminProductSkus,
  createProduct,
  deleteCustomProduct,
  getAdminProduct,
  resetToyInfo,
  restoreProduct,
  saveProductEdit,
  saveProductEdits,
  type AdminFilter,
} from "@/lib/admin/products";
import { parseCount, parseMoney, validateProduct, type ProductPayload } from "@/lib/admin/validate";
import { saveUpload } from "@/lib/uploads";
import { searchMatchSql } from "@/lib/search";

export type ActionResult = { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; id?: number };

/** Make the public site show the change. Aggregates = category/brand counts and tiles. */
function publish(aggregates: boolean) {
  if (aggregates) refreshAggregates(catalogDb(), getCategoryEntries());
  revalidatePath("/", "layout");
}

export async function saveProductAction(id: number, payload: ProductPayload): Promise<ActionResult> {
  await requireAdmin();
  const current = getAdminProduct(id);
  if (!current) return { error: "Продуктът не е намерен." };
  const { value, errors } = validateProduct(payload, categoryOptions());
  if (!value) return { error: "Моля, поправете маркираните полета.", fieldErrors: errors };

  // Only send what actually changed, so a later CSV import keeps updating the rest.
  const edit: ProductEdit = {};
  const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  (Object.keys(value) as (keyof typeof value)[]).forEach((k) => {
    const before = (current as unknown as Record<string, unknown>)[k];
    if (!same(before, value[k])) (edit as Record<string, unknown>)[k] = value[k];
  });
  if (!Object.keys(edit).length) return { ok: true };
  saveProductEdit(current.sku, edit);
  const structural = ["name", "brand", "category", "subcategory", "hidden", "stock", "images"].some((k) => k in edit);
  publish(structural);
  return { ok: true };
}

export async function createProductAction(payload: ProductPayload): Promise<ActionResult> {
  await requireAdmin();
  const { value, errors } = validateProduct(payload, categoryOptions());
  if (!value) return { error: "Моля, поправете маркираните полета.", fieldErrors: errors };
  // Age / audience / warnings the admin left empty are estimated from the name and category.
  const { ageMin, ageMax, audience, warnings, batch, passport, ...rest } = value;
  const toy = {
    ...(ageMin != null ? { ageMin, ageMax } : {}),
    ...(audience !== "all" ? { audience } : {}),
    ...(warnings.length ? { warnings } : {}),
    ...(batch ? { batch } : {}),
    ...(passport ? { passport } : {}),
  };
  const { id } = createProduct({ ...rest, ...toy });
  publish(true);
  return { ok: true, id };
}

/** Forget the admin's age / audience / warnings and estimate them again from the name and category. */
export async function resetToyInfoAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  const current = getAdminProduct(id);
  if (!current) return { error: "Продуктът не е намерен." };
  resetToyInfo(current.sku);
  publish(false);
  return { ok: true };
}

export async function quickSaveAction(id: number, input: { price: string; oldPrice: string; stock: string }): Promise<ActionResult> {
  await requireAdmin();
  const current = getAdminProduct(id);
  if (!current) return { error: "Продуктът не е намерен." };
  const price = parseMoney(input.price);
  if (price == null || price <= 0) return { error: "Невалидна цена." };
  let oldPrice: number | null = null;
  if (input.oldPrice.trim()) {
    oldPrice = parseMoney(input.oldPrice);
    if (oldPrice == null) return { error: "Невалидна стара цена." };
    if (oldPrice <= price) return { error: "Старата цена трябва да е по-висока от цената." };
  }
  const stock = parseCount(input.stock);
  if (stock == null || stock < 0) return { error: "Невалидна наличност." };
  const edit: ProductEdit = {};
  if (price !== current.price) edit.price = price;
  if (oldPrice !== current.oldPrice) edit.oldPrice = oldPrice;
  if (stock !== current.stock) edit.stock = stock;
  if (!Object.keys(edit).length) return { ok: true };
  saveProductEdit(current.sku, edit);
  publish("stock" in edit && (stock === 0) !== (current.stock === 0));
  return { ok: true };
}

export async function setHiddenAction(id: number, hidden: boolean): Promise<ActionResult> {
  await requireAdmin();
  const current = getAdminProduct(id);
  if (!current) return { error: "Продуктът не е намерен." };
  if (current.hidden !== hidden) {
    saveProductEdit(current.sku, { hidden });
    publish(true);
  }
  return { ok: true };
}

export async function restoreProductAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  const current = getAdminProduct(id);
  if (!current || !restoreProduct(current.sku)) return { error: "Няма какво да се възстанови." };
  publish(true);
  return { ok: true };
}

export async function deleteProductAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  const current = getAdminProduct(id);
  if (!current) return { error: "Продуктът не е намерен." };
  if (!deleteCustomProduct(current.sku)) return { error: "Само ръчно добавени продукти могат да се изтриват. Скрийте продукта вместо това." };
  publish(true);
  return { ok: true };
}

export async function uploadImageAction(fd: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = fd.get("file");
  if (!(file instanceof File)) return { error: "Не е избран файл." };
  return saveUpload(file);
}

export type PickerProduct = { name: string; slug: string; sku: string; ean: string | null; image: string | null; price: number; stock: number; hidden: boolean; category: string };

/** Product search for pickers: by name, brand, SKU or barcode. Hidden products show up only when searched by code. */
export async function findProductsAction(q: string): Promise<PickerProduct[]> {
  await requireAdmin();
  const term = q.trim().slice(0, 100);
  if (term.length < 2) return [];
  const m = searchMatchSql(term, { admin: true });
  if (!m) return [];
  return (
    catalogDb()
      .prepare(
        `WITH m AS (${m.sql})
         SELECT p.name, p.slug, p.sku, p.ean, p.image, p.price, p.stock, p.hidden, p.category FROM m JOIN products p ON p.id = m.id
         WHERE m.exact > 0 OR p.hidden = 0 ORDER BY m.exact DESC, (p.stock > 0) DESC, m.rank LIMIT 10`,
      )
      .all(...m.params) as (Omit<PickerProduct, "hidden"> & { hidden: number })[]
  ).map((r) => ({ ...r, hidden: !!r.hidden }));
}

export type MoveTarget = { ids: number[] } | { all: { q: string; category: string; filter: string } };

/** Moves products to another category: the ticked ones, or everything the current search found. */
export async function moveProductsAction(target: MoveTarget, category: string, subcategory: string): Promise<{ ok?: boolean; moved?: number; error?: string }> {
  await requireAdmin();
  const cat = categoryOptions().find((c) => c.slug === category);
  if (!cat) return { error: "Изберете категория." };
  const sub = subcategory && cat.subs.some((s) => s.slug === subcategory) ? subcategory : null;
  let skus: string[];
  if ("ids" in target) {
    const ids = (Array.isArray(target.ids) ? target.ids : []).filter((n) => Number.isInteger(n) && n > 0).slice(0, 1000);
    if (!ids.length) return { error: "Не са избрани продукти." };
    skus = (catalogDb().prepare(`SELECT sku FROM products WHERE id IN (${ids.map(() => "?").join(",")})`).all(...ids) as { sku: string }[]).map((r) => r.sku);
  } else {
    skus = adminProductSkus({ q: String(target.all?.q ?? "").slice(0, 100), category: String(target.all?.category ?? ""), filter: String(target.all?.filter ?? "all") as AdminFilter });
    if (skus.length > 5000) return { error: `Намерени са ${skus.length} продукта — наведнъж могат да се преместят до 5000. Стеснете търсенето.` };
  }
  const current = catalogDb().prepare("SELECT category, subcategory FROM products WHERE sku = ?");
  const changes = skus.flatMap((sku) => {
    const r = current.get(sku) as { category: string; subcategory: string | null } | undefined;
    return r && (r.category !== category || (r.subcategory ?? null) !== sub) ? [{ sku, edit: { category, subcategory: sub } as ProductEdit }] : [];
  });
  const moved = changes.length ? saveProductEdits(changes) : 0;
  if (moved) publish(true);
  return { ok: true, moved };
}

/** Sets the age range or "for whom" of the ticked products (or everything the search found). */
export async function setToyInfoAction(
  target: MoveTarget,
  change: { ageMin: number | null; ageMax: number | null } | { audience: "boys" | "girls" | "all" },
): Promise<{ ok?: boolean; changed?: number; error?: string }> {
  await requireAdmin();
  let edit: ProductEdit;
  if ("audience" in change) {
    if (!["boys", "girls", "all"].includes(change.audience)) return { error: "Изберете за кого е." };
    edit = { audience: change.audience };
  } else {
    const ok = (v: unknown) => v === null || (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 240);
    if (!ok(change.ageMin) || !ok(change.ageMax) || change.ageMin == null) return { error: "Изберете възраст." };
    if (change.ageMax != null && change.ageMax <= change.ageMin) return { error: "Горната граница трябва да е по-голяма от долната." };
    edit = { ageMin: change.ageMin, ageMax: change.ageMax };
  }
  let skus: string[];
  if ("ids" in target) {
    const ids = (Array.isArray(target.ids) ? target.ids : []).filter((n) => Number.isInteger(n) && n > 0).slice(0, 1000);
    if (!ids.length) return { error: "Не са избрани продукти." };
    skus = (catalogDb().prepare(`SELECT sku FROM products WHERE id IN (${ids.map(() => "?").join(",")})`).all(...ids) as { sku: string }[]).map((r) => r.sku);
  } else {
    skus = adminProductSkus({ q: String(target.all?.q ?? "").slice(0, 100), category: String(target.all?.category ?? ""), filter: String(target.all?.filter ?? "all") as AdminFilter });
    if (skus.length > 5000) return { error: `Намерени са ${skus.length} продукта — наведнъж могат да се променят до 5000. Стеснете търсенето.` };
  }
  const changed = saveProductEdits(skus.map((sku) => ({ sku, edit })));
  if (changed) publish(false);
  return { ok: true, changed };
}
