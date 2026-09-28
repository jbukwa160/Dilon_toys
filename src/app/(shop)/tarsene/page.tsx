import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Listing } from "@/components/listing/Listing";
import { Breadcrumbs, PageTitle } from "@/components/Breadcrumbs";
import { productSlugForCode } from "@/lib/catalog";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = String((await searchParams).q ?? "").trim();
  return { title: q ? `Търсене: ${q}` : "Търсене", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = String(Array.isArray(sp.q) ? sp.q[0] : (sp.q ?? "")).trim().slice(0, 100);
  // A SKU or barcode (typed or scanned) that belongs to exactly one product opens that product.
  const slug = q ? productSlugForCode(q) : null;
  if (slug) redirect(`/produkt/${slug}`);
  return (
    <div className="container-shop pb-10">
      <Breadcrumbs items={[{ label: "Търсене" }]} />
      <PageTitle title={q ? `Резултати за „${q}“` : "Търсене"} subtitle={q ? undefined : "Въведете какво търсите в полето за търсене горе."} />
      {q ? (
        <Listing
          scope={{ kind: "search", q }}
          basePath="/tarsene"
          searchParams={sp}
          defaultSort="relevance"
          emptyText={`Не намерихме играчки за „${q}“. Опитайте с друга дума или по-кратко търсене.`}
        />
      ) : null}
    </div>
  );
}
