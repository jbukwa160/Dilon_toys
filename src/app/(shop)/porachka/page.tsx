import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CheckoutForm } from "@/components/cart/CheckoutForm";

export const metadata: Metadata = { title: "Поръчка", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="container-shop pb-10">
      <Breadcrumbs items={[{ href: "/kolichka", label: "Количка" }, { label: "Поръчка" }]} />
      <h1 className="mb-6 text-3xl font-black tracking-tight md:text-4xl">Завършване на поръчката</h1>
      <CheckoutForm />
    </div>
  );
}
