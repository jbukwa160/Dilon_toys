// Estimated age, "for whom" and safety warnings of a toy, from its name, brand and category.
// The supplier file has no such data. These are estimates: the admin checks and corrects them
// (Admin → Продукти), and whatever the admin sets is never overwritten.
// Shared by the importer and the app, so no Node / server-only imports here.
import { WARNING_KEYS, type Audience, type InfoSource, type WarningKey } from "./toy-info";
import { extractPieces } from "./taxonomy";

export type ToyFacts = { name: string; brand: string | null; category: string; subcategory: string | null };
/** Months; max null = "and up". */
export type AgeGuess = { min: number | null; max: number | null; source: InfoSource | null };

/** A keyword must start a word (JS `\b` doesn't understand Cyrillic). */
function kw(...stems: string[]): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${stems.join("|")})`, "iu");
}

const text = (p: ToyFacts) => `${p.name} ${p.brand ?? ""}`.toLowerCase().replace(/\s+/g, " ");
const Y = (years: number) => years * 12;

// ---------------------------------------------------------------------------
// 1. Age written in the name

const NUM = "(?<![\\d.,x×х/+])(\\d{1,2})";
const MONTHS = "(?:м(?:ес(?:еца|\\.)?)?\\.?|months?|m)(?![\\p{L}])";
const YEARS = "(?:г\\.?|год(?:ини|\\.)?|години|годишн\\p{L}*|yrs?|years?)(?![\\p{L}])";
const RX_NAME = {
  monthsRange: new RegExp(`${NUM}\\s?[-–]\\s?(\\d{1,2})\\s?${MONTHS}`, "iu"),
  yearsRange: new RegExp(`${NUM}\\s?[-–]\\s?(\\d{1,2})\\s?${YEARS}`, "iu"),
  monthsPlus: new RegExp(`${NUM}\\s?${MONTHS.replace("(?![\\p{L}])", "")}\\s?\\+|${NUM}\\s?\\+\\s?${MONTHS}`, "iu"),
  fromYears: new RegExp(`(?<![\\p{L}])(?:над|от)\\s(\\d{1,2})\\s?${YEARS}`, "iu"),
  fromMonths: new RegExp(`(?<![\\p{L}])(?:над|от)\\s(\\d{1,2})\\s?(?:м\\.|мес\\.?|месеца)(?![\\p{L}])`, "iu"),
  // "3+", "(8+)" — not "16+2 цвята", "1+1", "3+ части", "група 0+"
  yearsPlus: new RegExp(`(?<![\\p{L}\\d.,x×х/+-])(\\d{1,2})\\s?\\+(?!\\s?\\d)(?!\\s?(?:ч\\.|част|ел\\.|бр|см|мм|кг|цв|мес|м\\b|m\\b))`, "iu"),
  notAge: kw("група \\d", "размер \\d{2,3}", "size \\d{2,3}"),
};

function ageFromName(name: string): AgeGuess | null {
  const t = name.toLowerCase();
  let m = t.match(RX_NAME.monthsRange);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a < b && b <= 72) return { min: a, max: b, source: "name" };
  }
  m = t.match(RX_NAME.yearsRange);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a < b && b <= 18) return { min: Y(a), max: Y(b), source: "name" };
  }
  m = t.match(RX_NAME.monthsPlus);
  if (m) {
    const n = Number(m[1] ?? m[2]);
    if (n <= 48) return { min: n, max: null, source: "name" };
  }
  m = t.match(RX_NAME.fromMonths);
  if (m && Number(m[1]) <= 48) return { min: Number(m[1]), max: null, source: "name" };
  m = t.match(RX_NAME.fromYears);
  if (m && Number(m[1]) <= 18) return { min: Y(Number(m[1])), max: null, source: "name" };
  m = t.match(RX_NAME.yearsPlus);
  if (m && !RX_NAME.notAge.test(t)) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 18) return { min: Y(n), max: null, source: "name" };
  }
  return null;
}

// ---------------------------------------------------------------------------
// 2. Brands, series and product types we know

const RX = {
  lego: /(?<![\p{L}])lego|лего/iu,
  duplo: kw("duplo", "дупло"),
  legoAdult: kw("icons", "iconic", "ideas", "architecture", "art(?![\\p{L}])", "botanical", "ботаническ", "за възрастни", "18\\s?\\+"),
  legoOld: kw("technic", "техник", "speed champions"),
  legoYoung: kw("spidey", "juniors", "4\\s?\\+", "disney princess", "gabby"),
  legoEight: kw("star wars", "междузвездни", "harry potter", "хари потър", "minecraft", "майнкрафт", "jurassic", "джурасик", "marvel", "super heroes", "batman", "avengers"),
  legoSeven: kw("creator", "dreamzzz"),
  legoSix: kw("ninjago", "нинджаго", "super mario", "dots", "animal crossing", "friends", "disney"),
  legoCity: kw("city", "сити"),
  legoClassic: kw("classic", "classsic", "класик"),
  playmobilBaby: kw("1\\.2\\.3", "junior"),
  blaster: kw("nerf", "нърф", "x-shot", "бластер"),
  waterGun: kw("воден пистолет", "водни пистолет", "water", "водн"),
  modelKit: kw("revell", "italeri", "airfix", "zvezda", "academy", "tamiya", "heller", "hobby boss", "trumpeter", "сглобяем модел"),
  modelKitJunior: kw("junior kit", "first construction", "джуниър", "junior"),
  babyBrand: kw("playgro", "tiny love", "lamaze", "taf toys", "infantino", "baby einstein", "sassy", "chicco", "canpol", "sophie la girafe"),
  babyWords: kw("бебе", "бебешк", "за бебета", "новороден", "дрънкалк", "гризалк", "залъгалк", "за най-малките", "за малчугани", "моята първа", "моят първи", "my first"),
  barbie: kw("barbie", "барби"),
  babyBorn: kw("baby born", "бейби борн"),
  cryBabies: kw("cry babies"),
  lol: kw("l\\.o\\.l", "lol surprise", "lol "),
  teenDolls: kw("rainbow high", "monster high"),
  hotWheels: kw("hot wheels", "хот уилс"),
  track: kw("писта", "track", "гараж", "set"),
  science: kw("химическ", "химия", "експеримент", "лаборатор", "микроскоп", "кристал", "вулкан", "научен комплект", "science"),
  robot: kw("програмир", "кодиране", "coding", "робот"),
  firstGame: kw("моята първа", "моят първи", "my first", "първа игра", "първи игри"),
  kidsGame: kw("мемори", "memory", "лото", "домино"),
  bigGame: kw("стратеги", "парти", "party", "activity", "dixit", "codenames", "alias", "табу", "catan", "каркасон", "carcassonne", "ticket to ride", "монопол", "monopoly", "scrabble", "скрабъл", "риск", "cluedo", "клуедо"),
  adult: kw("за възрастни", "18\\s?\\+"),
  playdough: kw("пластилин", "пластелин", "play[- ]?doh", "плей до", "моделин", "тесто за моделиране", "кинетичен пясък", "kinetic sand", "магически пясък"),
  beads: kw("мъниста", "гривн", "бижута", "шиене", "плетене"),
  fineCraft: kw("диамант", "гоблен", "бродер", "по номера", "string art"),
  slime: kw("слайм", "slime"),
  school: kw("детска градина"),
  keyring: kw("ключодържател", "клипс", "висулка"),
  scooterSmall: kw("триколесн", "3 колел", "мини", "mini", "primo", "baby"),
  balance: kw("балансиращ", "беговел", "balance"),
  tricycle: kw("триколк", "tricycle", "проходилк"),
  wheelSize: /(\d{2})\s?(?:["”″]|цола|инча|inch)/iu,
  rideOnPower: kw("акумулатор", "електрическ", "12v", "6v", "24v", "12 v", "6 v"),
  rideOnPush: kw("бутане", "проходилк", "push", "каталка"),
  sand: kw("пясък", "кофичк", "лопатк", "формички за пясък", "sand"),
  inflatable: kw("надуваем", "басейн", "пояс", "плувк", "шамандур", "дюшек", "ръкавел", "жилетка за плуване", "лодка"),
  trampoline: kw("батут", "trampoline"),
  ball: kw("топка", "ball"),
  makeup: kw("грим", "козметич", "лак за нокти", "маникюр", "червило", "сенки за очи", "make-?up", "гланц за устни"),
};

type Rule = (t: string, p: ToyFacts) => [number, number | null] | null;

/** Brand / series / type rules, first match wins → source "rule". */
const RULES: Rule[] = [
  (t) => {
    if (!RX.lego.test(t)) return null;
    if (RX.duplo.test(t)) return [18, 60];
    if (RX.legoAdult.test(t)) return [Y(18), null];
    if (RX.legoOld.test(t)) return [Y(9), null];
    if (RX.legoYoung.test(t)) return [Y(4), null];
    if (RX.legoEight.test(t)) return [Y(8), null];
    if (RX.legoSeven.test(t)) return [Y(7), null];
    if (RX.legoSix.test(t)) return [Y(6), null];
    if (RX.legoCity.test(t)) return [Y(5), null];
    if (RX.legoClassic.test(t)) return [Y(4), null];
    return [Y(6), null];
  },
  (t, p) => (p.subcategory === "playmobil" || /playmobil|плеймобил/i.test(t) ? (RX.playmobilBaby.test(t) ? [18, 48] : [Y(4), null]) : null),
  (t, p) => (p.subcategory === "blasteri" || RX.blaster.test(t) ? (RX.waterGun.test(t) ? [Y(3), null] : [Y(8), null]) : null),
  (t, p) => (p.subcategory === "boi-i-instrumenti" ? [Y(14), null] : null),
  (t, p) => (p.subcategory === "sglobyaemi-modeli" || RX.modelKit.test(t) ? (RX.modelKitJunior.test(t) ? [Y(4), null] : [Y(10), null]) : null),
  (t, p) => (RX.babyBrand.test(t) && (p.category === "bebeshki" || RX.babyWords.test(t)) ? [0, 36] : null),
  (t) => (RX.cryBabies.test(t) ? [18, null] : null),
  (t) => (RX.teenDolls.test(t) ? [Y(6), null] : null),
  (t) => (RX.barbie.test(t) || RX.babyBorn.test(t) || RX.lol.test(t) ? [Y(3), null] : null),
  (t) => (RX.hotWheels.test(t) ? (RX.track.test(t) ? [Y(4), null] : [Y(3), null]) : null),
  (t, p) => (RX.science.test(t) && ["nauka-i-eksperimenti", "tvorcheski-komplekti", "interaktivni"].includes(p.subcategory ?? "") ? [Y(8), null] : null),
  (t, p) => {
    if (!["detski-pazeli", "pazeli-za-vazrastni", "3d-pazeli"].includes(p.subcategory ?? "")) return null;
    const pieces = extractPieces(p.name);
    if (p.subcategory === "3d-pazeli") return pieces != null && pieces <= 40 ? [Y(6), null] : [Y(8), null];
    if (pieces == null) return null;
    const steps: [number, number][] = [[12, 24], [24, 36], [48, 48], [100, 60], [200, 72], [300, 96], [500, 120]];
    const hit = steps.find(([max]) => pieces <= max);
    return [hit ? hit[1] : Y(12), null];
  },
  (t, p) => {
    if (p.subcategory !== "nastolni-igri") return null;
    if (RX.adult.test(t)) return [Y(18), null];
    if (RX.firstGame.test(t)) return [Y(2), null];
    if (RX.kidsGame.test(t)) return [Y(3), null];
    if (RX.bigGame.test(t)) return [Y(8), null];
    return null;
  },
  (t, p) => {
    if (p.subcategory !== "trotinetki") return null;
    return RX.scooterSmall.test(t) ? [Y(2), null] : [Y(5), null];
  },
  (t, p) => {
    if (p.subcategory !== "kolela-i-triokolki") return null;
    if (RX.balance.test(t)) return [Y(2), Y(5)];
    if (RX.tricycle.test(t)) return [12, Y(4)];
    const size = Number(t.match(RX.wheelSize)?.[1]);
    const bySize: Record<number, number> = { 12: 36, 14: 48, 16: 60, 18: 72, 20: 84, 24: 108 };
    return bySize[size] ? [bySize[size], null] : null;
  },
  (t, p) => {
    if (p.subcategory !== "detski-koli-za-karane") return null;
    if (RX.rideOnPower.test(t)) return [Y(3), null];
    if (RX.rideOnPush.test(t)) return [12, Y(4)];
    return null;
  },
];

// ---------------------------------------------------------------------------
// 3. Typical age for the (sub)category → source "category"

const BY_SUB: Record<string, (t: string) => [number, number | null] | null> = {
  "igrachki-za-bebeta": () => [0, 36],
  lego: () => [Y(6), null],
  magnitni: () => [Y(3), null],
  "drugi-konstruktori": () => [Y(3), null],
  "modni-kukli": () => [Y(3), null],
  "kukli-bebeta": () => [Y(3), null],
  "kashti-i-aksesoari": () => [Y(3), null],
  "drugi-kukli": () => [Y(3), null],
  "plyusheni-igrachki": (t) => (RX.keyring.test(t) ? [Y(3), null] : [0, null]),
  "kukli-za-teatar": () => [Y(3), null],
  "metalni-modeli": () => [Y(3), null],
  radioupravlyaemi: (t) => (RX.babyWords.test(t) ? [Y(2), null] : [Y(6), null]),
  "pisti-i-garazhi": () => [Y(3), null],
  "drugi-prevozni": (t) => (RX.babyWords.test(t) ? [12, null] : [Y(3), null]),
  playmobil: () => [Y(4), null],
  "zhivotni-i-dinozavri": () => [Y(3), null],
  "geroi-i-igralni-komplekti": () => [Y(3), null],
  kolektsionerski: () => [Y(3), null],
  interaktivni: (t) => (RX.robot.test(t) ? [Y(5), null] : [Y(3), null]),
  "detski-pazeli": (t) => (/дървен/i.test(t) ? [Y(2), null] : [Y(3), null]),
  "pazeli-za-vazrastni": () => [Y(12), null],
  "3d-pazeli": () => [Y(8), null],
  "nastolni-igri": () => [Y(6), null],
  "tvorcheski-komplekti": (t) =>
    RX.playdough.test(t) ? [Y(3), null] : RX.fineCraft.test(t) ? [Y(7), null] : RX.slime.test(t) ? [Y(6), null] : RX.beads.test(t) ? [Y(5), null] : [Y(4), null],
  "sglobyaemi-modeli": () => [Y(10), null],
  "boi-i-instrumenti": () => [Y(14), null],
  "za-uchilishte": (t) => (RX.school.test(t) ? [Y(3), null] : [Y(6), null]),
  "nauka-i-eksperimenti": (t) => (RX.babyWords.test(t) ? [12, null] : [Y(5), null]),
  darveni: (t) => (RX.babyWords.test(t) ? [12, null] : [Y(3), null]),
  muzikalni: (t) => (RX.babyWords.test(t) ? [6, null] : [Y(3), null]),
  "kuhni-i-pazaruvane": () => [Y(3), null],
  "instrumenti-i-profesii": () => [Y(3), null],
  "krasota-i-moda": (t) => (RX.makeup.test(t) ? [Y(5), null] : [Y(3), null]),
  kostyumi: () => [Y(3), null],
  trotinetki: () => [Y(5), null],
  "kolela-i-triokolki": () => [Y(3), null],
  "detski-koli-za-karane": () => [18, null],
  "lyato-i-voda": (t) => (RX.inflatable.test(t) ? [Y(3), null] : RX.sand.test(t) ? [12, null] : [Y(3), null]),
  sport: (t) => (RX.trampoline.test(t) || RX.ball.test(t) ? [Y(3), null] : [Y(5), null]),
  blasteri: () => [Y(8), null],
  "detska-staya": () => null,
  "drugi-igrachki": () => [Y(3), null],
};

const BY_CATEGORY: Record<string, [number, number | null] | null> = {
  bebeshki: [0, 36],
  konstruktori: [Y(3), null],
  kukli: [Y(3), null],
  "prevozni-sredstva": [Y(3), null],
  figurki: [Y(3), null],
  pazeli: [Y(3), null],
  tvorchestvo: [Y(4), null],
  obrazovatelni: [Y(3), null],
  "rolevi-igri": [Y(3), null],
  "na-otkrito": [Y(3), null],
  aksesoari: null,
};

export function inferAge(p: ToyFacts): AgeGuess {
  const fromName = ageFromName(p.name);
  if (fromName) return fromName;
  const t = text(p);
  for (const rule of RULES) {
    const r = rule(t, p);
    if (r) return { min: r[0], max: r[1], source: "rule" };
  }
  const bySub = p.subcategory ? BY_SUB[p.subcategory] : undefined;
  const r = bySub ? bySub(t) : BY_CATEGORY[p.category];
  return r ? { min: r[0], max: r[1], source: "category" } : { min: null, max: null, source: null };
}

// ---------------------------------------------------------------------------
// For whom. Only clearly themed toys get "boys" / "girls"; everything else is for everyone.

const GIRLS = kw(
  "barbie", "барби", "l\\.o\\.l", "lol surprise", "gabby", "габи", "rainbow high", "monster high", "cry babies", "baby born", "бейби борн",
  "my little pony", "малкото пони", "еднорог", "unicorn", "принцес", "princess", "frozen", "замръзналото", "елза", "hello kitty", "polly pocket",
  "enchantimals", "русалк", "mermaid", "фея", "феи", "балерин", "грим", "маникюр", "лак за нокти", "козметич", "бижу", "гривн", "мъниста",
  "прическ", "фризьор", "модни кукли", "модна кукла", "кукла", "кукли(?! за)", "количка за кукл", "къща за кукл", "lego®? friends", "minnie", "мини маус",
  "шопкинс", "shopkins", "na! na! na!", "bratz", "братц",
);
const BOYS = kw(
  "nerf", "нърф", "x-shot", "бластер", "transformers", "трансформър", "batman", "батман", "spider-?man", "спайдърмен", "spidey", "avengers",
  "отмъстителите", "авенджърс", "ninjago", "нинджаго", "star wars", "междузвездни войни", "hot wheels", "хот уилс", "monster truck", "monster jam",
  "военн", "танк", "войници", "jurassic", "джурасик", "t-rex", "багер", "булдозер", "самосвал", "бетонобъркачка", "трактор", "полицейск", "пожарн",
  "technic", "speed champions", "minecraft", "майнкрафт", "sonic", "соник",
);
const GIRL_SUBS = new Set(["modni-kukli", "kukli-bebeta", "kashti-i-aksesoari", "krasota-i-moda"]);
const BOY_SUBS = new Set(["metalni-modeli", "radioupravlyaemi", "pisti-i-garazhi", "drugi-prevozni", "blasteri"]);
const NEUTRAL = kw("кукли за куклен театър", "куклен театър", "пъзел", "puzzle", "мемори", "домино");

export function inferAudience(p: ToyFacts): { audience: Audience; source: InfoSource } {
  // Baby toys are for everyone, whatever their colour or character.
  if (p.category === "bebeshki") return { audience: "all", source: "category" };
  const t = text(p);
  const girls = GIRLS.test(t) && !/за кукли[\p{L}]*\s+театър/iu.test(t);
  const boys = BOYS.test(t);
  if (girls !== boys && !(p.subcategory === "kukli-za-teatar")) {
    // A themed puzzle or memory game is still for everyone unless the theme is very clear.
    if (!NEUTRAL.test(t) || /barbie|барби|l\.o\.l|nerf|нърф|transformers/i.test(t)) return { audience: girls ? "girls" : "boys", source: "name" };
  }
  if (!girls && !boys && p.subcategory) {
    if (GIRL_SUBS.has(p.subcategory)) return { audience: "girls", source: "category" };
    if (BOY_SUBS.has(p.subcategory)) return { audience: "boys", source: "category" };
  }
  return { audience: "all", source: "category" };
}

// ---------------------------------------------------------------------------
// Safety warnings (toy-info.ts has the texts)

const W = {
  // "балони" (latex) — not "балончета" (soap bubbles)
  balloons: /(?<![\p{L}])балон(?:и|а)?(?![\p{L}])/iu,
  // Products that only mention a balloon (a doll "in a balloon", a hot-air balloon set, a picture of balloons).
  notLatex: kw("фолио", "фолиев", "сапунен", "сапунени", "lego", "кукла", "l\\.o\\.l", "рисуван", "по номера", "пъзел", "галерия", "книжк", "фигур", "с горещ въздух", "въздушен балон", "playmobil", "полет с балон"),
  magnets: kw("магнит"),
  batteries: kw(
    "батери", "радиоуправляем", "р/у", "r/c", "rc ", "дистанционн", "интерактивн", "говорещ", "светлини и звуци", "звуци и светлини", "със звук",
    "със светлини", "акумулатор", "електрическ", "робот", "уоки", "walkie", "прожектор", "фенер", "часовник", "фотоапарат", "kidizoom",
  ),
  buttonBattery: kw("копче", "cr20\\d\\d", "cr16\\d\\d", "lr4\\d", "ag1\\d", "бутонна батери"),
  water: kw("надуваем", "плувк", "пояс за плуване", "пояс", "ръкавел", "шамандур", "жилетка за плуване", "дюшек", "басейн"),
  protective: kw("кънки", "ролери", "ролкови", "скейтборд", "skateboard", "тротинетк", "скутер", "ховърборд", "hoverboard", "колело", "велосипед", "балансиращ", "беговел", "триколк"),
  crib: kw("въртележка", "за креватче", "за количка", "висяща играчка", "спирала за количка", "за кошара", "мобил за креват"),
  makeup: RX.makeup,
  chemistry: RX.science,
  slime: RX.slime,
  trampoline: RX.trampoline,
  food: kw("яйце с изненада", "kinder", "шоколадово яйце", "с бонбони", "бонбони с играчка", "близалка с играчка", "дъвки с"),
  dryPool: kw("с топки", "сух басейн", "топки за басейн"),
  cribToy: kw("играчк", "въртележк", "висящ", "спирал", "мобил", "дрънкалк", "проектор"),
  // Accessories, not toys.
  notToy: kw("чадър", "раница", "чанта", "стойк", "държач", "органайзер", "покривало", "аксесоар", "стикер", "звънец", "кошниц", "каска", "калъф"),
};

export function inferWarnings(p: ToyFacts, ageMin: number | null): WarningKey[] {
  const t = text(p);
  const sub = p.subcategory ?? "";
  const out = new Set<WarningKey>();
  if (ageMin != null && ageMin >= 36) out.add("under3");
  if (W.balloons.test(t) && !W.notLatex.test(t)) out.add("balloons");
  if (W.magnets.test(t)) out.add("magnets");
  if (sub === "radioupravlyaemi" || sub === "interaktivni" || W.batteries.test(t) || (sub === "detski-koli-za-karane" && RX.rideOnPower.test(t))) out.add("batteries");
  if (W.buttonBattery.test(t)) out.add("buttonBattery");
  if (W.water.test(t) && !W.dryPool.test(t) && (sub === "lyato-i-voda" || sub === "sport")) out.add("water");
  if (W.protective.test(t) && p.category === "na-otkrito" && !RX.lego.test(t) && !W.notToy.test(t)) out.add("protective");
  if (W.crib.test(t) && p.category === "bebeshki" && W.cribToy.test(t) && !W.notToy.test(t)) out.add("crib");
  if (W.makeup.test(t)) out.add("cosmetic");
  if (W.chemistry.test(t) && ["nauka-i-eksperimenti", "tvorcheski-komplekti", "interaktivni"].includes(sub)) {
    out.add("chemistry");
    out.add("supervision");
  }
  if (W.slime.test(t) || W.trampoline.test(t)) out.add("supervision");
  if (W.food.test(t)) out.add("food");
  return WARNING_KEYS.filter((k) => out.has(k));
}
