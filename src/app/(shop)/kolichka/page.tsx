import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Количка", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-shop pb-10">
      <Breadcrumbs items={[{ label: "Количка" }]} />
      <h1 className="mb-6 text-3xl font-black tracking-tight md:text-4xl">Количка</h1>
      <CartView />
    </div>
  );
}
