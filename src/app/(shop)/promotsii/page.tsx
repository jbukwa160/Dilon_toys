import type { Metadata } from "next";
import { Listing } from "@/components/listing/Listing";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BadgePercent } from "lucide-react";

export const metadata: Metadata = {
  title: "Промоции",
  description: "Играчки на промоционални цени — намаления на LEGO, кукли, пъзели, колички и още.",
};

export default async function SalePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <div className="container-shop pb-10">
      <Breadcrumbs items={[{ label: "Промоции" }]} />
      <div className="mb-7 flex items-center gap-5 rounded-3xl bg-brand p-6 text-white md:p-8">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/20">
          <BadgePercent className="h-9 w-9" />
        </span>
        <div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">Промоции</h1>
          <p className="mt-1 font-semibold text-white/85">Намалени играчки — докато са налични</p>
        </div>
      </div>
      <Listing scope={{ kind: "sale" }} basePath="/promotsii" searchParams={await searchParams} defaultSort="discount" />
    </div>
  );
}
