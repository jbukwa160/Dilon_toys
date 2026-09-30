import { getSettings } from "@/lib/settings";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Factory, PackageCheck, RotateCcw, ShieldAlert, ShieldCheck, Star, Truck, Users } from "lucide-react";
import { AUDIENCES, WARNINGS, formatAge, needsWeeeNote } from "@/lib/toy-info";
import { getManufacturer, isFilled } from "@/lib/manufacturers";
import { SafetyIcon, WeeeIcon } from "@/components/product/SafetyIcon";
import { site } from "@/config/site";
import { getMoreFromBrand, getProduct, getRelated } from "@/lib/catalog";
import { findCategory } from "@/lib/categories";
import { discountPercent, formatNumber, formatPrice, pointsFor } from "@/lib/format";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";
import { Gallery } from "@/components/product/Gallery";
import { BuyBox } from "@/components/product/CartButtons";
import { ProductShelf } from "@/components/product/ProductGrid";
import { toCartProduct } from "@/components/product/ProductCard";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  const cat = findCategory(p.category);
  const s = getSettings();
  const description = `${p.name}${p.brand ? ` от ${p.brand}` : ""} — ${formatPrice(p.price)}. ${cat ? cat.name + ". " : ""}Бонус точки с всяка покупка и доставка до ${s.deliveryDays}.`;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/produkt/${p.slug}` },
    openGraph: { title: p.name, description, images: p.image ? [p.image] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();
  const s = getSettings();

  const cat = findCategory(p.category);
  const sub = cat?.subs.find((s) => s.slug === p.subcategory);
  const crumbs: Crumb[] = [];
  if (cat) crumbs.push({ href: `/kategoria/${cat.slug}`, label: cat.name });
  if (sub) crumbs.push({ href: `/kategoria/${sub.slug}`, label: sub.name });
  crumbs.push({ label: p.name });

  const off = discountPercent(p.price, p.oldPrice);
  const points = pointsFor(p.price, s.points.perEuro);
  const related = getRelated(p);
  const fromBrand = getMoreFromBrand(p).filter((x) => !related.some((r) => r.id === x.id));

  const specs: [string, React.ReactNode][] = [];
  if (p.brand) specs.push(["Марка", <Link key="b" href={`/marka/${p.brandSlug}`} className="font-bold text-brand hover:underline">{p.brand}</Link>]);
  if (cat) specs.push(["Категория", <Link key="c" href={`/kategoria/${sub?.slug ?? cat.slug}`} className="hover:text-brand">{sub?.name ?? cat.name}</Link>]);
  if (p.pieces) specs.push(["Брой части", formatNumber(p.pieces)]);
  if (p.color) specs.push(["Цвят", p.color]);
  if (p.length && p.width && p.height) specs.push(["Размери на опаковката", `${p.length} × ${p.width} × ${p.height} см`]);
  if (p.weight) specs.push(["Тегло", `${p.weight.toLocaleString("bg-BG")} кг`]);
  const age = formatAge(p.ageMin, p.ageMax);
  if (age) specs.unshift(["Подходяща възраст", age]);
  if (p.audience !== "all") specs.splice(age ? 1 : 0, 0, ["Подходящ за", AUDIENCES[p.audience].replace("За ", "")]);
  specs.push(["Код на продукта", p.sku]);
  if (p.ean) specs.push(["Баркод (EAN)", p.ean]);
  const maker = getManufacturer(p.brandSlug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: p.images,
    sku: p.sku,
    ...(p.ean ? { gtin13: p.ean } : {}),
    ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
    ...(maker?.name ? { manufacturer: { "@type": "Organization", name: maker.name } } : {}),
    ...(p.ageMin != null || p.audience !== "all"
      ? {
          audience: {
            "@type": "PeopleAudience",
            ...(p.ageMin != null ? { suggestedMinAge: Math.round((p.ageMin / 12) * 10) / 10 } : {}),
            ...(p.ageMax != null ? { suggestedMaxAge: Math.round((p.ageMax / 12) * 10) / 10 } : {}),
            ...(p.audience !== "all" ? { suggestedGender: p.audience === "boys" ? "male" : "female" } : {}),
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: site.currency,
      price: p.price.toFixed(2),
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: new URL(`/produkt/${p.slug}`, site.url).toString(),
    },
  };

  return (
    <>
      <div className="container-shop">
        <Breadcrumbs items={crumbs} />
        <div className="grid gap-8 md:grid-cols-2 md:gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <Gallery
            images={p.images}
            alt={p.name}
            badge={off ? <span className="rounded-full bg-brand px-3 py-1.5 text-sm font-black text-white">-{off}%</span> : null}
          />

          <div className="flex flex-col gap-5">
            <div>
              {p.brand ? (
                <Link href={`/marka/${p.brandSlug}`} className="text-sm font-extrabold uppercase tracking-wide text-muted hover:text-brand">
                  {p.brand}
                </Link>
              ) : null}
              <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight md:text-[2.1rem]">{p.name}</h1>
              <p className="mt-2 text-sm font-semibold text-muted">Код: {p.sku}</p>
              {age || p.audience !== "all" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {age ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-soft px-3 py-1 text-sm font-extrabold text-sky">
                      <Users className="h-4 w-4" /> Възраст: {age}
                    </span>
                  ) : null}
                  {p.audience !== "all" ? (
                    <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${p.audience === "boys" ? "bg-sky-soft text-[#0369a1]" : "bg-[#fde2ef] text-[#be185d]"}`}>
                      {AUDIENCES[p.audience]}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-line bg-white p-5 md:p-6">
              <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
                <span className={`text-4xl font-black ${off ? "text-brand" : "text-ink"}`}>{formatPrice(p.price)}</span>
                {p.oldPrice ? <span className="pb-1 text-xl font-bold text-muted line-through">{formatPrice(p.oldPrice)}</span> : null}
                {p.oldPrice ? (
                  <span className="mb-1.5 rounded-full bg-brand-soft px-3 py-1 text-sm font-extrabold text-brand">
                    Спестявате {formatPrice(p.oldPrice - p.price)}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted">Цената е с включен ДДС</p>

              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-grape-soft px-4 py-3">
                <Star className="h-6 w-6 shrink-0 fill-grape text-grape" />
                <p className="text-[0.95rem] font-bold text-ink-soft">
                  С тази покупка печелите <span className="font-black text-grape">{points} бонус точки</span>.{" "}
                  <Link href="/bonus-programa" className="text-grape underline">
                    Научете повече
                  </Link>
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 font-extrabold">
                {p.stock > 0 ? (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-mint" />
                    <span className="text-mint">В наличност</span>
                    {p.stock <= 5 ? <span className="text-sm text-brand">— последни {p.stock} бр.</span> : null}
                  </>
                ) : (
                  <>
                    <span className="h-2.5 w-2.5 rounded-full bg-muted" />
                    <span className="text-muted">Изчерпан</span>
                  </>
                )}
              </div>

              <div className="mt-5">
                <BuyBox product={toCartProduct(p)} />
              </div>
            </div>

            {p.warnings.length ? (
              <section aria-labelledby="safety" className="rounded-3xl border-2 border-sun bg-sun-soft/60 p-5">
                <h2 id="safety" className="flex items-center gap-2 font-black">
                  <ShieldAlert className="h-5 w-5 text-[#9a5b00]" /> Предупреждения за безопасност
                </h2>
                <ul className="mt-3 space-y-3">
                  {p.warnings.map((w) => (
                    <li key={w} className="flex items-start gap-3">
                      <SafetyIcon warning={w} className="h-10 w-10 shrink-0" />
                      <p className="text-[0.93rem] leading-snug text-ink">
                        <strong className="font-extrabold">{WARNINGS[w].label}.</strong>{" "}
                        {WARNINGS[w].text.startsWith(WARNINGS[w].label) ? WARNINGS[w].text.slice(WARNINGS[w].label.length).replace(/^[.\s]+/, "") : WARNINGS[w].text}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <ul className="grid gap-2 sm:grid-cols-2">
              {[
                { icon: Truck, text: `Доставка до ${s.deliveryDays}` },
                { icon: PackageCheck, text: `Безплатна доставка над ${formatPrice(s.shipping.freeOver)}` },
                { icon: RotateCcw, text: `${s.returnDays} дни право на връщане` },
                { icon: ShieldCheck, text: `Бонус точки с всяка покупка` },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm font-bold text-ink-soft ring-1 ring-line">
                  <Icon className="h-5 w-5 shrink-0 text-sky" /> {text}
                </li>
              ))}
            </ul>

            {p.series.length ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-muted">Герои:</span>
                {p.series.map((s) => (
                  <Link key={s.slug} href={`/geroi/${s.slug}`} className="chip !bg-sun-soft !border-sun-soft">
                    {s.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {p.description ? (
          <section className="mt-12 rounded-3xl border border-line bg-white p-6 md:p-8">
            <h2 className="text-xl font-black">Описание</h2>
            <div className="mt-3 max-w-3xl whitespace-pre-line leading-relaxed text-ink-soft">{p.description}</div>
          </section>
        ) : null}

        <section className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="rounded-3xl border border-line bg-white p-6 md:p-8">
            <h2 className="text-xl font-black">Характеристики</h2>
            <dl className="mt-4 divide-y divide-line">
              {specs.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 py-3 text-[0.95rem]">
                  <dt className="font-semibold text-muted">{k}</dt>
                  <dd className="font-bold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="space-y-8">
          <div className="rounded-3xl border border-line bg-white p-6 md:p-8">
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Factory className="h-5 w-5 text-sky" /> Производител и безопасност
            </h2>
            <dl className="mt-4 divide-y divide-line text-[0.95rem]">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 py-3">
                <dt className="font-semibold text-muted">Производител</dt>
                <dd className="font-bold text-ink">
                  {maker?.name || p.brand || "—"}
                  {maker?.address ? <span className="block font-semibold text-ink-soft">{maker.address}</span> : null}
                  {maker?.email ? (
                    <a href={`mailto:${maker.email}`} className="block font-semibold text-sky hover:underline">
                      {maker.email}
                    </a>
                  ) : null}
                  {maker?.website ? (
                    <a href={maker.website} target="_blank" rel="noopener nofollow" className="block break-all font-semibold text-sky hover:underline">
                      {maker.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : null}
                </dd>
              </div>
              {maker?.euName ? (
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 py-3">
                  <dt className="font-semibold text-muted">Отговорно лице в ЕС</dt>
                  <dd className="font-bold text-ink">
                    {maker.euName}
                    {maker.euAddress ? <span className="block font-semibold text-ink-soft">{maker.euAddress}</span> : null}
                    {maker.euEmail ? (
                      <a href={`mailto:${maker.euEmail}`} className="block font-semibold text-sky hover:underline">
                        {maker.euEmail}
                      </a>
                    ) : null}
                  </dd>
                </div>
              ) : null}
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 py-3">
                <dt className="font-semibold text-muted">Идентификация</dt>
                <dd className="font-bold text-ink">
                  Модел / код: {p.sku}
                  {p.ean ? <span className="block">Баркод (EAN): {p.ean}</span> : null}
                  {p.batch ? <span className="block">Партида: {p.batch}</span> : null}
                </dd>
              </div>
              {p.passport ? (
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 py-3">
                  <dt className="font-semibold text-muted">Дигитален продуктов паспорт</dt>
                  <dd>
                    <a href={p.passport} target="_blank" rel="noopener nofollow" className="font-bold text-sky hover:underline">
                      Отвори паспорта
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
            {!isFilled(maker) ? (
              <p className="mt-3 text-sm text-muted">
                Въпроси за безопасността на продукта? Пишете ни на{" "}
                <a href={`mailto:${s.email}`} className="font-bold text-sky hover:underline">
                  {s.email}
                </a>
                .
              </p>
            ) : null}
            {needsWeeeNote(p.warnings) ? (
              <p className="mt-4 flex items-start gap-3 rounded-2xl bg-canvas p-3 text-sm text-ink-soft">
                <WeeeIcon className="h-9 w-9 shrink-0" />
                Не изхвърляйте играчката и батериите заедно с битовите отпадъци — предайте ги в пункт за разделно събиране на електрическо оборудване и батерии.
              </p>
            ) : null}
          </div>
          <div className="rounded-3xl bg-sky-soft p-6 md:p-8">
            <h2 className="text-xl font-black">Доставка и връщане</h2>
            <ul className="mt-4 space-y-3 text-[0.95rem] text-ink-soft">
              <li>
                <strong className="text-ink">До офис на Еконт или Спиди:</strong> {formatPrice(s.shipping.office)}
              </li>
              <li>
                <strong className="text-ink">До адрес:</strong> {formatPrice(s.shipping.address)}
              </li>
              <li>
                <strong className="text-ink">Безплатна доставка</strong> за поръчки над {formatPrice(s.shipping.freeOver)}.
              </li>
              <li>Плащане с наложен платеж или банков превод.</li>
              <li>
                Можете да върнете продукта в рамките на {s.returnDays} дни.{" "}
                <Link href="/dostavka" className="font-bold text-sky underline">
                  Условия
                </Link>
              </li>
            </ul>
          </div>
          </div>
        </section>
      </div>

      <ProductShelf title="Подобни играчки" products={related} href={`/kategoria/${sub?.slug ?? p.category}`} />
      {p.brand ? <ProductShelf title={`Още от ${p.brand}`} products={fromBrand} href={`/marka/${p.brandSlug}`} /> : null}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
