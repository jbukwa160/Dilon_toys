// Types + defaults for everything the admin can edit (store info, home page, menu).
// Pure data: safe to import from client components, server code and scripts.

export type StoreSettings = {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  company: { legalName: string; eik: string; registeredAddress: string };
  /** mode "courier": live price from Speedy/Econt (fixed prices are the fallback); "fixed": always the fixed prices. */
  shipping: { freeOver: number; office: number; address: number; mode: "courier" | "fixed" };
  points: { perEuro: number; redeemValue: number };
  returnDays: number;
  deliveryDays: string;
  allowOutOfStockOrders: boolean;
  showDemoNotice: boolean;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  name: "Dilon Toys",
  tagline: "Магазин за детски играчки",
  description:
    "Онлайн магазин за детски играчки — LEGO, кукли, пъзели, настолни игри, колички и още хиляди играчки с бонус точки за всяка покупка.",
  phone: "0700 00 000",
  email: "shop@dilonltd.com",
  address: "София, България",
  workingHours: "Пон – Пет: 9:00 – 18:00",
  company: { legalName: "[Наименование на търговеца]", eik: "[ЕИК]", registeredAddress: "[Адрес на управление]" },
  shipping: { freeOver: 49, office: 3.99, address: 5.99, mode: "courier" },
  points: { perEuro: 1, redeemValue: 0.05 },
  returnDays: 14,
  deliveryDays: "1–3 работни дни",
  allowOutOfStockOrders: false,
  showDemoNotice: true,
};

/** The subset client components need (passed through React context). */
export type PublicSettings = Pick<StoreSettings, "name" | "shipping" | "points" | "allowOutOfStockOrders" | "deliveryDays" | "returnDays">;


export function publicSettings(s: StoreSettings): PublicSettings {
  return {
    name: s.name,
    shipping: s.shipping,
    points: s.points,
    allowOutOfStockOrders: s.allowOutOfStockOrders,
    deliveryDays: s.deliveryDays,
    returnDays: s.returnDays,
  };
}

// ---------------------------------------------------------------------------
// Home page

export const THEMES = {
  sunrise: { label: "Слънце", background: "linear-gradient(135deg,#fff4d1 0%,#ffe8e3 55%,#efeaff 100%)", dark: false },
  sky: { label: "Небе", background: "linear-gradient(135deg,#e3f3fd 0%,#efeaff 100%)", dark: false },
  mint: { label: "Мента", background: "linear-gradient(135deg,#e2f6eb 0%,#fff4d1 100%)", dark: false },
  pink: { label: "Розово", background: "linear-gradient(135deg,#fde2ef 0%,#fff4d1 100%)", dark: false },
  grape: { label: "Лилаво", background: "linear-gradient(120deg,#7552f5 0%,#9b6cff 100%)", dark: true },
  brand: { label: "Червено", background: "linear-gradient(120deg,#f0503a 0%,#ff7a59 100%)", dark: true },
  ink: { label: "Тъмно", background: "linear-gradient(120deg,#1d2340 0%,#3b4163 100%)", dark: true },
} as const;
export type ThemeKey = keyof typeof THEMES;
export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];

export type LinkButton = { label: string; href: string };

export type HeroSlide = {
  id: string;
  enabled: boolean;
  /** "text-image": text + buttons on the left, picture on the right. "image-only": a ready-made banner picture. */
  layout: "text-image" | "image-only";
  eyebrow: string;
  title: string;
  highlight: string;
  text: string;
  /** Empty on a text-image slide → an automatic collage of popular toys. */
  image: string;
  mobileImage: string;
  /** Where an image-only banner leads when clicked. */
  href: string;
  theme: ThemeKey;
  primary: LinkButton;
  secondary: LinkButton;
};

export type PromoCard = {
  id: string;
  enabled: boolean;
  title: string;
  text: string;
  /** Empty → the picture of the linked category / hero is used automatically. */
  image: string;
  href: string;
  buttonLabel: string;
  theme: ThemeKey;
};

export type HomeContent = {
  announcement: { enabled: boolean; text: string; href: string; theme: ThemeKey };
  slides: HeroSlide[];
  autoplaySeconds: number;
  promos: PromoCard[];
  bonus: { enabled: boolean; title: string; text: string; buttonLabel: string; href: string };
  sections: {
    trust: boolean;
    categories: boolean;
    sale: boolean;
    popular: boolean;
    heroes: boolean;
    fresh: boolean;
    budgetBrands: boolean;
    blog: boolean;
  };
};

export const SECTION_LABELS: Record<keyof HomeContent["sections"], string> = {
  trust: "Лента с предимства (доставка, точки, връщане)",
  categories: "Категории",
  sale: "Горещи промоции",
  popular: "Препоръчани за вас",
  heroes: "Любими герои",
  fresh: "Нови играчки",
  budgetBrands: "Подарък според бюджета и популярни марки",
  blog: "Последни статии от блога",
};

/** "{брой}" in banner texts is replaced with the number of products in the shop. */
export const COUNT_TOKEN = "{брой}";

export const DEFAULT_HOME: HomeContent = {
  announcement: { enabled: false, text: "Черен петък: до -30% на избрани играчки!", href: "/promotsii", theme: "brand" },
  slides: [
    {
      id: "main",
      enabled: true,
      layout: "text-image",
      eyebrow: `Над ${COUNT_TOKEN} играчки на склад и по поръчка`,
      title: "Играчки, които правят детството",
      highlight: "по-цветно",
      text: "LEGO, кукли, пъзели, колички и настолни игри от любимите марки — с бонус точки за всяка покупка и безплатна доставка.",
      image: "",
      mobileImage: "",
      href: "",
      theme: "sunrise",
      primary: { label: "Разгледай играчките", href: "/igrachki" },
      secondary: { label: "Промоции", href: "/promotsii" },
    },
  ],
  autoplaySeconds: 6,
  promos: [
    { id: "p1", enabled: true, title: "LEGO", text: "Конструктори за малки и големи строители", image: "", href: "/kategoria/lego", buttonLabel: "Към LEGO", theme: "sunrise" },
    { id: "p2", enabled: true, title: "Любими герои", text: "Пес Патрул, Frozen, Marvel и още", image: "", href: "/geroi/pes-patrul", buttonLabel: "Разгледай", theme: "sky" },
    { id: "p3", enabled: true, title: "Промоции", text: "Намалени играчки, докато са налични", image: "", href: "/promotsii", buttonLabel: "Виж промоциите", theme: "pink" },
  ],
  bonus: {
    enabled: true,
    title: "Събирай точки с всяка покупка",
    text: "Точките се виждат при всеки продукт и в количката и се натрупват с всяка поръчка.",
    buttonLabel: "Как работи",
    href: "/bonus-programa",
  },
  sections: { trust: true, categories: true, sale: true, popular: true, heroes: true, fresh: true, budgetBrands: true, blog: true },
};

// ---------------------------------------------------------------------------
// Chat bubble (Admin → Чат)

export type ChatSettings = {
  enabled: boolean;
  title: string;
  greeting: string;
  /** Shown when nobody from the shop has the admin panel open. */
  offlineText: string;
  /** Ready-made first questions the visitor can tap. */
  quickQuestions: string[];
  askContact: boolean;
};

export const DEFAULT_CHAT: ChatSettings = {
  enabled: true,
  title: "Пишете ни",
  greeting: "Здравейте! 👋 С какво можем да помогнем? Питайте за наличност, доставка или идея за подарък.",
  offlineText: "В момента не сме на линия, но ще ви отговорим възможно най-скоро.",
  quickQuestions: ["Имате ли този продукт в наличност?", "Кога ще пристигне поръчката ми?", "Помогнете ми да избера подарък", "Как да върна или заменя продукт?"],
  askContact: true,
};

export type PublicChat = Omit<ChatSettings, "enabled">;

// ---------------------------------------------------------------------------
// Top menu (the bar under the search). Fully editable in Admin → Меню.

export const MENU_STYLES = {
  plain: "Обикновен",
  text: "Цветен текст",
  pill: "Цветен бутон",
  outline: "С рамка",
  gradient: "Преливащ цвят",
} as const;
export type MenuStyle = keyof typeof MENU_STYLES;

/** Icons the admin can put in front of a menu item (names map to icons in components/layout/MenuIcon). */
export const MENU_ICONS = [
  "none", "gift", "percent", "tag", "star", "sparkles", "flame", "heart", "crown", "rocket",
  "snowflake", "sun", "tree", "baby", "car", "blocks", "puzzle", "truck", "bell", "book",
] as const;
export type MenuIconName = (typeof MENU_ICONS)[number];

export type MenuAppearance = {
  style: MenuStyle;
  /** Main colour (#rrggbb): text colour, button colour or gradient start. */
  color: string;
  /** Gradient end colour (#rrggbb). */
  color2: string;
  icon: MenuIconName;
};

export type MenuSubLink = { id: string; label: string; href: string };

/** A column in a dropdown: either a list of links or a picture with a link. */
export type MenuColumn = {
  id: string;
  kind: "links" | "image";
  title: string;
  href: string;
  links: MenuSubLink[];
  image: string;
};

export type MenuItemKind = "link" | "dropdown" | "gifts";

export type MenuItem = {
  id: string;
  kind: MenuItemKind;
  label: string;
  /** For "link": where it goes. For "dropdown": optional "Виж всички" link. */
  href: string;
  appearance: MenuAppearance;
  columns: MenuColumn[];
};

export type MenuConfig = {
  categories: { show: boolean; label: string; color: string };
  items: MenuItem[];
};

export const BRAND_RED = "#f0503a";
export const INK = "#1d2340";

export const COLOR_PRESETS = [
  "#f0503a", "#d33a25", "#ffc93c", "#1fa463", "#2f9fe0", "#0284c7", "#7552f5", "#ec4899", "#db2777", "#1d2340", "#6b7093", "#ffffff",
];

export const DEFAULT_APPEARANCE: MenuAppearance = { style: "plain", color: BRAND_RED, color2: "#7552f5", icon: "none" };

export const DEFAULT_MENU: MenuConfig = {
  categories: { show: true, label: "Всички категории", color: BRAND_RED },
  items: [
    { id: "m1", kind: "link", label: "Промоции", href: "/promotsii", appearance: { ...DEFAULT_APPEARANCE, style: "text" }, columns: [] },
    { id: "m2", kind: "link", label: "Нови", href: "/novi", appearance: DEFAULT_APPEARANCE, columns: [] },
    {
      id: "m3",
      kind: "gifts",
      label: "Идеи за подаръци",
      href: "/podaratsi",
      appearance: { style: "gradient", color: "#0284c7", color2: "#ec4899", icon: "gift" },
      columns: [],
    },
  ],
};

// ---------------------------------------------------------------------------
// Colours typed by the admin: "#f0503a", "f0503a", "#f53", "rgb(240, 80, 58)" or "240, 80, 58".

export function parseColor(input: string): string | null {
  const v = input.trim().toLowerCase();
  let m = v.match(/^#?([0-9a-f]{6})$/);
  if (m) return `#${m[1]}`;
  m = v.match(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (m) return `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}`;
  m = v.match(/^(?:rgba?\s*\(\s*)?(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*(?:[,/]\s*[\d.]+%?\s*)?\)?$/);
  if (m) {
    const parts = [m[1], m[2], m[3]].map(Number);
    if (parts.some((n) => n > 255)) return null;
    return `#${parts.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  }
  return null;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = parseColor(hex) ?? INK;
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

/** White or dark text, whichever reads better on the given background. */
export function contrastText(bg: string): string {
  const [r, g, b] = hexToRgb(bg).map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.45 ? INK : "#ffffff";
}

// ---------------------------------------------------------------------------
// Gift ideas ("Идеи за подаръци"): hand-picked products for boys and girls, grouped in sections.

export type GiftSideKey = "boys" | "girls";
export const GIFT_SIDES: GiftSideKey[] = ["boys", "girls"];
export const GIFT_SIDE_SLUG: Record<GiftSideKey, string> = { boys: "momcheta", girls: "momicheta" };
export const GIFT_SIDE_BY_SLUG: Record<string, GiftSideKey> = { momcheta: "boys", momicheta: "girls" };

export type GiftSection = { id: string; title: string; category: string; skus: string[] };
export type GiftSide = { title: string; subtitle: string; sections: GiftSection[] };
export type GiftIdeas = { enabled: boolean; menuLabel: string; boys: GiftSide; girls: GiftSide };

/** Categories used to start each side when nothing has been picked yet. */
export const DEFAULT_GIFT_CATEGORIES: Record<GiftSideKey, string[]> = {
  boys: ["konstruktori", "prevozni-sredstva", "figurki", "na-otkrito", "obrazovatelni", "pazeli"],
  girls: ["kukli", "tvorchestvo", "rolevi-igri", "na-otkrito", "pazeli", "obrazovatelni"],
};

export const DEFAULT_GIFT_TEXT: Record<GiftSideKey, { title: string; subtitle: string }> = {
  boys: { title: "За момчета", subtitle: "Конструктори, колички, динозаври и супергерои" },
  girls: { title: "За момичета", subtitle: "Кукли, творчество, плюшени приятели и красота" },
};

// ---------------------------------------------------------------------------
// Links typed by the admin end up in href attributes, so only allow safe kinds.

export function safeHref(input: string): string | null {
  const v = input.trim();
  if (!v) return "";
  if (/^\/(?!\/)[^\s<>"]*$/.test(v)) return v;
  if (/^https?:\/\/[^\s<>"]+$/i.test(v)) return v;
  if (/^(mailto|tel):[^\s<>"]+$/i.test(v)) return v;
  return null;
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
