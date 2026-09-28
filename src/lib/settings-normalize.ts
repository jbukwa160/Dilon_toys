// Fill in defaults and sanitise admin-provided settings. Used when reading and before saving.
import {
  DEFAULT_GIFT_TEXT,
  type GiftIdeas,
  type GiftSide,
  type GiftSideKey,
  DEFAULT_CHAT,
  type ChatSettings,
  DEFAULT_HOME,
  DEFAULT_MENU,
  DEFAULT_SETTINGS,
  THEMES,
  safeHref,
  type HeroSlide,
  type HomeContent,
  DEFAULT_APPEARANCE,
  MENU_ICONS,
  MENU_STYLES,
  parseColor,
  type MenuAppearance,
  type MenuColumn,
  type MenuConfig,
  type MenuIconName,
  type MenuItem,
  type MenuItemKind,
  type MenuStyle,
  type PromoCard,
  type StoreSettings,
  type ThemeKey,
} from "./settings-types";
import { generalizeCategory } from "./taxonomy";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function str(v: unknown, fallback: string, max = 300): string {
  return typeof v === "string" ? v.trim().slice(0, max) : fallback;
}
function num(v: unknown, fallback: number, min = 0, max = 1_000_000): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v.replace(",", ".")) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * 100) / 100)) : fallback;
}
function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function href(v: unknown, fallback: string): string {
  if (typeof v !== "string") return fallback;
  return safeHref(v) ?? fallback;
}
function theme(v: unknown, fallback: ThemeKey): ThemeKey {
  return typeof v === "string" && v in THEMES ? (v as ThemeKey) : fallback;
}
/** Image: an uploaded file (/uploads/…) or an http(s) address. */
function image(v: unknown): string {
  if (typeof v !== "string") return "";
  const t = v.trim();
  if (/^\/uploads\/[a-z0-9]+\.[a-z]+$/.test(t)) return t;
  if (/^https?:\/\/[^\s<>"]+$/i.test(t)) return t.slice(0, 1000);
  return "";
}
function id(v: unknown, i: number): string {
  return typeof v === "string" && /^[\w-]{1,40}$/.test(v) ? v : `i${i}-${Date.now().toString(36)}`;
}

export function normalizeSettings(raw: unknown): StoreSettings {
  const r = isObj(raw) ? raw : {};
  const d = DEFAULT_SETTINGS;
  const company = isObj(r.company) ? r.company : {};
  const shipping = isObj(r.shipping) ? r.shipping : {};
  const points = isObj(r.points) ? r.points : {};
  return {
    name: str(r.name, d.name, 60) || d.name,
    tagline: str(r.tagline, d.tagline, 120),
    description: str(r.description, d.description, 400),
    phone: str(r.phone, d.phone, 40),
    email: str(r.email, d.email, 120),
    address: str(r.address, d.address, 200),
    workingHours: str(r.workingHours, d.workingHours, 120),
    company: {
      legalName: str(company.legalName, d.company.legalName, 200),
      eik: str(company.eik, d.company.eik, 40),
      registeredAddress: str(company.registeredAddress, d.company.registeredAddress, 300),
    },
    shipping: {
      freeOver: num(shipping.freeOver, d.shipping.freeOver, 0, 100000),
      office: num(shipping.office, d.shipping.office, 0, 1000),
      address: num(shipping.address, d.shipping.address, 0, 1000),
      mode: shipping.mode === "fixed" ? "fixed" : "courier",
    },
    points: {
      perEuro: num(points.perEuro, d.points.perEuro, 0, 100),
      redeemValue: num(points.redeemValue, d.points.redeemValue, 0, 100),
    },
    returnDays: Math.round(num(r.returnDays, d.returnDays, 0, 365)),
    deliveryDays: str(r.deliveryDays, d.deliveryDays, 60),
    allowOutOfStockOrders: bool(r.allowOutOfStockOrders, d.allowOutOfStockOrders),
    showDemoNotice: bool(r.showDemoNotice, d.showDemoNotice),
  };
}

function button(v: unknown, fallback: { label: string; href: string }) {
  const b = isObj(v) ? v : {};
  return { label: str(b.label, fallback.label, 60), href: href(b.href, fallback.href) };
}

export function normalizeSlide(raw: unknown, i: number): HeroSlide {
  const r = isObj(raw) ? raw : {};
  const d = DEFAULT_HOME.slides[0];
  return {
    id: id(r.id, i),
    enabled: bool(r.enabled, true),
    layout: r.layout === "image-only" ? "image-only" : "text-image",
    eyebrow: str(r.eyebrow, "", 120),
    title: str(r.title, "", 120),
    highlight: str(r.highlight, "", 80),
    text: str(r.text, "", 400),
    image: image(r.image),
    mobileImage: image(r.mobileImage),
    href: href(r.href, ""),
    theme: theme(r.theme, d.theme),
    primary: button(r.primary, { label: "", href: "" }),
    secondary: button(r.secondary, { label: "", href: "" }),
  };
}

export function normalizePromo(raw: unknown, i: number): PromoCard {
  const r = isObj(raw) ? raw : {};
  return {
    id: id(r.id, i),
    enabled: bool(r.enabled, true),
    title: str(r.title, "", 80),
    text: str(r.text, "", 200),
    image: image(r.image),
    href: href(r.href, ""),
    buttonLabel: str(r.buttonLabel, "", 40),
    theme: theme(r.theme, "sunrise"),
  };
}

export function normalizeHome(raw: unknown): HomeContent {
  if (!isObj(raw)) return DEFAULT_HOME;
  const d = DEFAULT_HOME;
  const a = isObj(raw.announcement) ? raw.announcement : {};
  const b = isObj(raw.bonus) ? raw.bonus : {};
  const s = isObj(raw.sections) ? raw.sections : {};
  const sections = { ...d.sections };
  for (const k of Object.keys(sections) as (keyof typeof sections)[]) sections[k] = bool(s[k], d.sections[k]);
  return {
    announcement: {
      enabled: bool(a.enabled, d.announcement.enabled),
      text: str(a.text, d.announcement.text, 200),
      href: href(a.href, d.announcement.href),
      theme: theme(a.theme, d.announcement.theme),
    },
    slides: Array.isArray(raw.slides) ? raw.slides.slice(0, 10).map(normalizeSlide) : d.slides,
    autoplaySeconds: Math.round(num(raw.autoplaySeconds, d.autoplaySeconds, 0, 60)),
    promos: Array.isArray(raw.promos) ? raw.promos.slice(0, 6).map(normalizePromo) : d.promos,
    bonus: {
      enabled: bool(b.enabled, d.bonus.enabled),
      title: str(b.title, d.bonus.title, 120),
      text: str(b.text, d.bonus.text, 400),
      buttonLabel: str(b.buttonLabel, d.bonus.buttonLabel, 40),
      href: href(b.href, d.bonus.href),
    },
    sections,
  };
}

function normalizeGiftSide(raw: unknown, side: GiftSideKey): GiftSide {
  const r = isObj(raw) ? raw : {};
  const d = DEFAULT_GIFT_TEXT[side];
  const sections = Array.isArray(r.sections) ? r.sections : [];
  return {
    title: str(r.title, d.title, 60) || d.title,
    subtitle: str(r.subtitle, d.subtitle, 160),
    sections: sections.slice(0, 20).map((sec, i) => {
      const o = isObj(sec) ? sec : {};
      const skus = Array.isArray(o.skus) ? o.skus.filter((x): x is string => typeof x === "string" && x.length <= 60) : [];
      return {
        id: id(o.id, i),
        title: str(o.title, "", 60),
        // Sections saved before the categories were regrouped point at today's category.
        category: typeof o.category === "string" && o.category ? generalizeCategory(o.category.slice(0, 60), null).category : "",
        skus: [...new Set(skus)].slice(0, 60),
      };
    }),
  };
}

/** Returns null when the admin never saved gift ideas (the site then uses automatic suggestions). */
export function normalizeGifts(raw: unknown): GiftIdeas | null {
  if (!isObj(raw)) return null;
  return {
    enabled: bool(raw.enabled, true),
    menuLabel: str(raw.menuLabel, "Идеи за подаръци", 40) || "Идеи за подаръци",
    boys: normalizeGiftSide(raw.boys, "boys"),
    girls: normalizeGiftSide(raw.girls, "girls"),
  };
}

function color(v: unknown, fallback: string): string {
  return (typeof v === "string" && parseColor(v)) || fallback;
}

function appearance(raw: unknown, fallback: MenuAppearance): MenuAppearance {
  const r = isObj(raw) ? raw : {};
  return {
    style: typeof r.style === "string" && r.style in MENU_STYLES ? (r.style as MenuStyle) : fallback.style,
    color: color(r.color, fallback.color),
    color2: color(r.color2, fallback.color2),
    icon: typeof r.icon === "string" && (MENU_ICONS as readonly string[]).includes(r.icon) ? (r.icon as MenuIconName) : fallback.icon,
  };
}

function column(raw: unknown, i: number): MenuColumn {
  const r = isObj(raw) ? raw : {};
  const links = Array.isArray(r.links) ? r.links : [];
  return {
    id: id(r.id, i),
    kind: r.kind === "image" ? "image" : "links",
    title: str(r.title, "", 60),
    href: href(r.href, ""),
    image: image(r.image),
    links: links
      .slice(0, 15)
      .map((l, k) => {
        const o = isObj(l) ? l : {};
        return { id: id(o.id, k), label: str(o.label, "", 60), href: href(o.href, "") };
      })
      .filter((l) => l.label && l.href),
  };
}

function menuItem(raw: unknown, i: number): MenuItem | null {
  const r = isObj(raw) ? raw : {};
  const kind: MenuItemKind = r.kind === "dropdown" ? "dropdown" : r.kind === "gifts" ? "gifts" : "link";
  const label = str(r.label, "", 40);
  if (!label) return null;
  const item: MenuItem = {
    id: id(r.id, i),
    kind,
    label,
    href: href(r.href, ""),
    appearance: appearance(r.appearance, DEFAULT_APPEARANCE),
    columns: kind === "dropdown" && Array.isArray(r.columns) ? r.columns.slice(0, 5).map(column) : [],
  };
  if (kind === "link" && !item.href) return null;
  return item;
}

/** Menu settings; also upgrades the first format (a plain list of links with a red "highlight" flag). */
export function normalizeMenu(raw: unknown): MenuConfig {
  if (Array.isArray(raw)) {
    const items = raw
      .slice(0, 14)
      .map((v, i): MenuItem | null => {
        const r = isObj(v) ? v : {};
        const label = str(r.label, "", 40);
        const h = href(r.href, "");
        if (!label || !h) return null;
        return { id: id(r.id, i), kind: "link", label, href: h, appearance: { ...DEFAULT_APPEARANCE, style: r.highlight === true ? "text" : "plain" }, columns: [] };
      })
      .filter((x): x is MenuItem => !!x);
    // The gift ideas item used to be added automatically after the links.
    return { categories: DEFAULT_MENU.categories, items: [...items, DEFAULT_MENU.items.find((x) => x.kind === "gifts")!] };
  }
  if (!isObj(raw)) return DEFAULT_MENU;
  const c = isObj(raw.categories) ? raw.categories : {};
  const items = (Array.isArray(raw.items) ? raw.items : []).slice(0, 14).map(menuItem).filter((x): x is MenuItem => !!x);
  // Only one gift ideas item makes sense.
  const firstGifts = items.findIndex((x) => x.kind === "gifts");
  return {
    categories: {
      show: bool(c.show, true),
      label: str(c.label, DEFAULT_MENU.categories.label, 40) || DEFAULT_MENU.categories.label,
      color: color(c.color, DEFAULT_MENU.categories.color),
    },
    items: items.filter((x, i) => x.kind !== "gifts" || i === firstGifts),
  };
}

export function normalizeChat(raw: unknown): ChatSettings {
  const r = isObj(raw) ? raw : {};
  const d = DEFAULT_CHAT;
  const questions = Array.isArray(r.quickQuestions)
    ? r.quickQuestions.map((q) => str(q, "", 120)).filter(Boolean).slice(0, 6)
    : d.quickQuestions;
  return {
    enabled: bool(r.enabled, d.enabled),
    title: str(r.title, d.title, 40) || d.title,
    greeting: str(r.greeting, d.greeting, 400),
    offlineText: str(r.offlineText, d.offlineText, 300),
    quickQuestions: questions,
    askContact: bool(r.askContact, d.askContact),
  };
}
