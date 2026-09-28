// Age, "for whom" and safety warnings of a toy: the fixed lists and their texts.
// Shared by the site, the admin and the importer (no server-only imports).
//
// Ages are stored in months (age_min / age_max); age_max null = "and up".
// The warnings follow the toy safety rules (Directive 2009/48/EC, EN 71): they must be visible on the
// product page before the order, not only on the box.

export const WARNING_KEYS = [
  "under3",
  "supervision",
  "balloons",
  "magnets",
  "batteries",
  "buttonBattery",
  "water",
  "protective",
  "crib",
  "cosmetic",
  "chemistry",
  "food",
] as const;
export type WarningKey = (typeof WARNING_KEYS)[number];

export const WARNINGS: Record<WarningKey, { label: string; text: string }> = {
  under3: {
    label: "Не е подходящо за деца под 36 месеца",
    text: "Не е подходящо за деца под 36 месеца. Съдържа малки части — опасност от задавяне.",
  },
  supervision: {
    label: "Под надзор на възрастен",
    text: "Да се използва под пряк надзор на възрастен.",
  },
  balloons: {
    label: "Латексови балони",
    text: "Внимание! Деца под 8-годишна възраст могат да се задушат с ненадути или спукани балони. Необходим е надзор от възрастен. Съхранявайте ненадутите балони далеч от деца и изхвърляйте спуканите балони незабавно.",
  },
  magnets: {
    label: "Съдържа магнити",
    text: "Внимание! Съдържа магнити. Погълнатите магнити могат да се привлекат един към друг в червата и да причинят сериозни наранявания. При поглъщане на магнит потърсете незабавно лекар.",
  },
  batteries: {
    label: "Работи с батерии",
    text: "Батериите се поставят и сменят от възрастен. Не смесвайте стари и нови батерии или батерии от различен вид. Изваждайте изтощените батерии от играчката.",
  },
  buttonBattery: {
    label: "Батерия тип „копче“",
    text: "Внимание! Съдържа батерия тип „копче“. При поглъщане може за часове да причини тежки вътрешни изгаряния. Пазете новите и използваните батерии далеч от деца. При съмнение за поглъщане потърсете незабавно лекар.",
  },
  water: {
    label: "Играчка за вода",
    text: "Да се използва само във вода, в която детето стъпва, и под надзора на възрастен. Не предпазва от удавяне.",
  },
  protective: {
    label: "С предпазни средства",
    text: "Да се използва с предпазни средства (каска, наколенки, налакътници). Да не се използва на пътното платно.",
  },
  crib: {
    label: "Играчка за креватче или количка",
    text: "За да се избегнат наранявания от заплитане, отстранете играчката, когато детето започне да се изправя на ръце и колене в положение за пълзене.",
  },
  cosmetic: {
    label: "Козметичен комплект",
    text: "Да се използва под надзора на възрастен. Да не се поглъща. При раздразнение на кожата преустановете употребата.",
  },
  chemistry: {
    label: "Химикали и експерименти",
    text: "Внимание! Съдържа вещества, които могат да бъдат опасни. Само за деца над посочената възраст и под пряк надзор на възрастен. Прочетете инструкциите преди употреба.",
  },
  food: {
    label: "Играчка в храна",
    text: "Съдържа играчка. Препоръчва се надзор от възрастен.",
  },
};

/** Products that need the "separate collection" note (crossed-out bin): electrical / battery toys. */
export function needsWeeeNote(warnings: readonly string[]): boolean {
  return warnings.includes("batteries") || warnings.includes("buttonBattery");
}

// ---------------------------------------------------------------------------
// Age

/** Filter buckets (months, max exclusive). A product fits a bucket if its age range overlaps it. */
export const AGE_BUCKETS = [
  { key: "0-12m", label: "0–12 месеца", min: 0, max: 12 },
  { key: "1-3", label: "1–3 години", min: 12, max: 36 },
  { key: "3-5", label: "3–5 години", min: 36, max: 60 },
  { key: "5-8", label: "5–8 години", min: 60, max: 96 },
  { key: "8-12", label: "8–12 години", min: 96, max: 144 },
  { key: "12+", label: "Над 12 години", min: 144, max: 1200 },
] as const;
export type AgeBucketKey = (typeof AGE_BUCKETS)[number]["key"];

/**
 * For the age filter an open-ended "3+" toy counts for this many months after its minimum age
 * (a 3+ puzzle is technically fine for a 12-year-old, but not what their parent is looking for).
 */
export const OPEN_AGE_SPAN = 60;

/** Choices for the admin's age fields (months). */
export const AGE_CHOICES: { months: number; label: string }[] = [
  { months: 0, label: "от раждането" },
  ...[3, 6, 9, 12, 18].map((m) => ({ months: m, label: `${m} месеца` })),
  ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18].map((y) => ({ months: y * 12, label: `${y} години` })),
];

function unit(months: number): string {
  if (months === 12) return "1 година";
  return months % 12 === 0 ? `${months / 12} години` : `${months} месеца`;
}

/** "от 3 години", "от 6 месеца", "3–8 години", "0–36 месеца". Null when unknown. */
export function formatAge(min: number | null, max: number | null): string | null {
  if (min == null) return null;
  if (max == null) return min === 0 ? "от раждането" : `от ${unit(min)}`;
  if (max <= 36) return `${min}–${max} месеца`;
  if (min % 12 === 0 && max % 12 === 0) return `${min / 12}–${max / 12} години`;
  return `от ${unit(min)} до ${unit(max)}`;
}

/** Short badge for product cards: "3+", "18м+", "0–3". */
export function ageBadge(min: number | null): string | null {
  if (min == null) return null;
  if (min < 24 && min % 12 !== 0) return `${min}м+`;
  if (min === 0) return "0+";
  return `${Math.floor(min / 12)}+`;
}

// ---------------------------------------------------------------------------
// For whom

export const AUDIENCES = { boys: "За момчета", girls: "За момичета", all: "За всички" } as const;
export type Audience = keyof typeof AUDIENCES;
/** URL values of the filter (?za=…). */
export const AUDIENCE_PARAM: Record<Audience, string> = { boys: "momcheta", girls: "momicheta", all: "vsichki" };

/** Where an age / audience / warning list came from (the admin sees it, to know what to check). */
export type InfoSource = "name" | "rule" | "category" | "admin";
