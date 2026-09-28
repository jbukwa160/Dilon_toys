import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { WishlistView } from "@/components/cart/WishlistView";

export const metadata: Metadata = { title: "Любими", robots: { index: false } };

export default function WishlistPage() {
  return (
    <div className="container-shop pb-10">
      <Breadcrumbs items={[{ label: "Любими" }]} />
      <h1 className="mb-6 text-3xl font-black tracking-tight md:text-4xl">Любими играчки</h1>
      <WishlistView />
    </div>
  );
}
