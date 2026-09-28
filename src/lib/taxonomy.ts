// Store taxonomy + the rules that map raw export rows onto it.
// Shared by the importer (scripts/import-catalog.ts) and the app, so keep it free of Node APIs.

export type SubCategory = { slug: string; name: string };
export type Category = {
  slug: string;
  name: string;
  tagline: string;
  color: string; // tile background
  accent: string; // tile text/icon
  subs: SubCategory[];
};

// 11 general groups; the finer sorting lives in the subcategories. Addresses (slugs) of the earlier,
// more detailed top-level categories were kept as subcategories, so old /kategoria/… links still work.
export const CATEGORIES: Category[] = [
  {
    slug: "bebeshki",
    name: "Бебешки играчки",
    tagline: "За най-малките — от раждането до 3 години",
    color: "#FFF0E0",
    accent: "#C2410C",
    subs: [{ slug: "igrachki-za-bebeta", name: "Дрънкалки, гризалки и активни играчки" }],
  },
  {
    slug: "konstruktori",
    name: "Конструктори",
    tagline: "LEGO, магнитни и класически блокчета",
    color: "#FFE9D6",
    accent: "#C2410C",
    subs: [
      { slug: "lego", name: "LEGO" },
      { slug: "magnitni", name: "Магнитни конструктори" },
      { slug: "drugi-konstruktori", name: "Други конструктори" },
    ],
  },
  {
    slug: "kukli",
    name: "Кукли и плюшени играчки",
    tagline: "Barbie, бебета, къщи, плюшени животни и театър",
    color: "#FDE2EF",
    accent: "#BE185D",
    subs: [
      { slug: "modni-kukli", name: "Модни кукли" },
      { slug: "kukli-bebeta", name: "Кукли бебета" },
      { slug: "kashti-i-aksesoari", name: "Къщи и аксесоари за кукли" },
      { slug: "drugi-kukli", name: "Други кукли" },
      { slug: "plyusheni-igrachki", name: "Плюшени играчки" },
      { slug: "kukli-za-teatar", name: "Кукли за куклен театър" },
    ],
  },
  {
    slug: "prevozni-sredstva",
    name: "Колички и превозни средства",
    tagline: "Метални модели, писти и радиоуправляеми",
    color: "#DCEBFF",
    accent: "#1D4ED8",
    subs: [
      { slug: "metalni-modeli", name: "Метални модели" },
      { slug: "radioupravlyaemi", name: "Радиоуправляеми" },
      { slug: "pisti-i-garazhi", name: "Писти, гаражи и влакове" },
      { slug: "drugi-prevozni", name: "Коли, камиони и самолети" },
    ],
  },
  {
    slug: "figurki",
    name: "Фигурки и герои",
    tagline: "Playmobil, животни, герои и интерактивни играчки",
    color: "#E4F5E9",
    accent: "#15803D",
    subs: [
      { slug: "playmobil", name: "Playmobil" },
      { slug: "zhivotni-i-dinozavri", name: "Животни и динозаври" },
      { slug: "geroi-i-igralni-komplekti", name: "Герои и игрални комплекти" },
      { slug: "kolektsionerski", name: "Колекционерски фигурки" },
      { slug: "interaktivni", name: "Интерактивни играчки и роботи" },
    ],
  },
  {
    slug: "pazeli",
    name: "Пъзели и настолни игри",
    tagline: "Пъзели за всяка възраст и игри за цялото семейство",
    color: "#FFF4C2",
    accent: "#A16207",
    subs: [
      { slug: "detski-pazeli", name: "Детски пъзели" },
      { slug: "pazeli-za-vazrastni", name: "Пъзели за възрастни" },
      { slug: "3d-pazeli", name: "3D пъзели" },
      { slug: "nastolni-igri", name: "Настолни игри" },
    ],
  },
  {
    slug: "tvorchestvo",
    name: "Творчество и хоби",
    tagline: "Рисуване, творчески комплекти, модели и училище",
    color: "#E0F7F6",
    accent: "#0F766E",
    subs: [
      { slug: "tvorcheski-komplekti", name: "Рисуване и творчески комплекти" },
      { slug: "sglobyaemi-modeli", name: "Сглобяеми модели" },
      { slug: "boi-i-instrumenti", name: "Бои и инструменти за модели" },
      { slug: "za-uchilishte", name: "За училище" },
    ],
  },
  {
    slug: "obrazovatelni",
    name: "Образователни играчки",
    tagline: "Наука, дървени и музикални играчки",
    color: "#E8EEFF",
    accent: "#4338CA",
    subs: [
      { slug: "nauka-i-eksperimenti", name: "Наука, STEM и експерименти" },
      { slug: "darveni", name: "Дървени играчки" },
      { slug: "muzikalni", name: "Музикални играчки" },
    ],
  },
  {
    slug: "rolevi-igri",
    name: "Ролеви игри",
    tagline: "Кухни, инструменти, красота и костюми",
    color: "#FCE7F3",
    accent: "#9D174D",
    subs: [
      { slug: "kuhni-i-pazaruvane", name: "Кухни и пазаруване" },
      { slug: "instrumenti-i-profesii", name: "Инструменти и професии" },
      { slug: "krasota-i-moda", name: "Красота и мода" },
      { slug: "kostyumi", name: "Костюми и маски" },
    ],
  },
  {
    slug: "na-otkrito",
    name: "Спорт и игри навън",
    tagline: "Тротинетки, колела, басейни, спорт и бластери",
    color: "#DDF4E4",
    accent: "#166534",
    subs: [
      { slug: "trotinetki", name: "Тротинетки" },
      { slug: "kolela-i-triokolki", name: "Колела и триколки" },
      { slug: "detski-koli-za-karane", name: "Детски коли за каране" },
      { slug: "lyato-i-voda", name: "Лято, пясък и вода" },
      { slug: "sport", name: "Спорт и игри навън" },
      { slug: "blasteri", name: "Бластери" },
    ],
  },
  {
    slug: "aksesoari",
    name: "Детска стая и други",
    tagline: "Лампи, спално бельо, мебели, фен артикули и още",
    color: "#FEF3C7",
    accent: "#92400E",
    subs: [
      { slug: "detska-staya", name: "Детска стая и аксесоари" },
      { slug: "drugi-igrachki", name: "Други играчки" },
    ],
  },
];

export const CATEGORY_BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

/** Earlier top-level categories → where their products live now (category, subcategory). */
const LEGACY_TOP: Record<string, [string, string]> = {
  plyusheni: ["kukli", "plyusheni-igrachki"],
  "nastolni-igri": ["pazeli", "nastolni-igri"],
  tvorchestvo: ["tvorchestvo", "tvorcheski-komplekti"],
  obrazovatelni: ["obrazovatelni", "nauka-i-eksperimenti"],
  bebeshki: ["bebeshki", "igrachki-za-bebeta"],
  blasteri: ["na-otkrito", "blasteri"],
  muzikalni: ["obrazovatelni", "muzikalni"],
  interaktivni: ["figurki", "interaktivni"],
  "modeli-i-hobi": ["tvorchestvo", "sglobyaemi-modeli"],
  "za-uchilishte": ["tvorchestvo", "za-uchilishte"],
  aksesoari: ["aksesoari", "detska-staya"],
  darveni: ["obrazovatelni", "darveni"],
  "drugi-igrachki": ["aksesoari", "drugi-igrachki"],
};
const SUB_PARENT = new Map(CATEGORIES.flatMap((c) => c.subs.map((s) => [s.slug, c.slug] as const)));

/**
 * A (category, subcategory) pair in today's structure. Pairs from the earlier structure (saved admin edits,
 * old imports) are moved over; valid pairs and the admin's own categories are left alone.
 */
export function generalizeCategory(category: string, sub: string | null): { category: string; sub: string | null } {
  const c = CATEGORY_BY_SLUG.get(category);
  if (c && sub && c.subs.some((s) => s.slug === sub)) return { category, sub };
  if (sub && SUB_PARENT.has(sub) && (!c || LEGACY_TOP[category])) return { category: SUB_PARENT.get(sub)!, sub };
  const legacy = LEGACY_TOP[category];
  if (legacy && (!sub || !c)) return { category: legacy[0], sub: legacy[1] };
  return { category, sub };
}

/** Addresses of earlier top-level categories that no longer exist → where to send visitors. */
export const RETIRED_CATEGORY_REDIRECTS: Record<string, string> = {
  plyusheni: "plyusheni-igrachki",
  "modeli-i-hobi": "sglobyaemi-modeli",
};

// ---------------------------------------------------------------------------
// Keyword helpers. JS `\b` only understands ASCII, so boundaries are built with
// Unicode property escapes: a keyword must start at the beginning of a word.
function kw(...stems: string[]): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${stems.join("|")})`, "iu");
}

const RX = {
  // Never sell these in a kids' store, whatever category the export puts them in.
  unsafe: kw(
    "секс", "sex(?![\\p{L}])", "дилдо", "dildo", "вибратор", "vibrat", "пенис", "penis", "вагин", "vagin", "лубрикант", "lubric",
    "bdsm", "бдсм", "еротич", "erotic", "мастурб", "masturb", "клитор", "анал(?:ен|ни|на|но)", "оргазм", "orgasm", "презерватив",
    "condom", "love doll", "интимни въпроси", "стриптийз", "бира", "алкохол", "водка", "уиски", "ракия", "пие бира", "шотове",
    "цигар", "вейп", "vape", "никотин", "тютюн", "за почистване на играчки", "почистващ спрей за играчки", "почистване pjur",
    "18\\s?\\+(?!\\s*(?:м|мес|month))",
  ),
  exclude: kw(
    "балсам", "шампоан", "хранителна добавка", "добавка", "паста за зъби", "четка за зъби", "brushbaby",
    "биберон", "залъгалк", "шише за хранене", "памперс", "пелен", "мокри кърпи", "душ гел", "витамин",
    "капсул", "таблетк", "сироп", "крем за", "слънцезащит", "лосион", "дезодорант", "парфюм", "тоалетна вода",
    "сапун(?!ен|ени)", "ортодонт", "аспиратор", "термометър", "стерилизатор", "лепенк[аи] (?:за|при)", "загряващ",
    "пъпки", "колики", "samsung", "galaxy a\\d", "iphone", "screen protector", "защитно покритие", "usb кабел",
    "lightning", "шейкър", "shaker", "smartshake", "shieldmixer", "спрей", "колан(?! за плуване)", "мляко", "адаптирано",
    "инхалатор", "мигли", "къдрици", "препарат", "почистващ", "каша(?![\\p{L}])", "пюре", "шишета",
  ),
  modelKitBrand: /^(revell|italeri|airfix|zvezda|tamiya|academy|heller|hobby boss|trumpeter|vallejo)$/i,
  modelKitName: kw("сглобяем модел", "акрилна боя", "боя revell", "лепило за модели", "модел за сглобяване", "аерограф", "четк(?:а|и) за модели", "шпакловка", "макет"),
  modelPaint: kw("боя", "бои", "лепило", "четк", "лак", "разредител", "шпакловк", "аерограф", "грунд", "гланц", "мат", "тонер"),
  school: kw(
    "ученическ", "раница", "несесер", "флумастер", "моливи", "молив", "тетрадк", "скицник", "гума за триене",
    "острилк", "химикалк", "маркер", "текстмаркер", "пергел", "линийк", "staedtler", "maped", "faber", "кутия за храна",
    "кутия за сандвич", "бутилка за вода", "бутилка", "чанта", "торба", "пенал", "портмоне", "калъф за", "тефтер",
    "органайзер", "бележник", "дневник",
  ),
  creative: kw(
    "творчески", "творческ", "креатив", "рисуване", "рисувател", "оцветяв", "пластилин", "пластелин",
    "play[- ]?doh", "плей до", "моделин", "кинетичен пясък", "магически пясък", "kinetic sand", "слайм", "slime", "мъниста",
    "бижута", "гривн", "диамантен", "гоблен", "стикер", "татуировк", "боички", "бои за", "акрилни бои", "темперн", "акварел",
    "направи си", "шиене", "плетене", "бродери", "оригами", "декупаж", "скреч", "scratch", "мозайк", "брокат",
    "пясъчн(?:и|а) картин", "гипс", "отливк", "creart", "totum", "craft buddy", "folia", "четки за рисуване", "статив",
    "пастел", "тебешир", "восъчн", "печат", "пяна за", "картини от конци", "string art",
  ),
  puzzle: kw("пъзел", "пъзели", "puzzle"),
  puzzle3d: kw("3d", "3д", "триизмер", "скулптура", "cubicfun"),
  puzzleKids: kw("детск", "прогресив", "за деца", "за най-малките", "образователен пъзел", "дървен пъзел", "магнитен пъзел", "мек пъзел", "подов пъзел", "headu", "lisciani"),
  boardGame: kw(
    "настолна игра", "игра с карти", "карти за игра", "карти uno", "уно", "uno", "монопол", "monopoly", "шах", "табла",
    "домино", "мемори", "мемо игра", "memory", "бинго", "лото", "дженга", "jenga", "top trumps", "логическа игра", "семейна игра",
    "парти игра", "скрабъл", "scrabble", "игра с думи", "куиз", "викторин", "ребус", "игра на", "cluedo", "клуедо",
    "twister", "туистър", "карти", "стратегическа игра", "игра за", "бързи игри", "активити", "activity",
  ),
  merch: kw(
    "чаша", "халба", "ключодържател", "портфейл", "ръчен часовник", "смарт часовник", "лампа", "нощна лампа", "нощна светлина",
    "light(?![\\p{L}])", "кутия за съхранение", "възглавниц", "спален чувал", "одеял", "чадър", "шапка", "плакат", "постер",
    "значк", "чорапи", "тениска", "пижама", "подложка за мишка", "геймърски пад", "магнит за хладилник", "термос", "кърпа",
    "хавлия", "бельо(?! за кукл)", "спален комплект", "касичка", "статуетк", "пончо", "декорац", "мебел", "столче",
    "стол(?![\\p{L}])", "маса(?![\\p{L}])", "масичка", "ограда", "седалка", "закачалк", "рафт", "стикери за стена",
  ),
  scooter: kw("тротинетк", "скутер", "globber"),
  bike: kw("колело(?![\\p{L}])", "велосипед", "триколк", "баланс колело", "балансиращ", "беговел", "dino bikes"),
  rideOn: kw("акумулатор", "картинг", "бъги", "кола за бутане", "кола дръжка", "с педали", "педали", "ride.?on", "кон за яздене", "люлеещ", "за яздене", "проходилка кола"),
  puppet: kw("куклен театър", "театрален", "марионетк", "за пръст", "кукла ръкавица", "the puppet company"),
  doll: kw(
    "кукла", "кукли", "куклен", "barbie", "барби", "baby born", "беби борн", "baby annabell", "l\\.o\\.l", "lol surprise",
    "our generation", "стефи", "steffi", "еви", "evi love", "rainbow high", "monster high", "cry babies", "bratz", "polly pocket",
    "поли покет", "enchantimals", "кукленск", "къща за кукли", "nenuco", "реборн", "reborn", "na! na! na!", "gabby", "габи",
    "доли мода", "dolly moda",
  ),
  dollFashion: kw("barbie", "барби", "rainbow high", "monster high", "bratz", "стефи", "steffi", "модна", "модни", "our generation", "l\\.o\\.l", "disney princess", "дисни принцес", "принцеса"),
  dollBaby: kw("бебе", "baby born", "беби борн", "baby annabell", "nenuco", "cry babies", "реборн", "reborn", "пишкаща", "бебенце"),
  dollHouse: kw("къща", "количка за кукли", "легло за кукли", "дрехи за кукл", "аксесоари за кукл", "кукленск", "обзавеждане", "мебели", "доли мода", "рокличка", "бельо за кукл", "дрехи"),
  baby: kw(
    "бебешк", "бебе", "дрънкалк", "гризалк", "чесалк", "активна гимнастика", "активна постелк", "постелка за игра",
    "килимче за игра", "мултифункционална постелка", "сортер", "низанк", "нивеляшк", "за количка", "за креватче",
    "въртележка", "проходилк", "за баня", "за къпане", "0м\\+", "0\\+", "3м\\+", "6м\\+", "9м\\+", "12м\\+", "18м\\+",
    "новородени", "playgro", "tiny love", "taf toys", "lamaze", "infantino", "chicco", "canpol", "babyono", "kikka boo",
    "lorelli", "сензор", "първи стъпки", "моят първи", "моята първа", "simba abc", "fisher.?price", "tolo", "за бебе",
    "пирамида от чаши", "мобил за",
  ),
  summer: kw(
    "басейн", "надуваем", "пясъчник", "за пясък", "пясък", "кофа", "кофичка", "лопатк", "формички", "сапунен", "сапунени",
    "воден", "водна", "вода(?![\\p{L}])", "плаж", "пояс", "ръкавел", "дюшек", "bestway", "intex", "лейка", "пръскал",
    "плуване", "плавници", "шнорхел", "колан за плуване",
  ),
  sport: kw(
    "батут", "топка", "топки", "футбол", "баскетбол", "кош за", "хокей", "тенис", "бадминтон", "фризби", "кънки", "ролери",
    "скейтборд", "каска", "протектори", "люлка", "пързалка", "катерушка", "палатка", "къщичка", "въже за скачане", "хула хуп",
    "бокс", "стрелички", "дартс", "футболна врата", "врата за футбол", "мрежа за", "шейна", "детски център", "парти център",
    "хвърчило", "бумеранг", "боулинг", "голф", "йо-йо", "yo-yo",
  ),
  blaster: kw("нърф", "nerf", "бластер", "x-shot", "пистолет", "револвер", "пушка", "автомат(?![\\p{L}])", "мечове", "меч(?![\\p{L}])", "лък(?![\\p{L}])", "стрели", "белезници", "стрелялк", "кобур", "прашка"),
  lego: kw("lego"),
  construct: kw(
    "конструктор", "строител", "кубчета", "блокчета", "magformers", "geomag", "магнитни плочки", "магнитен конструктор",
    "clics", "mega bloks", "мега блокс", "duplo", "qman", "banbao", "sluban", "cobi", "k.nex", "meccano", "marioinex", "плочки",
    "блокове", "тухлички",
  ),
  magnetic: kw("магнит", "geomag", "magformers"),
  plush: kw("плюшен", "плюш", "мека играчка", "меко", "squishmallow", "keel", "nici", "aurora", "heunec", "ty beanie", "мече", "jellycat", "peluche"),
  vehicle: kw(
    "кола(?![\\p{L}])", "колата", "колички", "количка", "автомобил", "камион", "трактор", "багер", "самосвал", "автобус", "мотор",
    "джип", "самолет", "хеликоптер", "влак", "релси", "писта", "гараж", "паркинг", "кран(?![\\p{L}])", "пожарн", "линейка",
    "hot wheels", "хот уийлс", "bburago", "maisto", "majorette", "jada", "siku", "dickie", "rastar", "welly", "matchbox",
    "teamsterz", "дистанцион", "радиоуправляем", "rc(?![\\p{L}])", "r/c", "дрон", "кораб", "лодка", "танк", "превозн",
    "строителна машина", "строителна техника", "ферари", "ferrari", "porsche", "lamborghini", "mercedes", "bmw", "полицейска кола",
    "състезател", "железопът", "експрес", "батмобил", "космически кораб", "ракета",
  ),
  rc: kw("дистанцион", "радиоуправляем", "rc(?![\\p{L}])", "r/c", "дрон", "silverlit", "с управление"),
  track: kw("писта", "гараж", "паркинг", "релси", "влак", "железниц", "железопът", "станция", "експрес"),
  diecast: kw("метал", "die.?cast", "bburago", "maisto", "majorette", "jada", "siku", "welly", "hot wheels", "хот уийлс", "matchbox", "1:\\d+", "мащаб"),
  figure: kw(
    "фигурк", "фигура", "фигури", "playmobil", "плеймобил", "schleich", "papo", "mojo", "bullyland", "funko", "фънко", "imaginext",
    "трансформър", "transformers", "екшън", "action figure", "динозавър", "динозаври", "пес патрул", "paw patrol", "jurassic",
    "джурасик", "спайдърмен", "spider", "супергерой", "beyblade", "hatchimals", "bakugan", "бакуган", "doorables", "miniverse",
    "боен комплект", "черната серия", "black series", "toomies",
  ),
  figureWeak: kw("игрален комплект", "игрален набор", "игрална площадка", "площадка", "герой", "замък", "къща"),
  roleCart: kw("количка за пазар", "пазарска количка", "количка за почистване", "количка за чистене", "количка за инструменти", "количка за сладолед"),
  collectible: kw("funko", "фънко", "колекционер", "pop!", "поп!", "stumble guys", "mini figures", "минифигурк", "изненада"),
  animals: kw("schleich", "papo", "mojo", "bullyland", "животн", "динозав", "dinosaur", "кон(?![\\p{L}])", "коне", "ферма", "safari", "сафари", "collecta"),
  educational: kw(
    "образовател", "stem", "наука", "научен", "научн", "експеримент", "химическ", "химия", "физика", "микроскоп", "телескоп",
    "бинокъл", "глобус", "лупа", "азбука", "букви", "цифри", "числа", "броене", "учеб", "лаптоп", "таблет", "вълшебна писалка",
    "монтесори", "montessori", "buki", "headu", "vtech", "програмиране", "кодиране", "флаш карти", "малък гений", "геометр",
    "занимател", "логическ", "памет", "магнитна книга", "магнитни сцени", "магнитна игра", "магнитна дъска", "дидактич",
    "таблица за умножение", "часовник", "везна", "камера", "learning resources",
  ),
  roleKitchen: kw("кухня", "кухненск", "съдове", "сервиз", "тенджер", "храна", "храни", "плодове", "зеленчуц", "касов апарат", "пазар", "количка за пазар", "тостер", "кафемашин", "миксер", "блендер", "барбекю", "пекарна", "сладкарниц", "пица", "за чай", "чаен", "сладолед"),
  roleTools: kw("инструмент", "работилниц", "бормашин", "лекарск", "докторск", "доктор", "лекар", "ветеринар", "прахосмукачк", "ютия", "пералня", "гладачн", "пожарникар", "полицай", "полицейски комплект", "строителна каска", "шублер", "виноверт"),
  roleBeauty: kw("козмети", "грим", "маникюр", "лак за нокти", "лакове", "гланц за устни", "сешоар", "фризьор", "тоалетк", "бижу", "огледал", "прическ", "шноли", "за красота", "разкрасяване", "martinelia"),
  roleCostume: kw("костюм", "маскарад", "маска", "перука", "корона", "наметало", "рокля за", "жезъл", "магьосн", "тиара"),
  music: kw("пиано", "китара", "барабан", "ксилофон", "металофон", "микрофон", "синтезатор", "йоника", "тромпет", "саксофон", "флейта", "хармоника", "тамбурин", "музикален инструмент", "bontempi", "караоке", "музикал", "маракас", "цигулка"),
  interactive: kw("интерактив", "робот", "електрон", "tamagotchi", "тамагочи", "furreal", "говорещ", "светещ", "със звук", "звук и светлина", "лазер", "проектор", "walkie", "уоки", "с батерии", "танцуващ"),
  wooden: kw("дървен", "дървена", "дървено", "дървени", "от дърво", "wooden"),
  woodenBrand: /^(hape|bigjigs|goki|classic world|janod|viga toys|viga|small foot|melissa & doug|lelin|woody|woodyland|eichhorn|micki|tooky toy|plan toys|le toy van|j.adore)$/i,
  game: kw("игра(?![\\p{L}])", "игри(?![\\p{L}])"),
};

function roleSub(t: string): string {
  if (RX.roleCostume.test(t)) return "kostyumi";
  if (RX.roleBeauty.test(t)) return "krasota-i-moda";
  if (RX.roleKitchen.test(t)) return "kuhni-i-pazaruvane";
  return "instrumenti-i-profesii";
}

export type Classification = { category: string; sub: string | null };

/** Adult, alcohol and similar items that must never reach a children's store. */
export function isUnsafeForKids(name: string, brand: string): boolean {
  const t = `${name} ${brand}`.toLowerCase();
  if (RX.unsafe.test(t)) return true;
  return /за възрастни/.test(t) && !/деца/.test(t);
}

/**
 * Map a raw export row onto the store taxonomy. Returns null for items that are
 * not toys (cosmetics, supplements, phones…) even if the export lists them under
 * a toy category. Rule order matters: the first match wins.
 */
export function classify(name: string, brand: string, sourceCategory: string): Classification | null {
  const fine = classifyDetailed(name, brand, sourceCategory);
  if (!fine) return null;
  const g = generalizeCategory(fine.category, fine.sub);
  return { category: g.category, sub: g.sub };
}

/** The detailed sorting rules (written for the earlier, finer structure; see generalizeCategory). */
function classifyDetailed(name: string, brand: string, sourceCategory: string): Classification | null {
  const t = `${name} ${brand}`.toLowerCase();
  const b = brand.toLowerCase().trim();

  if (isUnsafeForKids(name, brand) || RX.exclude.test(t)) return null;

  if (sourceCategory === "Model Kits & Hobby" || RX.modelKitBrand.test(b) || RX.modelKitName.test(t)) {
    if (/макет/.test(t) && /3d|3д/.test(t)) return { category: "pazeli", sub: "3d-pazeli" };
    const paint = RX.modelPaint.test(name.toLowerCase()) && !RX.modelKitName.test(t.replace(/акрилна боя|боя revell/g, ""));
    return { category: "modeli-i-hobi", sub: paint || /^r?\d{4,6}\s*-/.test(name.trim().toLowerCase()) ? "boi-i-instrumenti" : "sglobyaemi-modeli" };
  }
  if (RX.creative.test(t) && !RX.puzzle.test(t)) return { category: "tvorchestvo", sub: null };
  if (RX.puzzle.test(t)) {
    const pieces = extractPieces(name);
    let sub = "detski-pazeli";
    if (RX.puzzle3d.test(t)) sub = "3d-pazeli";
    else if (pieces != null && pieces >= 500) sub = "pazeli-za-vazrastni";
    else if (pieces == null && !RX.puzzleKids.test(t) && /ravensburger|educa|anatolian|castorland|trefl|eurographics|black sea|heye|schmidt|art puzzle|magnolia|cherry/.test(t)) sub = "pazeli-za-vazrastni";
    return { category: "pazeli", sub };
  }
  if (RX.school.test(t)) return { category: "za-uchilishte", sub: null };
  if (RX.merch.test(t) && !RX.doll.test(t)) return { category: "aksesoari", sub: null };
  if (RX.boardGame.test(t) && !RX.baby.test(t)) return { category: "nastolni-igri", sub: null };

  if (RX.scooter.test(t)) return { category: "na-otkrito", sub: "trotinetki" };
  if (RX.bike.test(t)) return { category: "na-otkrito", sub: "kolela-i-triokolki" };
  if (RX.rideOn.test(t)) return { category: "na-otkrito", sub: "detski-koli-za-karane" };

  if (RX.puppet.test(t)) return { category: "plyusheni", sub: "kukli-za-teatar" };
  if (RX.doll.test(t)) {
    let sub = "drugi-kukli";
    if (RX.dollHouse.test(t)) sub = "kashti-i-aksesoari";
    else if (RX.dollBaby.test(t)) sub = "kukli-bebeta";
    else if (RX.dollFashion.test(t)) sub = "modni-kukli";
    return { category: "kukli", sub };
  }
  if (RX.baby.test(t)) return { category: "bebeshki", sub: null };
  if (RX.summer.test(t)) return { category: "na-otkrito", sub: "lyato-i-voda" };
  if (RX.blaster.test(t)) return { category: "blasteri", sub: null };
  if (RX.sport.test(t)) return { category: "na-otkrito", sub: "sport" };

  if (RX.lego.test(b) || RX.lego.test(name)) return { category: "konstruktori", sub: "lego" };
  if (RX.construct.test(t) || sourceCategory === "LEGO & Construction Sets") {
    return { category: "konstruktori", sub: RX.magnetic.test(t) ? "magnitni" : "drugi-konstruktori" };
  }
  if (RX.plush.test(t)) return { category: "plyusheni", sub: "plyusheni-igrachki" };
  if (RX.music.test(t)) return { category: "muzikalni", sub: null };
  if (/playmobil|плеймобил/i.test(t)) return { category: "figurki", sub: "playmobil" };
  if (RX.roleCart.test(t)) return { category: "rolevi-igri", sub: roleSub(t) };
  if (RX.vehicle.test(t)) {
    let sub = "drugi-prevozni";
    if (RX.rc.test(t)) sub = "radioupravlyaemi";
    else if (RX.track.test(t)) sub = "pisti-i-garazhi";
    else if (RX.diecast.test(t)) sub = "metalni-modeli";
    return { category: "prevozni-sredstva", sub };
  }
  if (RX.figure.test(t)) {
    let sub = "geroi-i-igralni-komplekti";
    if (RX.collectible.test(t)) sub = "kolektsionerski";
    else if (RX.animals.test(t)) sub = "zhivotni-i-dinozavri";
    return { category: "figurki", sub };
  }
  if (RX.educational.test(t)) return { category: "obrazovatelni", sub: null };
  if (RX.roleKitchen.test(t) || RX.roleTools.test(t) || RX.roleBeauty.test(t) || RX.roleCostume.test(t)) {
    return { category: "rolevi-igri", sub: roleSub(t) };
  }
  if (RX.interactive.test(t)) return { category: "interaktivni", sub: null };
  if (RX.figureWeak.test(t) || detectSeries(name, brand).length) return { category: "figurki", sub: "geroi-i-igralni-komplekti" };
  if (RX.wooden.test(t) || RX.woodenBrand.test(b)) return { category: "darveni", sub: null };
  if (RX.game.test(t) || sourceCategory === "Puzzles & Board Games" || sourceCategory.startsWith("Настолни игри")) {
    return { category: "nastolni-igri", sub: null };
  }
  return { category: "drugi-igrachki", sub: null };
}

export function extractPieces(name: string): number | null {
  const m = name.match(/(\d[\d\s.]{0,5})\s*(?:ел\.?|елемента|елемент|части|част|pcs|pieces|бр\.? части|парчета)(?![\p{L}])/iu);
  if (!m) return null;
  const n = parseInt(m[1].replace(/[\s.]/g, ""), 10);
  return Number.isFinite(n) && n > 1 && n < 100000 ? n : null;
}

// ---------------------------------------------------------------------------
// Characters / licensed series ("Любими герои"), matched on name + brand.
export type Series = { slug: string; name: string; re: RegExp };

export const SERIES: Series[] = [
  { slug: "pes-patrul", name: "Пес Патрул", re: kw("пес патрул", "paw patrol") },
  { slug: "frozen", name: "Замръзналото кралство", re: kw("замръзналото кралство", "frozen", "елза", "анна и елза") },
  { slug: "barbie", name: "Barbie", re: kw("barbie", "барби") },
  { slug: "hari-potar", name: "Хари Потър", re: kw("хари потър", "harry potter", "хогуортс", "hogwarts") },
  { slug: "star-wars", name: "Star Wars", re: kw("star wars", "междузвездни войни", "мандалорец", "mandalorian") },
  { slug: "marvel", name: "Marvel", re: kw("marvel", "марвел", "авенджърс", "avengers", "спайдърмен", "spider-?man", "спайди", "spidey", "капитан америка", "железния човек", "iron man", "хълк", "hulk", "тор(?![\\p{L}])") },
  { slug: "batman-dc", name: "Batman и DC", re: kw("батман", "batman", "супермен", "superman", "dc comics", "жената чудо", "wonder woman") },
  { slug: "disney-printsesi", name: "Дисни принцеси", re: kw("дисни принцес", "disney princess", "пепеляшка", "ариел", "рапунцел", "белл", "мулан", "моана", "moana") },
  { slug: "stitch", name: "Лило и Стич", re: kw("стич", "stitch") },
  { slug: "mickey-minnie", name: "Мики и Мини", re: kw("мики маус", "mickey", "мини маус", "minnie") },
  { slug: "peppa", name: "Пепа Пиг", re: kw("пепа", "peppa") },
  { slug: "bluey", name: "Блуи", re: kw("блуи", "bluey") },
  { slug: "gabby", name: "Gabby's Dollhouse", re: kw("gabby", "габи") },
  { slug: "minecraft", name: "Minecraft", re: kw("minecraft", "майнкрафт") },
  { slug: "pokemon", name: "Pokémon", re: kw("pok[eé]mon", "покемон", "пикачу", "pikachu") },
  { slug: "sonic", name: "Sonic", re: kw("sonic", "соник") },
  { slug: "jurassic-world", name: "Джурасик свят", re: kw("джурасик", "jurassic") },
  { slug: "transformers", name: "Transformers", re: kw("трансформър", "transformers") },
  { slug: "hot-wheels", name: "Hot Wheels", re: kw("hot wheels", "хот уийлс") },
  { slug: "cars", name: "Колите", re: kw("колите", "disney cars", "маккуин", "mcqueen") },
  { slug: "masha", name: "Маша и Мечока", re: kw("маша и мечока", "маша и", "masha") },
  { slug: "smurfs", name: "Смърфовете", re: kw("смърф", "smurf") },
  { slug: "hello-kitty", name: "Hello Kitty", re: kw("hello kitty", "хелоу кити") },
  { slug: "my-little-pony", name: "Малкото пони", re: kw("малкото пони", "my little pony") },
  { slug: "ninjago", name: "Ninjago", re: kw("ninjago", "нинджаго") },
  { slug: "tmnt", name: "Костенурките нинджа", re: kw("костенурките нинджа", "tmnt", "ninja turtles") },
  { slug: "super-mario", name: "Super Mario", re: kw("super mario", "супер марио", "марио(?![\\p{L}])", "mario(?![\\p{L}])") },
  { slug: "roblox", name: "Roblox", re: kw("roblox", "роблокс") },
  { slug: "toy-story", name: "Играта на играчките", re: kw("toy story", "играта на играчките", "бъз светлинна", "уди(?![\\p{L}])") },
  { slug: "minions", name: "Миньоните", re: kw("миньон", "minion") },
  { slug: "lol-surprise", name: "L.O.L. Surprise", re: kw("l\\.o\\.l", "lol surprise") },
  { slug: "monster-high", name: "Monster High", re: kw("monster high") },
  { slug: "rainbow-high", name: "Rainbow High", re: kw("rainbow high") },
  { slug: "cry-babies", name: "Cry Babies", re: kw("cry babies") },
  { slug: "miraculous", name: "Калинката и Черния котак", re: kw("miraculous", "калинката") },
  { slug: "baby-born", name: "Baby Born", re: kw("baby born", "беби борн") },
];

export const SERIES_BY_SLUG = new Map(SERIES.map((s) => [s.slug, s]));

export function detectSeries(name: string, brand: string): string[] {
  const t = `${name} ${brand}`;
  return SERIES.filter((s) => s.re.test(t)).map((s) => s.slug);
}

// ---------------------------------------------------------------------------
// Brand clean-up: the export spells the same brand several ways.
const NO_BRAND = new Set(["", "#n/a", "n/a", "other brands", "other", "toys", "no brand", "generic", "0", "-", "без марка", "noname"]);
const BRAND_OVERRIDES: Record<string, string> = {
  lego: "LEGO",
  rayatoys: "Raya Toys",
  vtech: "VTech",
  goki: "Goki",
  bigjigs: "Bigjigs",
  melissadoug: "Melissa & Doug",
  melissaanddoug: "Melissa & Doug",
  fisherprice: "Fisher-Price",
  ses: "SES Creative",
  sescreative: "SES Creative",
  rappa: "Rappa",
  star: "Star",
  zizito: "Zizito",
  simbatoys: "Simba",
  simba: "Simba",
  buba: "Buba",
  mga: "MGA",
  haba: "HABA",
  playgro: "Playgro",
  tinylove: "Tiny Love",
  littletikes: "Little Tikes",
  dickietoys: "Dickie Toys",
  bburago: "Bburago",
  kidslicensing: "Kids Licensing",
  buki: "Buki",
  bukifrance: "Buki",
  gamemovil: "Game Movil",
  thepuppetcompany: "The Puppet Company",
  liloandstitch: "Disney",
  frozen: "Disney",
};

export function brandKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9Ѐ-ӿ]+/g, "");
}

export function isNoBrand(raw: string): boolean {
  return NO_BRAND.has(raw.trim().toLowerCase());
}

export function brandOverride(key: string): string | undefined {
  return BRAND_OVERRIDES[key];
}
