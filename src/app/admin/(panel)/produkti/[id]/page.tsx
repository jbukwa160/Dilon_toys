import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { brandNames, getAdminProduct } from "@/lib/admin/products";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { categoryOptions } from "@/lib/categories";

export const metadata: Metadata = { title: "Редакция на продукт" };

const money = (n: number | null) => (n == null ? "" : n.toFixed(2).replace(".", ","));

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdmin();
  const id = parseInt((await params).id, 10);
  const p = Number.isInteger(id) ? getAdminProduct(id) : null;
  if (!p) notFound();
  const { created } = await searchParams;

  return (
    <>
      <Link href="/admin/produkti" className="mb-3 inline-flex items-center gap-1.5 font-bold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Всички продукти
      </Link>
      <PageHeader title={p.name} description="Направете промените и натиснете „Запази промените“ най-долу." />
      {created ? (
        <p className="mb-5 flex items-center gap-2 rounded-2xl bg-mint-soft p-4 font-bold text-mint">
          <CircleCheck className="h-5 w-5" /> Продуктът е създаден и вече се вижда в сайта.
        </p>
      ) : null}
      <ProductForm
        categories={categoryOptions()}
        mode="edit"
        brands={brandNames()}
        initial={{
          id: p.id,
          sku: p.sku,
          slug: p.slug,
          canRestore: p.canRestore,
          custom: p.custom,
          demoPrice: p.demoPrice,
          name: p.name,
          brand: p.brand ?? "",
          category: p.category,
          subcategory: p.subcategory ?? "",
          ean: p.ean ?? "",
          price: money(p.price),
          oldPrice: money(p.oldPrice),
          stock: String(p.stock),
          hidden: p.hidden,
          images: p.images,
          description: p.description ?? "",
          color: p.color ?? "",
          pieces: p.pieces == null ? "" : String(p.pieces),
          ageMin: p.ageMin,
          ageMax: p.ageMax,
          audience: p.audience,
          warnings: p.warnings,
          batch: p.batch ?? "",
          passport: p.passport ?? "",
          toySource: p.toySource,
        }}
      />
    </>
  );
}
