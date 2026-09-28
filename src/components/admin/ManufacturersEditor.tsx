"use client";

import { useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import { Check, ChevronDown, CircleAlert, LoaderCircle, Save, Search } from "lucide-react";
import type { BrandRow, Manufacturer } from "@/lib/manufacturers";
import { saveManufacturerAction } from "@/app/admin/_actions/manufacturers";
import { Field, TextInput } from "./ui";

const EMPTY: Manufacturer = { name: "", address: "", email: "", website: "", euName: "", euAddress: "", euEmail: "" };
const filled = (m: Manufacturer | null) => !!m && !!m.name && !!(m.address || m.email);
type Filter = "all" | "missing" | "done";

export function ManufacturersEditor({ brands }: { brands: BrandRow[] }) {
  const [rows, setRows] = useState(brands);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("missing");
  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(40);
  // Brands saved just now stay on screen (with their confirmation) until the search or filter changes.
  const [keep, setKeep] = useState<Set<string>>(new Set());

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((b) => keep.has(b.slug) || ((!t || b.name.toLowerCase().includes(t)) && (filter === "all" || (filter === "done") === filled(b.data))));
  }, [rows, q, filter, keep]);
  const done = rows.filter((b) => filled(b.data));
  const coveredProducts = done.reduce((n, b) => n + b.count, 0);
  const totalProducts = rows.reduce((n, b) => n + b.count, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-black">
            Попълнени: {done.length} от {rows.length} марки
          </p>
          <p className="text-sm font-bold text-muted">
            покриват {coveredProducts.toLocaleString("bg-BG")} от {totalProducts.toLocaleString("bg-BG")} продукта
          </p>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-canvas">
          <div className="h-full rounded-full bg-mint transition-all" style={{ width: `${totalProducts ? (coveredProducts / totalProducts) * 100 : 0}%` }} />
        </div>
        <p className="mt-3 text-sm text-muted">Започнете от марките с най-много продукти — те са най-отгоре. Данните обикновено са на опаковката или на сайта на производителя.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="flex min-w-64 flex-1 items-center rounded-[0.875rem] border-2 border-line bg-white px-3 focus-within:border-sky">
          <Search className="h-5 w-5 text-muted" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setKeep(new Set());
            }}
            placeholder="Търсете марка" aria-label="Търсене на марка" className="w-full bg-transparent px-2 py-2.5 outline-none" />
        </label>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as Filter);
            setKeep(new Set());
          }}
          className="field w-auto cursor-pointer"
          aria-label="Покажи"
        >
          <option value="missing">Непопълнени</option>
          <option value="done">Попълнени</option>
          <option value="all">Всички марки</option>
        </select>
      </div>

      <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white">
        {shown.slice(0, limit).map((b) => (
          <li key={b.slug}>
            <button type="button" onClick={() => setOpen(open === b.slug ? null : b.slug)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-canvas" aria-expanded={open === b.slug}>
              <span className={clsx("grid h-7 w-7 shrink-0 place-items-center rounded-full", filled(b.data) ? "bg-mint text-white" : "bg-canvas text-muted")}>
                {filled(b.data) ? <Check className="h-4 w-4" strokeWidth={3} /> : <CircleAlert className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-black">{b.name}</span>
                <span className="text-xs font-bold text-muted">
                  {b.count.toLocaleString("bg-BG")} продукта{b.data?.name ? ` · ${b.data.name}` : ""}
                </span>
              </span>
              <ChevronDown className={clsx("h-5 w-5 text-muted transition", open === b.slug && "rotate-180")} />
            </button>
            {open === b.slug ? (
              <BrandForm
                row={b}
                onSaved={(data) => {
                  setKeep((k) => new Set(k).add(b.slug));
                  setRows((all) => all.map((x) => (x.slug === b.slug ? { ...x, data } : x)));
                }}
              />
            ) : null}
          </li>
        ))}
        {!shown.length ? <li className="p-8 text-center text-sm text-muted">Няма марки.</li> : null}
      </ul>
      {shown.length > limit ? (
        <button type="button" onClick={() => setLimit((l) => l + 60)} className="btn btn-ghost h-11 w-full">
          Покажи още ({shown.length - limit})
        </button>
      ) : null}
    </div>
  );
}

function BrandForm({ row, onSaved }: { row: BrandRow; onSaved: (m: Manufacturer) => void }) {
  const [m, setM] = useState<Manufacturer>(row.data ?? { ...EMPTY, name: row.name });
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof Manufacturer, v: string) => {
    setM((x) => ({ ...x, [k]: v }));
    setStatus(null);
  };
  const save = () =>
    start(async () => {
      const r = await saveManufacturerAction(row.slug, m);
      if (r.ok) {
        setStatus({ ok: true, text: "Запазено! Показва се при всички продукти на марката." });
        onSaved(m);
      } else setStatus({ ok: false, text: r.error ?? "Грешка" });
    });
  return (
    <div className="space-y-4 border-t border-line bg-canvas/50 p-4 md:p-5">
      <p className="text-sm font-extrabold">Производител</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Име или търговска марка">
          <TextInput value={m.name} onChange={(e) => set("name", e.target.value)} placeholder="напр. LEGO A/S" />
        </Field>
        <Field label="Имейл">
          <TextInput type="email" value={m.email} onChange={(e) => set("email", e.target.value)} placeholder="напр. consumer@lego.com" />
        </Field>
        <Field label="Пощенски адрес" className="md:col-span-2">
          <TextInput value={m.address} onChange={(e) => set("address", e.target.value)} placeholder="Улица, номер, пощенски код, град, държава" />
        </Field>
        <Field label="Сайт (по желание)">
          <TextInput value={m.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
        </Field>
      </div>
      <p className="pt-2 text-sm font-extrabold">Отговорно лице в ЕС</p>
      <p className="-mt-3 text-xs text-muted">Попълнете само ако производителят е извън ЕС — вносителят или упълномощеният представител в ЕС.</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Име">
          <TextInput value={m.euName} onChange={(e) => set("euName", e.target.value)} />
        </Field>
        <Field label="Имейл">
          <TextInput type="email" value={m.euEmail} onChange={(e) => set("euEmail", e.target.value)} />
        </Field>
        <Field label="Пощенски адрес" className="md:col-span-2">
          <TextInput value={m.euAddress} onChange={(e) => set("euAddress", e.target.value)} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className="btn btn-primary h-11 px-6 !shadow-none">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Запази
        </button>
        {status ? <span className={clsx("text-sm font-bold", status.ok ? "text-mint" : "text-brand")}>{status.text}</span> : null}
      </div>
    </div>
  );
}
