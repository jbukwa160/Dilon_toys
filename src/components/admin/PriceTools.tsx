"use client";

import { useRef, useState, useTransition } from "react";
import clsx from "clsx";
import { Check, CircleAlert, Download, FileSpreadsheet, LoaderCircle, Upload } from "lucide-react";
import { applyBulkAction, applyPriceFileAction, previewBulkAction, previewPriceFileAction } from "@/app/admin/_actions/prices";
import type { BulkInput, PricePreview } from "@/lib/admin/prices";
import { Card, Field, TextInput } from "./ui";

type Cat = { slug: string; name: string; subs: { slug: string; name: string }[] };

function CategorySelect({ value, onChange, categories, allLabel }: { value: string; onChange: (v: string) => void; categories: Cat[]; allLabel: string }) {
  return (
    <select className="field cursor-pointer" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{allLabel}</option>
      {categories.map((c) => (
        <optgroup key={c.slug} label={c.name}>
          <option value={c.slug}>{c.name} — всички</option>
          {c.subs.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink font-black text-white">{n}</span>
      <div className="flex-1">
        <h3 className="text-lg font-black">{title}</h3>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}

function FileImport({ categories }: { categories: Cat[] }) {
  const [kat, setKat] = useState("");
  const [preview, setPreview] = useState<PricePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const [fileName, setFileName] = useState("");
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const upload = (f: File) => {
    setError(null);
    setDone(null);
    setPreview(null);
    setFileName(f.name);
    const fd = new FormData();
    fd.append("file", f);
    start(async () => {
      const r = await previewPriceFileAction(fd);
      if ("error" in r) setError(r.error);
      else setPreview(r);
    });
  };
  const apply = () =>
    start(async () => {
      if (!preview?.id) return;
      const r = await applyPriceFileAction(preview.id);
      if (r.ok) {
        setDone(r.changed ?? 0);
        setPreview(null);
      } else setError(r.error ?? "Грешка");
    });

  const q = kat ? `&kat=${kat}` : "";
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-mint" /> Промяна на цени с Excel файл
        </span>
      }
      description="Най-лесният начин да смените цените на много продукти: изтеглете файла, променете цените в Excel и го качете обратно."
    >
      <div className="space-y-6">
        <Step n={1} title="Изтеглете текущите цени">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-72">
              <CategorySelect value={kat} onChange={setKat} categories={categories} allLabel="Всички продукти" />
            </div>
            <a href={`/admin/tseni/export?format=xlsx${q}`} className="btn btn-primary h-12 px-5 !shadow-none">
              <Download className="h-4 w-4" /> Изтегли за Excel
            </a>
            <a href={`/admin/tseni/export?format=csv${q}`} className="btn btn-ghost h-12 px-4 text-sm">
              или CSV
            </a>
          </div>
        </Step>
        <Step n={2} title="Променете цените в Excel">
          <p className="text-ink-soft">
            Сменете колоните <b>„Цена“</b>, <b>„Стара цена“</b> (за промоция) и/или <b>„Наличност“</b>. Не пипайте колоната „Код“. Може да изтриете редовете,
            които не променяте. Запазете файла.
          </p>
        </Step>
        <Step n={3} title="Качете файла">
          <button type="button" onClick={() => input.current?.click()} disabled={pending} className="btn btn-primary h-12 px-5 !shadow-none">
            {pending && !preview ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Качи файл (.xlsx или .csv)
          </button>
          {fileName ? <span className="ml-3 text-sm text-muted">{fileName}</span> : null}
          <input
            ref={input}
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
        </Step>

        {error ? (
          <p className="flex items-start gap-2 rounded-2xl bg-brand-soft p-4 font-bold text-brand-dark">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /> {error}
          </p>
        ) : null}
        {done != null ? (
          <p className="flex items-center gap-2 rounded-2xl bg-mint-soft p-4 font-bold text-mint">
            <Check className="h-5 w-5" strokeWidth={3} /> Готово! Променени са {done} продукта. Новите цени вече са в сайта.
          </p>
        ) : null}

        {preview ? (
          <div className="rounded-2xl border-2 border-sky bg-sky-soft/40 p-5">
            <h3 className="text-lg font-black">Преглед преди запазване</h3>
            <ul className="mt-2 space-y-1 font-bold">
              <li>Редове във файла: {preview.totalRows}</li>
              <li className="text-mint">Ще бъдат променени: {preview.changed} продукта</li>
              <li className="text-ink-soft">Без промяна: {preview.unchanged}</li>
              {preview.unmatchedCount ? (
                <li className="text-brand">
                  Непознати кодове: {preview.unmatchedCount} <span className="font-normal text-ink-soft">({preview.unmatched.join(", ")}{preview.unmatchedCount > preview.unmatched.length ? "…" : ""})</span>
                </li>
              ) : null}
              {preview.errors.length ? <li className="text-brand">Редове с грешки (ще бъдат пропуснати): {preview.errors.length}</li> : null}
            </ul>
            {preview.errors.length ? (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-brand-dark">
                {preview.errors.map((e) => (
                  <li key={e.line}>{e.message}</li>
                ))}
              </ul>
            ) : null}
            {preview.samples.length ? (
              <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-white">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-canvas text-xs font-extrabold uppercase text-muted">
                    <tr>
                      <th className="px-3 py-2">Продукт</th>
                      <th className="px-3 py-2">Сега</th>
                      <th className="px-3 py-2">След промяната</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {preview.samples.map((s) => (
                      <tr key={s.sku}>
                        <td className="px-3 py-2">
                          <span className="line-clamp-1 font-bold">{s.name}</span>
                          <span className="text-xs text-muted">{s.sku}</span>
                        </td>
                        <td className="px-3 py-2 text-ink-soft">{s.before}</td>
                        <td className="px-3 py-2 font-bold">{s.after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.changed > preview.samples.length ? <p className="px-3 py-2 text-xs text-muted">…и още {preview.changed - preview.samples.length}</p> : null}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {preview.id ? (
                <button type="button" onClick={apply} disabled={pending} className="btn btn-primary h-12 px-6">
                  {pending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" strokeWidth={3} />} Приложи промените ({preview.changed})
                </button>
              ) : (
                <p className="font-bold text-ink-soft">Няма какво да се промени.</p>
              )}
              <button type="button" onClick={() => setPreview(null)} className="btn btn-ghost h-12 px-5">
                Отказ
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

const ACTIONS: { key: BulkInput["action"]; label: string; help: string }[] = [
  { key: "sale", label: "Пусни промоция", help: "Сегашната цена става „стара цена“ (зачертана), а новата е намалена с процента." },
  { key: "endSale", label: "Спри промоцията", help: "Връща старата цена като нормална и маха намалението." },
  { key: "increase", label: "Увеличи цените", help: "Увеличава цените (и старите цени) с процента." },
  { key: "decrease", label: "Намали цените", help: "Намалява цените (и старите цени) с процента, без да ги прави промоция." },
];

function BulkChange({ categories, brands }: { categories: Cat[]; brands: string[] }) {
  const [input, setInput] = useState<BulkInput>({ scope: "category", value: "", action: "sale", percent: 10, round99: true });
  const [preview, setPreview] = useState<{ count: number; samples: { name: string; before: string; after: string }[]; skipped: number } | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (patch: Partial<BulkInput>) => {
    setInput((i) => ({ ...i, ...patch }));
    setPreview(null);
    setMessage(null);
  };
  const check = () =>
    start(async () => {
      const r = await previewBulkAction(input);
      if ("error" in r) setMessage({ ok: false, text: r.error! });
      else setPreview(r);
    });
  const apply = () =>
    start(async () => {
      const r = await applyBulkAction(input);
      setPreview(null);
      setMessage(r.ok ? { ok: true, text: `Готово! Променени са ${r.changed} продукта.` } : { ok: false, text: r.error ?? "Грешка" });
    });

  const scopeText = input.scope === "all" ? "всички продукти" : input.value ? `„${input.scope === "category" ? categories.flatMap((c) => [c, ...c.subs]).find((c) => c.slug === input.value)?.name : input.value}“` : "";

  return (
    <Card title="Промоция или промяна с процент" description="Пуснете промоция или сменете цените на цяла категория или марка наведнъж.">
      <div className="space-y-5">
        <Field group label="1. За кои продукти?">
          <div className="grid gap-2 sm:grid-cols-[12rem_1fr]">
            <select className="field cursor-pointer" value={input.scope} onChange={(e) => set({ scope: e.target.value as BulkInput["scope"], value: "" })}>
              <option value="category">Категория</option>
              <option value="brand">Марка</option>
              <option value="all">Всички продукти</option>
            </select>
            {input.scope === "category" ? (
              <CategorySelect value={input.value} onChange={(v) => set({ value: v })} categories={categories} allLabel="— Изберете категория —" />
            ) : input.scope === "brand" ? (
              <>
                <TextInput list="bulk-brands" placeholder="Напишете марка, напр. LEGO" value={input.value} onChange={(e) => set({ value: e.target.value })} />
                <datalist id="bulk-brands">
                  {brands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </>
            ) : null}
          </div>
        </Field>

        <Field group label="2. Какво да се направи?">
          <div className="grid gap-2 sm:grid-cols-2">
            {ACTIONS.map((a) => (
              <label key={a.key} className={clsx("cursor-pointer rounded-2xl border-2 p-4 transition", input.action === a.key ? "border-brand bg-brand-soft/40" : "border-line hover:border-ink-soft")}>
                <input type="radio" name="bulk-action" className="sr-only" checked={input.action === a.key} onChange={() => set({ action: a.key })} />
                <span className="block font-black">{a.label}</span>
                <span className="text-sm text-ink-soft">{a.help}</span>
              </label>
            ))}
          </div>
        </Field>

        {input.action !== "endSale" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="3. С колко процента?">
              <div className="flex w-40 items-center rounded-[0.875rem] border-2 border-line bg-white focus-within:border-sky">
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={input.percent}
                  onChange={(e) => set({ percent: Number(e.target.value) })}
                  className="w-full bg-transparent px-3.5 py-2.5 text-lg font-bold outline-none focus-visible:outline-none"
                />
                <span className="pr-3.5 font-bold text-muted">%</span>
              </div>
            </Field>
            <label className="flex items-center gap-2.5 self-end pb-3 font-bold">
              <input type="checkbox" checked={input.round99} onChange={(e) => set({ round99: e.target.checked })} className="h-5 w-5 accent-brand" />
              Закръгли цените до ,99 (напр. 18,99 €)
            </label>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={check} disabled={pending || (input.scope !== "all" && !input.value)} className="btn btn-ghost h-12 px-6">
            {pending && !preview ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null} Провери какво ще се промени
          </button>
        </div>

        {preview ? (
          <div className="rounded-2xl border-2 border-sky bg-sky-soft/40 p-5">
            {preview.count ? (
              <>
                <p className="text-lg font-black">
                  Ще бъдат променени {preview.count} продукта от {scopeText}.
                </p>
                {preview.skipped ? <p className="text-sm text-ink-soft">{preview.skipped} продукта са пропуснати (вече са в промоция или цената не може да се намали).</p> : null}
                <ul className="mt-3 space-y-1 text-sm">
                  {preview.samples.map((s, i) => (
                    <li key={i} className="flex flex-wrap gap-x-2">
                      <span className="line-clamp-1 max-w-md font-bold">{s.name}:</span>
                      <span className="text-ink-soft">{s.before}</span> → <span className="font-bold">{s.after}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={apply} disabled={pending} className="btn btn-primary h-12 px-6">
                    {pending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" strokeWidth={3} />} Да, приложи
                  </button>
                  <button type="button" onClick={() => setPreview(null)} className="btn btn-ghost h-12 px-5">
                    Отказ
                  </button>
                </div>
              </>
            ) : (
              <p className="font-bold">Няма продукти за промяна с този избор.{preview.skipped ? ` (${preview.skipped} вече са в промоция)` : ""}</p>
            )}
          </div>
        ) : null}
        {message ? (
          <p className={clsx("flex items-center gap-2 rounded-2xl p-4 font-bold", message.ok ? "bg-mint-soft text-mint" : "bg-brand-soft text-brand-dark")}>
            {message.ok ? <Check className="h-5 w-5" strokeWidth={3} /> : <CircleAlert className="h-5 w-5" />} {message.text}
          </p>
        ) : null}
      </div>
    </Card>
  );
}

export function PriceTools({ categories, brands }: { categories: Cat[]; brands: string[] }) {
  return (
    <div className="space-y-6">
      <FileImport categories={categories} />
      <BulkChange categories={categories} brands={brands} />
    </div>
  );
}
