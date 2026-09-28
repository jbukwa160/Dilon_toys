import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { brandNames } from "@/lib/admin/products";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { categoryOptions } from "@/lib/categories";

export const metadata: Metadata = { title: "Нов продукт" };

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/produkti" className="mb-3 inline-flex items-center gap-1.5 font-bold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Всички продукти
      </Link>
      <PageHeader title="Нов продукт" description="Попълнете полетата със звездичка (*) и натиснете „Създай продукта“. Кодът се създава автоматично." />
      <ProductForm
        categories={categoryOptions()}
        mode="create"
        brands={brandNames()}
        initial={{
          name: "",
          brand: "",
          category: "",
          subcategory: "",
          ean: "",
          price: "",
          oldPrice: "",
          stock: "1",
          hidden: false,
          images: [],
          description: "",
          color: "",
          pieces: "",
          ageMin: "",
          ageMax: "",
          audience: "all",
          warnings: [],
          batch: "",
          passport: "",
        }}
      />
    </>
  );
}
