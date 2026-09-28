import type { Metadata } from "next";
import { Listing } from "@/components/listing/Listing";
import { Breadcrumbs, PageTitle } from "@/components/Breadcrumbs";

export const metadata: Metadata = { title: "Нови играчки", description: "Последно добавените играчки в магазина." };

export default async function NewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <div className="container-shop pb-10">
      <Breadcrumbs items={[{ label: "Нови" }]} />
      <PageTitle title="Нови играчки" subtitle="Последно добавени в магазина" />
      <Listing scope={{ kind: "new" }} basePath="/novi" searchParams={await searchParams} defaultSort="new" />
    </div>
  );
}
