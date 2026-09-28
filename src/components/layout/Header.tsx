import { Suspense } from "react";
import Link from "next/link";
import { Phone, Star, Truck, RotateCcw } from "lucide-react";
import { getMenu, getSettings } from "@/lib/settings";
import { getCategories, getCategoryTopBrands } from "@/lib/catalog";
import { getGiftSummary } from "@/lib/gifts";
import { formatPrice } from "@/lib/format";
import { Logo } from "./Logo";
import { SearchBox } from "./SearchBox";
import { HeaderActions } from "./HeaderActions";
import { MegaMenu, MobileMenu, type NavCategory } from "./MegaMenu";
import { GiftsMenu } from "./GiftsMenu";
import { NavDropdown } from "./NavDropdown";
import { MenuLabel, menuItemProps } from "./MenuLabel";
import { isExternalHref } from "@/lib/settings-types";

export function Header() {
  const s = getSettings();
  const menu = getMenu();
  const gifts = getGiftSummary();
  const topBrands = getCategoryTopBrands();
  const categories: NavCategory[] = getCategories().map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    count: c.count,
    color: c.color,
    accent: c.accent,
    tagline: c.tagline,
    image: c.image,
    brands: topBrands.get(c.slug) ?? [],
    subs: c.subs.map((s) => ({ slug: s.slug, name: s.name })),
  }));

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_var(--color-line)]">
      <div className="hidden bg-ink text-[0.82rem] font-semibold text-white/90 md:block">
        <div className="container-shop flex h-9 items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-sun" /> Безплатна доставка над {formatPrice(s.shipping.freeOver)}
            </span>
            <Link href="/bonus-programa" className="flex items-center gap-1.5 hover:text-white">
              <Star className="h-4 w-4 fill-sun text-sun" /> 1 € = {s.points.perEuro} {s.points.perEuro === 1 ? "бонус точка" : "бонус точки"}
            </Link>
            <span className="hidden items-center gap-1.5 lg:flex">
              <RotateCcw className="h-4 w-4 text-sun" /> {s.returnDays} дни за връщане
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/dostavka" className="hover:text-white">
              Доставка и плащане
            </Link>
            <Link href="/kontakti" className="hover:text-white">
              Контакти
            </Link>
            <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 text-white">
              <Phone className="h-4 w-4 text-sun" /> {s.phone}
            </a>
          </div>
        </div>
      </div>

      <div className="container-shop flex h-[4.5rem] items-center gap-3 md:gap-6">
        <MobileMenu categories={categories} menu={menu} gifts={gifts.enabled ? gifts : null} />
        <Logo name={s.name} />
        <div className="hidden flex-1 md:block">
          <Suspense fallback={<div className="h-12 rounded-full border-2 border-line bg-white" />}>
            <SearchBox />
          </Suspense>
        </div>
        <div className="ml-auto md:ml-0">
          <HeaderActions />
        </div>
      </div>

      <div className="container-shop pb-3 md:hidden">
        <Suspense fallback={<div className="h-12 rounded-full border-2 border-line bg-white" />}>
          <SearchBox />
        </Suspense>
      </div>

      <nav className="hidden border-t border-line/70 lg:block" aria-label="Основна навигация">
        <div className="container-shop flex min-h-14 flex-wrap items-center gap-x-2 gap-y-1 py-1.5">
          {menu.categories.show ? <MegaMenu categories={categories} label={menu.categories.label} color={menu.categories.color} /> : null}
          <ul className="flex flex-wrap items-center gap-1">
            {menu.items.map((item) => {
              if (item.kind === "gifts") {
                return gifts.enabled ? (
                  <li key={item.id}>
                    <GiftsMenu gifts={gifts} item={item} />
                  </li>
                ) : null;
              }
              if (item.kind === "dropdown") {
                return (
                  <li key={item.id}>
                    <NavDropdown item={item} />
                  </li>
                );
              }
              const p = menuItemProps(item.appearance);
              const external = isExternalHref(item.href);
              return (
                <li key={item.id}>
                  <Link href={item.href} className={p.className} style={p.style} target={external ? "_blank" : undefined} rel={external ? "noopener" : undefined}>
                    <MenuLabel label={item.label} appearance={item.appearance} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </header>
  );
}
