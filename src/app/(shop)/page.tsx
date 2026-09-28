import Link from "next/link";
import { ArrowRight, BadgePercent, Gift, RotateCcw, Sparkles, Star, Truck } from "lucide-react";
import { getCategories, getHeroProducts, getMeta, getSeriesList, getShelf, getTopBrands, imageForHref, PRICE_BUCKETS } from "@/lib/catalog";
import { getHomeContent, getSettings } from "@/lib/settings";
import { COUNT_TOKEN, type HeroSlide } from "@/lib/settings-types";
import { formatNumber, formatPrice } from "@/lib/format";
import { ProductShelf } from "@/components/product/ProductGrid";
import { ProductImage } from "@/components/product/ProductImage";
import { CategoryIcon } from "@/components/CategoryIcon";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { PromoCards } from "@/components/home/PromoCards";
import { BlogCard } from "@/components/blog/BlogCard";
import { latestPosts } from "@/lib/blog";

export const revalidate = 3600;

function fillCount(slide: HeroSlide, count: string): HeroSlide {
  const f = (t: string) => t.split(COUNT_TOKEN).join(count);
  return { ...slide, eyebrow: f(slide.eyebrow), title: f(slide.title), highlight: f(slide.highlight), text: f(slide.text) };
}

export default function HomePage() {
  const s = getSettings();
  const home = getHomeContent();
  const on = home.sections;
  const { productCount } = getMeta();
  const rounded = formatNumber(productCount >= 1000 ? Math.floor(productCount / 1000) * 1000 : productCount);

  const slides = home.slides.filter((sl) => sl.enabled).map((sl) => fillCount(sl, rounded));
  const promos = home.promos.filter((p) => p.enabled && p.title);
  const autoImage = Object.fromEntries(promos.map((p) => [p.id, p.image ? null : imageForHref(p.href)]));
  const collage = getHeroProducts().map((p) => ({ id: p.id, slug: p.slug, name: p.name, image: p.image }));
  const categories = on.categories ? getCategories() : [];
  const sale = on.sale ? getShelf("sale", 14) : [];
  const popular = on.popular ? getShelf("popular", 14) : [];
  const fresh = on.fresh ? getShelf("new", 14) : [];
  const series = on.heroes ? getSeriesList(16) : [];
  const brands = on.budgetBrands ? getTopBrands(20) : [];
  const posts = on.blog ? latestPosts(3) : [];

  return (
    <>
      {slides.length ? (
        <section className="container-shop pt-5 md:pt-8">
          <HeroCarousel slides={slides} collage={collage} autoplaySeconds={home.autoplaySeconds} />
        </section>
      ) : null}

      {promos.length ? (
        <section className="container-shop mt-6">
          <PromoCards cards={promos} autoImage={autoImage} />
        </section>
      ) : null}

      {on.trust ? (
        <section className="container-shop mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { icon: Truck, title: "Безплатна доставка", text: `за поръчки над ${formatPrice(s.shipping.freeOver)}`, bg: "bg-mint-soft", fg: "text-mint" },
            { icon: Star, title: "Бонус точки", text: `${s.points.perEuro} ${s.points.perEuro === 1 ? "точка" : "точки"} за всеки 1 €`, bg: "bg-grape-soft", fg: "text-grape" },
            { icon: RotateCcw, title: `${s.returnDays} дни за връщане`, text: "лесна замяна и връщане", bg: "bg-sky-soft", fg: "text-sky" },
            { icon: Gift, title: "Бърза доставка", text: s.deliveryDays, bg: "bg-sun-soft", fg: "text-ink" },
          ].map(({ icon: Icon, title, text, bg, fg }) => (
            <div key={title} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${bg} ${fg}`}>
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <div className="font-extrabold leading-tight">{title}</div>
                <div className="text-sm text-muted">{text}</div>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {categories.length ? (
        <section className="container-shop py-10 md:py-14">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">Пазарувай по категория</h2>
            <Link href="/igrachki" className="hidden items-center gap-1 font-extrabold text-brand hover:underline sm:inline-flex">
              Всички играчки <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
            {categories
              .filter((c) => c.slug !== "drugi-igrachki")
              .map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/kategoria/${c.slug}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-3xl p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
                    style={{ background: c.color }}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/80" style={{ color: c.accent }}>
                      <CategoryIcon icon={c.icon} slug={c.slug} className="h-5 w-5" />
                    </span>
                    <span className="mt-3 text-[1.05rem] font-black leading-tight" style={{ color: c.accent }}>
                      {c.name}
                    </span>
                    <span className="text-sm font-semibold text-ink/60">{formatNumber(c.count)} продукта</span>
                    <span className="mx-auto mt-3 block aspect-square w-3/4 overflow-hidden rounded-full bg-white/70 p-4 transition group-hover:scale-105">
                      <ProductImage src={c.image} alt="" />
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ) : (
        <div className="h-6" />
      )}

      {sale.length ? (
        <div className="bg-brand-soft/50">
          <ProductShelf
            title="Горещи промоции"
            subtitle="Намалени играчки, докато са налични"
            href="/promotsii"
            products={sale}
            accent={<BadgePercent className="h-7 w-7 text-brand" />}
          />
        </div>
      ) : null}

      <ProductShelf title="Препоръчани за вас" subtitle="Любими играчки от всяка категория" href="/igrachki" products={popular} />

      {home.bonus.enabled ? (
        <section className="container-shop py-6">
          <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(120deg,#7552f5,#9b6cff)] p-8 text-white md:p-12">
            <Star className="absolute -right-6 -top-6 h-48 w-48 rotate-12 fill-white/10 text-white/0" />
            <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
              <div>
                <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-extrabold">Бонус програма</span>
                <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">{home.bonus.title}</h2>
                {home.bonus.text ? <p className="mt-3 max-w-lg text-lg text-white/85">{home.bonus.text}</p> : null}
                {home.bonus.buttonLabel && home.bonus.href ? (
                  <Link href={home.bonus.href} className="btn mt-6 h-12 bg-white px-7 text-grape hover:bg-sun-soft">
                    {home.bonus.buttonLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  ["1 €", `= ${s.points.perEuro} ${s.points.perEuro === 1 ? "точка" : "точки"}`],
                  ["100", "точки"],
                  [formatPrice(100 * s.points.redeemValue), "отстъпка"],
                ].map(([big, small]) => (
                  <div key={big} className="rounded-2xl bg-white/15 p-4 backdrop-blur">
                    <div className="text-2xl font-black md:text-3xl">{big}</div>
                    <div className="text-sm font-bold text-white/80">{small}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {series.length ? (
        <section className="container-shop py-10">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">Любими герои</h2>
            <Link href="/geroi" className="inline-flex items-center gap-1 font-extrabold text-brand hover:underline">
              Всички <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="scroll-row !grid-cols-none [grid-auto-columns:128px] lg:[grid-auto-columns:calc((100%-7*1rem)/8)]">
            {series.map((sr) => (
              <li key={sr.slug}>
                <Link href={`/geroi/${sr.slug}`} className="group flex flex-col items-center gap-2 text-center">
                  <span className="aspect-square w-full overflow-hidden rounded-full border-4 border-white bg-white p-4 shadow-[var(--shadow-card)] transition group-hover:scale-105 group-hover:border-sun">
                    <ProductImage src={sr.image} alt="" />
                  </span>
                  <span className="text-sm font-extrabold leading-tight group-hover:text-brand">{sr.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ProductShelf title="Нови играчки" subtitle="Последно добавени в магазина" href="/novi" products={fresh} accent={<Sparkles className="h-7 w-7 text-sun" />} />

      {on.budgetBrands ? (
        <section className="container-shop grid gap-6 py-10 lg:grid-cols-[1fr_1.6fr]">
          <div className="rounded-3xl bg-sky-soft p-7">
            <h2 className="text-2xl font-black">Подарък според бюджета</h2>
            <p className="mt-1 text-ink-soft">Бързо намери подходяща играчка</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {PRICE_BUCKETS.map((b) => (
                <Link key={b.key} href={`/igrachki?cena=${b.key}`} className="chip !border-white !px-5 !py-2.5 !text-base">
                  {b.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-white p-7">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-black">Популярни марки</h2>
              <Link href="/marki" className="inline-flex items-center gap-1 font-extrabold text-brand hover:underline">
                Всички марки <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {brands.map((b) => (
                <Link key={b.slug} href={`/marka/${b.slug}`} className="chip !px-4 !py-2 !text-[0.95rem]">
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {posts.length ? (
        <section className="container-shop py-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight md:text-3xl">Съвети и идеи от блога</h2>
              <p className="mt-1 text-ink-soft">Как да изберете подходящата играчка и подарък</p>
            </div>
            <Link href="/blog" className="inline-flex shrink-0 items-center gap-1 font-extrabold text-brand hover:underline">
              Всички статии <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p.id}>
                <BlogCard post={p} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
