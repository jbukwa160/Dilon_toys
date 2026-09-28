"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, Eye, EyeOff, LayoutGrid, Package, Plus, Trash2 } from "lucide-react";
import { CATEGORY_ICONS, type CategoryEntry, type SubCategoryEntry } from "@/lib/category-config";
import { contrastText } from "@/lib/settings-types";
import { slugify } from "@/lib/slug";
import { saveCategoriesAction, type CategoriesInput } from "@/app/admin/_actions/categories";
import { CategoryIcon, CATEGORY_ICON_COMPONENTS } from "@/components/CategoryIcon";
import { Card, ColorField, Field, ImageField, SaveBar, TextInput, useEditor } from "./ui";

type Props = { initial: CategoryEntry[]; counts: Record<string, number>; autoImages: Record<string, string> };

function move<T>(list: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const out = [...list];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

/** A free address for a new category / subcategory (they all live under /kategoria/…). */
function freeSlug(name: string, taken: Set<string>): string {
  const base = slugify(name, 50) || "kategoria";
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

export function CategoriesEditor({ initial, counts, autoImages }: Props) {
  const router = useRouter();
  const ed = useEditor<CategoriesInput>({ categories: initial, moves: {} }, async (v) => {
    const r = await saveCategoriesAction(v);
    if (r.ok) router.refresh();
    return r;
  });
  const cats = ed.value.categories;
  const [open, setOpen] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  // Addresses that exist (or were used by categories deleted but not saved yet).
  const taken = new Set([...initial, ...cats].flatMap((c) => [c.slug, ...c.subs.map((s) => s.slug)]));

  const setCats = (fn: (c: CategoryEntry[]) => CategoryEntry[]) => ed.setValue((v) => ({ ...v, categories: fn(v.categories) }));
  const update = (slug: string, patch: Partial<CategoryEntry>) => setCats((list) => list.map((c) => (c.slug === slug ? { ...c, ...patch } : c)));
  const count = (slug: string) => counts[slug] ?? 0;

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    const slug = freeSlug(name, taken);
    setCats((list) => [
      ...list,
      { slug, name, tagline: "", color: "#e3f3fd", accent: "#0284c7", icon: "gift", image: "", hidden: false, builtIn: false, subs: [] },
    ]);
    setNewName("");
    setOpen(slug);
  };

  const remove = (c: CategoryEntry, moveTo: string) => {
    ed.setValue((v) => ({
      categories: v.categories.filter((x) => x.slug !== c.slug),
      moves: moveTo ? { ...v.moves, [c.slug]: moveTo } : v.moves,
    }));
    setOpen(null);
  };

  const visible = cats.filter((c) => !c.hidden);

  return (
    <>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Card
            title="Категории в менюто"
            description="Подредени както в бутона „Всички категории“. Натиснете категория, за да я промените."
          >
            <ol className="space-y-2">
              {cats.map((c, i) => {
                const isOpen = open === c.slug;
                const n = count(c.slug);
                return (
                  <li key={c.slug} className={clsx("rounded-2xl border-2", isOpen ? "border-ink" : "border-line", c.hidden && !isOpen && "bg-canvas")}>
                    <div className="flex flex-wrap items-center gap-3 p-3">
                      <button type="button" onClick={() => setOpen(isOpen ? null : c.slug)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={isOpen}>
                        <span className={clsx("grid h-11 w-11 shrink-0 place-items-center rounded-xl", c.hidden && "opacity-50")} style={{ background: c.color, color: c.accent }}>
                          <CategoryIcon icon={c.icon} slug={c.slug} className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={clsx("block truncate font-black", c.hidden && "text-muted")}>{c.name || "Без име"}</span>
                          <span className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-muted">
                            <span>{n.toLocaleString("bg-BG")} продукта</span>
                            {c.subs.length ? <span>· {c.subs.length} подкатегории</span> : null}
                            {c.hidden ? <span className="rounded-full bg-ink px-2 py-0.5 text-white">Скрита</span> : null}
                            {!c.builtIn ? <span className="rounded-full bg-sky-soft px-2 py-0.5 text-sky">Добавена от вас</span> : null}
                            {!n && !c.hidden ? <span className="rounded-full bg-sun-soft px-2 py-0.5 text-ink">Празна — не се вижда в сайта</span> : null}
                          </span>
                        </span>
                        <ChevronDown className={clsx("h-5 w-5 shrink-0 text-muted transition", isOpen && "rotate-180")} />
                      </button>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => update(c.slug, { hidden: !c.hidden })}
                          className={clsx("grid h-9 w-9 place-items-center rounded-lg border", c.hidden ? "border-ink bg-ink text-white" : "border-line hover:border-ink")}
                          aria-label={c.hidden ? `Покажи „${c.name}“ в менюто` : `Скрий „${c.name}“ от менюто`}
                          aria-pressed={c.hidden}
                          title={c.hidden ? "Скрита — натиснете, за да се показва" : "Показва се — натиснете, за да я скриете"}
                        >
                          {c.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button type="button" disabled={i === 0} onClick={() => setCats((l) => move(l, i, -1))} className="grid h-9 w-9 place-items-center rounded-lg border border-line hover:border-ink disabled:opacity-30" aria-label={`„${c.name}“ по-нагоре`}>
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button type="button" disabled={i === cats.length - 1} onClick={() => setCats((l) => move(l, i, 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-line hover:border-ink disabled:opacity-30" aria-label={`„${c.name}“ по-надолу`}>
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {isOpen ? (
                      <CategoryPanel
                        c={c}
                        counts={counts}
                        autoImage={autoImages[c.slug] ?? ""}
                        others={cats.filter((x) => x.slug !== c.slug)}
                        taken={taken}
                        onChange={(patch) => update(c.slug, patch)}
                        onRemove={(moveTo) => remove(c, moveTo)}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ol>

            <div className="mt-5 flex flex-wrap gap-2 rounded-2xl bg-canvas p-3">
              <TextInput
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    add();
                  }
                }}
                placeholder="Име на нова категория, напр. Коледни играчки"
                maxLength={60}
                className="min-w-0 flex-1"
                aria-label="Име на нова категория"
              />
              <button type="button" onClick={add} disabled={!newName.trim()} className="btn btn-primary h-12 px-5 !shadow-none">
                <Plus className="h-5 w-5" strokeWidth={3} /> Добави категория
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6">
          <Card title="Преглед" description="Така изглежда списъкът в бутона „Всички категории“.">
            <div className="overflow-hidden rounded-2xl border border-line bg-canvas py-2">
              <p className="mx-2 mb-1 flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-extrabold text-white">
                <LayoutGrid className="h-4 w-4" /> Всички категории
              </p>
              <ul>
                {visible.map((c) => (
                  <li key={c.slug} className={clsx("mx-2 flex items-center gap-3 rounded-xl px-3 py-1.5 text-[0.9rem] font-bold", !count(c.slug) && "opacity-40")}>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ background: c.color, color: c.accent }}>
                      <CategoryIcon icon={c.icon} slug={c.slug} className="h-4 w-4" />
                    </span>
                    <span className="truncate">{c.name}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-3 text-sm text-muted">Празните категории не се показват в сайта, докато не сложите продукти в тях.</p>
          </Card>
          <Card title="Как да сложа продукти в категория?">
            <ul className="space-y-2 text-sm text-ink-soft">
              <li>
                <b>Един продукт:</b> Продукти → „Редактирай“ → поле „Категория“.
              </li>
              <li>
                <b>Много наведнъж:</b> в{" "}
                <Link href="/admin/produkti" className="font-bold text-sky hover:underline">
                  Продукти
                </Link>{" "}
                ги потърсете, отметнете ги и натиснете „Премести в категория“.
              </li>
            </ul>
          </Card>
        </div>
      </div>

      <SaveBar dirty={ed.dirty} pending={ed.pending} status={ed.status} onSave={ed.submit} onReset={ed.reset} />
    </>
  );
}

function CategoryPanel({
  c,
  counts,
  autoImage,
  others,
  taken,
  onChange,
  onRemove,
}: {
  c: CategoryEntry;
  counts: Record<string, number>;
  autoImage: string;
  others: CategoryEntry[];
  taken: Set<string>;
  onChange: (patch: Partial<CategoryEntry>) => void;
  onRemove: (moveTo: string) => void;
}) {
  const [subName, setSubName] = useState("");
  const [moveTo, setMoveTo] = useState("");
  const n = counts[c.slug] ?? 0;
  const setSub = (slug: string, patch: Partial<SubCategoryEntry>) => onChange({ subs: c.subs.map((s) => (s.slug === slug ? { ...s, ...patch } : s)) });
  const addSub = () => {
    const name = subName.trim();
    if (!name) return;
    onChange({ subs: [...c.subs, { slug: freeSlug(name, taken), name, hidden: false, builtIn: false }] });
    setSubName("");
  };

  return (
    <div className="space-y-6 border-t border-line p-4 md:p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Име">
          <TextInput value={c.name} onChange={(e) => onChange({ name: e.target.value })} maxLength={60} />
        </Field>
        <Field label="Кратък текст" hint="Показва се в менюто и най-горе на страницата на категорията.">
          <TextInput value={c.tagline} onChange={(e) => onChange({ tagline: e.target.value })} maxLength={120} placeholder="напр. За малки и големи строители" />
        </Field>
      </div>

      <Field label="Иконка" group>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Иконка">
          {CATEGORY_ICONS.map((name) => {
            const Icon = CATEGORY_ICON_COMPONENTS[name];
            const on = c.icon === name;
            return (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={name}
                onClick={() => onChange({ icon: name })}
                className={clsx("grid h-10 w-10 place-items-center rounded-xl border-2 transition", on ? "border-ink" : "border-transparent hover:border-line")}
                style={on ? { background: c.color, color: c.accent } : undefined}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr_220px]">
        <Field label="Цвят на фона" group>
          <ColorField value={c.color} onChange={(v) => onChange({ color: v })} presets={["#fff4d1", "#ffe8e3", "#e3f3fd", "#e2f6eb", "#efeaff", "#fde2ef", "#f1f5f9", "#1d2340"]} />
        </Field>
        <Field label="Цвят на текста и иконката" group>
          <ColorField value={c.accent} onChange={(v) => onChange({ accent: v })} presets={["#f0503a", "#d97706", "#0284c7", "#1fa463", "#7552f5", "#db2777", "#475569", "#ffffff"]} />
        </Field>
        <div>
          <span className="mb-1.5 block text-sm font-extrabold">Така изглежда</span>
          <div className="rounded-3xl p-4" style={{ background: c.color }}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/80" style={{ color: c.accent }}>
              <CategoryIcon icon={c.icon} slug={c.slug} className="h-5 w-5" />
            </span>
            <span className="mt-3 block font-black leading-tight" style={{ color: c.accent }}>
              {c.name || "Без име"}
            </span>
            <span className="text-sm font-semibold" style={{ color: contrastText(c.color) === "#ffffff" ? "rgba(255,255,255,.75)" : "rgba(29,35,64,.6)" }}>
              {n.toLocaleString("bg-BG")} продукта
            </span>
          </div>
        </div>
      </div>

      <Field label="Снимка" group hint={c.image ? undefined : "Празно = снимка на най-популярния продукт в категорията."}>
        <div className="flex flex-wrap items-center gap-4">
          <ImageField value={c.image} onChange={(v) => onChange({ image: v })} compact recommended="Квадратна снимка на играчка на бял или прозрачен фон." />
          {!c.image && autoImage ? (
            <span className="flex items-center gap-2 text-sm text-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={autoImage} alt="" referrerPolicy="no-referrer" className="h-14 w-14 rounded-xl border border-line bg-white object-contain p-1" /> Сега се показва тази
            </span>
          ) : null}
        </div>
      </Field>

      <Field label="Подкатегории" group hint="Показват се, когато посетителят посочи категорията в менюто. Скритите и празните не се показват.">
        {c.subs.length ? (
          <ul className="space-y-2">
            {c.subs.map((s, i) => (
              <li key={s.slug} className="flex flex-wrap items-center gap-2">
                <TextInput value={s.name} onChange={(e) => setSub(s.slug, { name: e.target.value })} maxLength={60} className={clsx("min-w-0 flex-1", s.hidden && "!text-muted")} aria-label={`Име на подкатегория ${i + 1}`} />
                <span className="w-24 text-right text-xs font-bold text-muted">{(counts[s.slug] ?? 0).toLocaleString("bg-BG")} продукта</span>
                <button
                  type="button"
                  onClick={() => setSub(s.slug, { hidden: !s.hidden })}
                  className={clsx("grid h-10 w-10 place-items-center rounded-lg border", s.hidden ? "border-ink bg-ink text-white" : "border-line hover:border-ink")}
                  aria-label={s.hidden ? `Покажи „${s.name}“` : `Скрий „${s.name}“`}
                  aria-pressed={s.hidden}
                >
                  {s.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button type="button" disabled={i === 0} onClick={() => onChange({ subs: move(c.subs, i, -1) })} className="grid h-10 w-10 place-items-center rounded-lg border border-line hover:border-ink disabled:opacity-30" aria-label="Нагоре">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" disabled={i === c.subs.length - 1} onClick={() => onChange({ subs: move(c.subs, i, 1) })} className="grid h-10 w-10 place-items-center rounded-lg border border-line hover:border-ink disabled:opacity-30" aria-label="Надолу">
                  <ArrowDown className="h-4 w-4" />
                </button>
                {!s.builtIn ? (
                  <button
                    type="button"
                    onClick={() => {
                      const k = counts[s.slug] ?? 0;
                      if (!k || confirm(`Продуктите от „${s.name}“ (${k}) ще останат в „${c.name}“ без подкатегория. Да изтрия ли подкатегорията?`)) {
                        onChange({ subs: c.subs.filter((x) => x.slug !== s.slug) });
                      }
                    }}
                    className="grid h-10 w-10 place-items-center rounded-lg text-brand hover:bg-brand-soft"
                    aria-label={`Изтрий „${s.name}“`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="w-10" />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Няма подкатегории.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <TextInput
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSub();
              }
            }}
            placeholder="Нова подкатегория"
            maxLength={60}
            className="min-w-0 flex-1"
            aria-label="Име на нова подкатегория"
          />
          <button type="button" onClick={addSub} disabled={!subName.trim()} className="btn btn-ghost h-12 px-4">
            <Plus className="h-4 w-4" strokeWidth={3} /> Добави подкатегория
          </button>
        </div>
      </Field>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <Link href={`/admin/produkti?kat=${c.slug}`} className="btn btn-ghost h-10 px-4 text-sm">
          <Package className="h-4 w-4" /> Продуктите в категорията
        </Link>
        {n ? (
          <a href={`/kategoria/${c.slug}`} target="_blank" rel="noopener" className="btn btn-ghost h-10 px-4 text-sm">
            <ExternalLink className="h-4 w-4" /> Виж в сайта
          </a>
        ) : null}
        <span className="text-xs text-muted">Адрес: /kategoria/{c.slug} — не се променя при ново име.</span>
      </div>

      {!c.builtIn ? (
        <div className="rounded-2xl border-2 border-brand/20 bg-brand-soft/40 p-4">
          <p className="font-black">Изтриване на категорията</p>
          {n ? (
            <>
              <p className="mt-1 text-sm text-ink-soft">В нея има {n.toLocaleString("bg-BG")} продукта. Изберете къде да отидат:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)} className="field min-w-0 flex-1 cursor-pointer" aria-label="Премести продуктите в">
                  <option value="">— Изберете категория —</option>
                  {others.map((o) => (
                    <option key={o.slug} value={o.slug}>
                      {o.name}
                    </option>
                  ))}
                </select>
                <button type="button" disabled={!moveTo} onClick={() => onRemove(moveTo)} className="btn h-12 bg-brand px-5 text-white hover:bg-brand-dark">
                  <Trash2 className="h-4 w-4" /> Премести и изтрий
                </button>
              </div>
            </>
          ) : (
            <button type="button" onClick={() => confirm(`Да изтрия ли „${c.name}“?`) && onRemove("")} className="btn mt-2 h-10 bg-brand px-4 text-sm text-white hover:bg-brand-dark">
              <Trash2 className="h-4 w-4" /> Изтрий категорията
            </button>
          )}
          <p className="mt-2 text-xs text-muted">Изтриването става окончателно, когато натиснете „Запази промените“.</p>
        </div>
      ) : (
        <p className="text-xs text-muted">Основните категории не могат да се изтриват (към тях автоматично се подреждат новите продукти от файла), но можете да ги скриете.</p>
      )}
    </div>
  );
}
