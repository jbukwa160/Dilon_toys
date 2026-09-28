"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowDown, ArrowUp, ExternalLink, LoaderCircle, Plus, RotateCcw, Sparkles, Star, Trash2, Upload, X } from "lucide-react";
import type { ProductPayload } from "@/lib/admin/validate";
import {
  createProductAction,
  deleteProductAction,
  resetToyInfoAction,
  restoreProductAction,
  saveProductAction,
  uploadImageAction,
} from "@/app/admin/_actions/products";
import { AGE_CHOICES, AUDIENCES, WARNINGS, WARNING_KEYS, formatAge, type InfoSource } from "@/lib/toy-info";
import { SafetyIcon } from "@/components/product/SafetyIcon";
import { Card, Field, MoneyInput, SaveBar, TextArea, TextInput, Toggle, useUnsavedWarning, type SaveStatus } from "./ui";

export type ProductFormInitial = ProductPayload & {
  id?: number;
  sku?: string;
  slug?: string;
  canRestore?: boolean;
  custom?: boolean;
  demoPrice?: boolean;
  toySource?: { age: InfoSource | null; audience: InfoSource | null; warnings: InfoSource | null };
};

const SOURCE_LABEL: Record<InfoSource, string> = {
  name: "определено от името",
  rule: "определено автоматично",
  category: "приблизително — по категорията",
  admin: "зададено от вас",
};

function SourceTag({ source }: { source: InfoSource | null | undefined }) {
  if (!source) return null;
  return (
    <span className={clsx("rounded-full px-2 py-0.5 text-xs font-bold", source === "admin" ? "bg-mint-soft text-mint" : "bg-sun-soft text-ink")}>
      {SOURCE_LABEL[source]}
    </span>
  );
}

function discount(price: string, old: string): number | null {
  const p = parseFloat(price.replace(",", "."));
  const o = parseFloat(old.replace(",", "."));
  if (!(p > 0) || !(o > p)) return null;
  return Math.round((1 - p / o) * 100);
}

function ImagesEditor({ images, onChange, error }: { images: string[]; onChange: (v: string[]) => void; error?: string }) {
  const [pending, start] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const file = useRef<HTMLInputElement>(null);

  const move = (i: number, d: number) => {
    const next = [...images];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };
  const upload = (files: FileList) =>
    start(async () => {
      setUploadError(null);
      const added: string[] = [];
      for (const f of Array.from(files).slice(0, 12)) {
        const fd = new FormData();
        fd.append("file", f);
        const r = await uploadImageAction(fd);
        if (r.url) added.push(r.url);
        else setUploadError(r.error ?? "Качването не успя.");
      }
      if (added.length) onChange([...images, ...added]);
    });

  return (
    <div>
      {images.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((src, i) => (
            <li key={src + i} className={clsx("relative rounded-2xl border-2 bg-white p-2", i === 0 ? "border-brand" : "border-line")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" referrerPolicy="no-referrer" className="aspect-square w-full object-contain" />
              {i === 0 ? <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-xs font-extrabold text-white">Главна</span> : null}
              <div className="mt-2 flex justify-center gap-1">
                {i > 0 ? (
                  <button type="button" onClick={() => move(i, -i)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-canvas" title="Направи главна" aria-label="Направи главна">
                    <Star className="h-4 w-4" />
                  </button>
                ) : null}
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-canvas disabled:opacity-30" aria-label="Премести наляво">
                  <ArrowUp className="h-4 w-4 -rotate-90" />
                </button>
                <button
                  type="button"
                  disabled={i === images.length - 1}
                  onClick={() => move(i, 1)}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-canvas disabled:opacity-30"
                  aria-label="Премести надясно"
                >
                  <ArrowDown className="h-4 w-4 -rotate-90" />
                </button>
                <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-lg text-brand hover:bg-brand-soft" aria-label="Премахни снимката">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border-2 border-dashed border-line p-6 text-center text-ink-soft">Продуктът няма снимки.</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => file.current?.click()} disabled={pending} className="btn btn-primary h-11 px-5 !shadow-none">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {pending ? "Качване…" : "Качи снимки от компютъра"}
        </button>
        <div className="flex min-w-64 flex-1 gap-2">
          <TextInput placeholder="или поставете линк към снимка https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button
            type="button"
            onClick={() => {
              if (/^https?:\/\/\S+$/i.test(url.trim())) {
                onChange([...images, url.trim()]);
                setUrl("");
              }
            }}
            className="btn btn-ghost h-12 shrink-0 px-4"
          >
            <Plus className="h-4 w-4" /> Добави
          </button>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">Първата снимка е главната — тя се показва в списъците. Препоръчително: квадратни снимки, поне 800×800 px.</p>
      {uploadError ? <p className="mt-2 text-sm font-bold text-brand">{uploadError}</p> : null}
      {error ? <p className="mt-2 text-sm font-bold text-brand">{error}</p> : null}
      <input
        ref={file}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) upload(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export type CategoryOption = { slug: string; name: string; hidden: boolean; subs: { slug: string; name: string }[] };

export function ProductForm({
  initial,
  brands,
  categories,
  mode,
}: {
  initial: ProductFormInitial;
  brands: string[];
  /** As edited in Admin → Категории. */
  categories: CategoryOption[];
  mode: "edit" | "create";
}) {
  const router = useRouter();
  const pick = (v: ProductFormInitial): ProductPayload => ({
    name: v.name,
    brand: v.brand,
    category: v.category,
    subcategory: v.subcategory,
    ean: v.ean,
    price: v.price,
    oldPrice: v.oldPrice,
    stock: v.stock,
    hidden: v.hidden,
    images: v.images,
    description: v.description,
    color: v.color,
    pieces: v.pieces,
    ageMin: v.ageMin == null ? "" : String(v.ageMin),
    ageMax: v.ageMax == null ? "" : String(v.ageMax),
    audience: v.audience,
    warnings: v.warnings,
    batch: v.batch,
    passport: v.passport,
  });
  const [form, setForm] = useState<ProductPayload>(pick(initial));
  const [saved, setSaved] = useState<ProductPayload>(pick(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  useUnsavedWarning(dirty);

  const set = <K extends keyof ProductPayload>(k: K, v: ProductPayload[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setStatus({ kind: "idle" });
  };
  const cat = categories.find((c) => c.slug === String(form.category));
  const off = discount(String(form.price), String(form.oldPrice));

  const save = () =>
    start(async () => {
      const r = mode === "create" ? await createProductAction(form) : await saveProductAction(initial.id!, form);
      setErrors(r.fieldErrors ?? {});
      if (r.ok) {
        setSaved(form);
        setStatus({ kind: "saved" });
        if (mode === "create" && r.id) router.push(`/admin/produkti/${r.id}?created=1`);
        else router.refresh();
      } else setStatus({ kind: "error", message: r.error ?? "Възникна грешка." });
    });

  const restore = () => {
    if (!confirm("Да върна ли оригиналните данни от файла на доставчика? Всички ваши промени по този продукт ще бъдат изтрити.")) return;
    start(async () => {
      const r = await restoreProductAction(initial.id!);
      // Reload so the form shows the restored values.
      if (r.ok) window.location.reload();
      else setStatus({ kind: "error", message: r.error ?? "Грешка" });
    });
  };
  const remove = () => {
    if (!confirm("Сигурни ли сте, че искате да изтриете този продукт завинаги?")) return;
    start(async () => {
      const r = await deleteProductAction(initial.id!);
      if (r.ok) router.push("/admin/produkti");
      else setStatus({ kind: "error", message: r.error ?? "Грешка" });
    });
  };

  return (
    <>
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card title="Основна информация">
            <div className="grid gap-4">
              <Field label="Име на продукта *" error={errors.name}>
                <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} invalid={!!errors.name} maxLength={300} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Марка" hint="Изберете от списъка или напишете нова.">
                  <TextInput list="brand-options" value={form.brand} onChange={(e) => set("brand", e.target.value)} maxLength={80} />
                  <datalist id="brand-options">
                    {brands.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Категория *" error={errors.category}>
                  <select
                    className="field cursor-pointer"
                    value={String(form.category)}
                    onChange={(e) => {
                      set("category", e.target.value);
                      set("subcategory", "");
                    }}
                  >
                    <option value="">— Изберете —</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.hidden ? `${c.name} (скрита в менюто)` : c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              {cat?.subs.length ? (
                <Field label="Подкатегория">
                  <select className="field cursor-pointer" value={String(form.subcategory)} onChange={(e) => set("subcategory", e.target.value)}>
                    <option value="">— Без подкатегория —</option>
                    {cat.subs.map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
              <Field label="Описание" hint="Показва се на страницата на продукта. Нов ред = нов абзац. Може да остане празно.">
                <TextArea rows={6} value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={5000} />
              </Field>
            </div>
          </Card>

          <Card title="Снимки">
            <ImagesEditor images={form.images} onChange={(v) => set("images", v)} error={errors.images} />
          </Card>

          <Card
            title="Възраст, пол и безопасност"
            description={
              mode === "create"
                ? "Оставете празно и ще се определят автоматично от името и категорията. Проверете ги спрямо опаковката."
                : "Показват се на страницата на продукта, преди клиентът да поръча, и във филтрите. Проверете ги спрямо опаковката."
            }
            actions={
              mode === "edit" && initial.toySource && [initial.toySource.age, initial.toySource.audience, initial.toySource.warnings].includes("admin") ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await resetToyInfoAction(initial.id!);
                      if (r.ok) window.location.reload();
                      else setStatus({ kind: "error", message: r.error ?? "Грешка" });
                    })
                  }
                  className="btn btn-ghost h-10 px-4 text-sm"
                >
                  <Sparkles className="h-4 w-4" /> Върни автоматичните
                </button>
              ) : null
            }
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={<span className="flex flex-wrap items-center gap-2">Възраст от <SourceTag source={String(form.ageMin) === String(saved.ageMin) ? initial.toySource?.age : "admin"} /></span>} error={errors.ageMin}>
                <select className="field cursor-pointer" value={String(form.ageMin ?? "")} onChange={(e) => set("ageMin", e.target.value)}>
                  <option value="">— не е посочена —</option>
                  {AGE_CHOICES.map((a) => (
                    <option key={a.months} value={a.months}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="до" error={errors.ageMax}>
                <select className="field cursor-pointer" value={String(form.ageMax ?? "")} onChange={(e) => set("ageMax", e.target.value)} disabled={String(form.ageMin ?? "") === ""}>
                  <option value="">без горна граница</option>
                  {AGE_CHOICES.filter((a) => a.months > Number(form.ageMin || -1)).map((a) => (
                    <option key={a.months} value={a.months}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={<span className="flex flex-wrap items-center gap-2">За кого <SourceTag source={form.audience === saved.audience ? initial.toySource?.audience : "admin"} /></span>}>
                <select className="field cursor-pointer" value={form.audience} onChange={(e) => set("audience", e.target.value)}>
                  {Object.entries(AUDIENCES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {String(form.ageMin ?? "") !== "" ? (
              <p className="mt-2 text-sm text-muted">
                В сайта: <b className="text-ink">{formatAge(Number(form.ageMin), String(form.ageMax ?? "") === "" ? null : Number(form.ageMax))}</b>
              </p>
            ) : null}

            <div className="mt-5">
              <p className="mb-2 flex flex-wrap items-center gap-2 text-sm font-extrabold">
                Предупреждения <SourceTag source={JSON.stringify(form.warnings) === JSON.stringify(saved.warnings) ? initial.toySource?.warnings : "admin"} />
              </p>
              <ul className="grid gap-2 md:grid-cols-2">
                {WARNING_KEYS.map((k) => {
                  const on = form.warnings.includes(k);
                  return (
                    <li key={k}>
                      <label className={clsx("flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3 transition", on ? "border-brand bg-brand-soft/40" : "border-line hover:border-ink/30")}>
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={(e) => set("warnings", WARNING_KEYS.filter((w) => (w === k ? e.target.checked : form.warnings.includes(w))))}
                          className="mt-1 h-4 w-4 accent-[var(--color-brand)]"
                        />
                        <SafetyIcon warning={k} className="h-9 w-9 shrink-0" />
                        <span className="min-w-0">
                          <span className="block text-sm font-extrabold">{WARNINGS[k].label}</span>
                          {on ? <span className="mt-0.5 block text-xs text-ink-soft">{WARNINGS[k].text}</span> : null}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Партида / сериен номер" hint="По желание (изисква се за идентификация по GPSR, ако е известна).">
                <TextInput value={form.batch} onChange={(e) => set("batch", e.target.value)} maxLength={60} />
              </Field>
              <Field label="Дигитален продуктов паспорт (линк)" error={errors.passport} hint="По желание. Новият регламент за безопасност на играчките ще го изисква след преходния период.">
                <TextInput value={form.passport} onChange={(e) => set("passport", e.target.value)} placeholder="https://…" invalid={!!errors.passport} />
              </Field>
            </div>
          </Card>

          <Card title="Допълнителни данни" description="По желание — показват се в „Характеристики“.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Баркод (EAN)" error={errors.ean}>
                <TextInput value={form.ean} onChange={(e) => set("ean", e.target.value)} inputMode="numeric" maxLength={14} invalid={!!errors.ean} />
              </Field>
              <Field label="Цвят">
                <TextInput value={form.color} onChange={(e) => set("color", e.target.value)} maxLength={60} />
              </Field>
              <Field label="Брой части" error={errors.pieces}>
                <TextInput value={String(form.pieces)} onChange={(e) => set("pieces", e.target.value)} inputMode="numeric" invalid={!!errors.pieces} />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-5 lg:sticky lg:top-6">
          <Card title="Цена и наличност">
            <div className="space-y-4">
              <Field label="Цена *" error={errors.price} hint={initial.demoPrice && String(form.price) === String(saved.price) ? "Това е примерна (демо) цена — въведете реалната." : "Цената, която клиентът плаща (с ДДС)."}>
                <MoneyInput value={String(form.price)} onChange={(v) => set("price", v)} invalid={!!errors.price} />
              </Field>
              <Field
                label={
                  <span className="flex items-center gap-2">
                    Стара цена (за промоция)
                    {off ? <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-black text-white">-{off}%</span> : null}
                  </span>
                }
                error={errors.oldPrice}
                hint="Попълнете само ако продуктът е в промоция — показва се зачертана. Оставете празно, ако няма промоция."
              >
                <div className="flex gap-2">
                  <div className="flex-1">
                    <MoneyInput value={String(form.oldPrice)} onChange={(v) => set("oldPrice", v)} placeholder="няма промоция" invalid={!!errors.oldPrice} />
                  </div>
                  {String(form.oldPrice) ? (
                    <button type="button" onClick={() => set("oldPrice", "")} className="btn btn-ghost h-12 w-12 !px-0" title="Спри промоцията" aria-label="Спри промоцията">
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </Field>
              <Field label="Наличност (брой)" error={errors.stock} hint="При 0 продуктът се показва като „Изчерпан“ и не може да се поръча.">
                <TextInput value={String(form.stock)} onChange={(e) => set("stock", e.target.value)} inputMode="numeric" invalid={!!errors.stock} />
              </Field>
              <Toggle
                checked={!form.hidden}
                onChange={(v) => set("hidden", !v)}
                label="Показва се в сайта"
                description={form.hidden ? "Скрит — клиентите не го виждат." : "Клиентите виждат продукта."}
              />
            </div>
          </Card>

          {mode === "edit" ? (
            <Card>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Код</dt>
                  <dd className="font-bold">{initial.sku}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Произход</dt>
                  <dd className="font-bold">{initial.custom ? "Добавен ръчно" : "От файла на доставчика"}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-col gap-2">
                {!form.hidden ? (
                  <a href={`/produkt/${initial.slug}`} target="_blank" rel="noopener" className="btn btn-ghost h-11">
                    <ExternalLink className="h-4 w-4" /> Виж в сайта
                  </a>
                ) : null}
                {initial.canRestore ? (
                  <button type="button" onClick={restore} disabled={pending} className="btn btn-ghost h-11">
                    <RotateCcw className="h-4 w-4" /> Върни оригиналните данни
                  </button>
                ) : null}
                {initial.custom ? (
                  <button type="button" onClick={remove} disabled={pending} className="btn h-11 border-2 border-brand-soft text-brand hover:bg-brand-soft">
                    <Trash2 className="h-4 w-4" /> Изтрий продукта
                  </button>
                ) : (
                  <p className="text-xs text-muted">Продуктите от файла на доставчика не се изтриват — скрийте ги с превключвателя „Показва се в сайта“.</p>
                )}
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <SaveBar
        dirty={dirty || mode === "create"}
        pending={pending}
        status={status}
        onSave={save}
        onReset={mode === "edit" ? () => (setForm(saved), setErrors({})) : undefined}
        saveLabel={mode === "create" ? "Създай продукта" : "Запази промените"}
      />
    </>
  );
}
