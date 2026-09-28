"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check, CircleAlert, ExternalLink, FolderInput, LoaderCircle, Pencil, X } from "lucide-react";
import type { AdminProductRow } from "@/lib/admin/products";
import { moveProductsAction, quickSaveAction, setHiddenAction, setToyInfoAction } from "@/app/admin/_actions/products";
import { AGE_CHOICES, AUDIENCES, ageBadge, formatAge } from "@/lib/toy-info";
import type { CategoryOption } from "./ProductForm";
import { useUnsavedWarning } from "./ui";

const money = (n: number | null) => (n == null ? "" : n.toFixed(2).replace(".", ","));

function Row({
  p,
  onDirty,
  selected,
  onSelect,
}: {
  p: AdminProductRow;
  onDirty: (id: number, dirty: boolean) => void;
  selected: boolean;
  onSelect: (id: number, on: boolean) => void;
}) {
  const [saved, setSaved] = useState({
    price: money(p.price),
    oldPrice: money(p.oldPrice),
    stock: String(p.stock),
  });
  const [form, setForm] = useState(saved);
  const [hidden, setHidden] = useState(p.hidden);
  const [status, setStatus] = useState<{
    kind: "idle" | "ok" | "error";
    message?: string;
  }>({ kind: "idle" });
  const [pending, start] = useTransition();
  const dirty = form.price !== saved.price || form.oldPrice !== saved.oldPrice || form.stock !== saved.stock;

  const set = (k: keyof typeof form, v: string) => {
    const next = { ...form, [k]: v };
    setForm(next);
    setStatus({ kind: "idle" });
    onDirty(p.id, next.price !== saved.price || next.oldPrice !== saved.oldPrice || next.stock !== saved.stock);
  };
  const save = () =>
    start(async () => {
      const r = await quickSaveAction(p.id, form);
      if (r.ok) {
        setSaved(form);
        onDirty(p.id, false);
        setStatus({ kind: "ok" });
      } else setStatus({ kind: "error", message: r.error });
    });
  const toggleHidden = () =>
    start(async () => {
      const r = await setHiddenAction(p.id, !hidden);
      if (r.ok) setHidden(!hidden);
      else setStatus({ kind: "error", message: r.error });
    });

  const input = "w-full rounded-lg border-2 border-line bg-white px-2 py-1.5 text-right font-bold outline-none focus:border-sky";

  return (
    <tr className={clsx("align-top", hidden && "bg-canvas/70", selected && "!bg-sky-soft/60")}>
      <td className="py-3 pl-4 pr-1">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(p.id, e.target.checked)}
          className="mt-5 h-5 w-5 cursor-pointer accent-[var(--color-sky)]"
          aria-label={`Избери ${p.name}`}
        />
      </td>
      <td className="py-3 pr-2">
        <span className="block h-14 w-14 overflow-hidden rounded-xl border border-line bg-white p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image ?? "/placeholder.svg"}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className={clsx("h-full w-full object-contain", hidden && "opacity-40")}
          />
        </span>
      </td>
      <td className="min-w-64 py-3 pr-3">
        <Link href={`/admin/produkti/${p.id}`} className="line-clamp-2 font-bold leading-snug hover:text-brand">
          {p.name}
        </Link>
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted">
          <span>{p.sku}</span>
          {p.ean ? <span>· баркод {p.ean}</span> : null}
          {p.brand ? <span>· {p.brand}</span> : null}
          <span>· {p.categoryLabel}</span>
          {p.ageMin != null ? <span className="font-bold text-sky">· {ageBadge(p.ageMin)}</span> : null}
          {p.audience !== "all" ? <span className="font-bold">· {p.audience === "boys" ? "момчета" : "момичета"}</span> : null}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {hidden ? <span className="rounded-full bg-ink px-2 py-0.5 text-[0.7rem] font-bold text-white">Скрит</span> : null}
          {p.custom ? <span className="rounded-full bg-sky-soft px-2 py-0.5 text-[0.7rem] font-bold text-sky">Добавен ръчно</span> : null}
          {p.adminEdited && !p.custom ? <span className="rounded-full bg-grape-soft px-2 py-0.5 text-[0.7rem] font-bold text-grape">Редактиран</span> : null}
          {p.demoPrice ? <span className="rounded-full bg-sun-soft px-2 py-0.5 text-[0.7rem] font-bold">Демо цена</span> : null}
        </div>
      </td>
      <td className="w-28 py-3 pr-2">
        <input className={input} value={form.price} onChange={(e) => set("price", e.target.value)} inputMode="decimal" aria-label={`Цена на ${p.name}`} />
      </td>
      <td className="w-28 py-3 pr-2">
        <input
          className={input}
          value={form.oldPrice}
          onChange={(e) => set("oldPrice", e.target.value)}
          inputMode="decimal"
          placeholder="—"
          aria-label={`Стара цена на ${p.name}`}
        />
      </td>
      <td className="w-24 py-3 pr-2">
        <input className={input} value={form.stock} onChange={(e) => set("stock", e.target.value)} inputMode="numeric" aria-label={`Наличност на ${p.name}`} />
      </td>
      <td className="w-24 py-3 pr-2 text-center">
        <button
          type="button"
          role="switch"
          aria-checked={!hidden}
          onClick={toggleHidden}
          disabled={pending}
          title={hidden ? "Скрит — натиснете, за да се показва в сайта" : "Показва се — натиснете, за да го скриете"}
          className={clsx("relative mt-1.5 h-7 w-12 rounded-full transition", !hidden ? "bg-mint" : "bg-line")}
        >
          <span className={clsx("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", !hidden ? "left-6" : "left-1")} />
          <span className="sr-only">Показване в сайта</span>
        </button>
      </td>
      <td className="w-44 py-3 pr-4">
        <div className="flex flex-col items-end gap-1.5">
          {dirty ? (
            <button type="button" onClick={save} disabled={pending} className="btn btn-primary h-9 w-full px-3 text-sm !shadow-none">
              {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />} Запази
            </button>
          ) : (
            <div className="flex gap-1.5">
              <Link href={`/admin/produkti/${p.id}`} className="btn btn-ghost h-9 px-3 text-sm">
                <Pencil className="h-4 w-4" /> Редактирай
              </Link>
              {!hidden ? (
                <a
                  href={`/produkt/${p.slug}`}
                  target="_blank"
                  rel="noopener"
                  className="btn btn-ghost h-9 w-9 !px-0"
                  title="Виж в сайта"
                  aria-label="Виж в сайта"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          )}
          {status.kind === "ok" && !dirty ? (
            <span className="flex items-center gap-1 text-xs font-bold text-mint">
              <Check className="h-3.5 w-3.5" strokeWidth={3} /> Запазено
            </span>
          ) : null}
          {status.kind === "error" ? (
            <span className="flex items-start gap-1 text-right text-xs font-bold text-brand">
              <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" /> {status.message}
            </span>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export function ProductRows({
  items,
  categories,
  total,
  query,
}: {
  items: AdminProductRow[];
  categories: CategoryOption[];
  /** Products the current search found (all pages). */
  total: number;
  query: { q: string; category: string; filter: string };
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [allFound, setAllFound] = useState(false);
  const onSelect = (id: number, on: boolean) => {
    setAllFound(false);
    setSelected((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });
  };
  const allOnPage = items.every((p) => selected.has(p.id));
  // Result of the last "move to category" (kept after the selection is cleared).
  const [notice, setNotice] = useState<string | null>(null);
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
  useUnsavedWarning(dirtyIds.size > 0);
  const onDirty = (id: number, dirty: boolean) =>
    setDirtyIds((s) => {
      if (dirty === s.has(id)) return s;
      const n = new Set(s);
      if (dirty) n.add(id);
      else n.delete(id);
      return n;
    });
  return (
    <>
      {notice ? (
        <p className="mb-3 flex items-center gap-2 rounded-2xl bg-mint-soft px-4 py-3 font-bold text-mint" role="status">
          <Check className="h-5 w-5 shrink-0" strokeWidth={3} /> <span className="flex-1">{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white" aria-label="Затвори">
            <X className="h-4 w-4" />
          </button>
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-3xl border border-line bg-white">
        <table className="w-full min-w-[860px] text-left text-[0.95rem]">
          <thead className="border-b border-line bg-canvas text-xs font-extrabold uppercase tracking-wide text-muted">
            <tr>
              <th className="py-3 pl-4 pr-1">
                <input
                  type="checkbox"
                  checked={allOnPage}
                  onChange={(e) => {
                    setAllFound(false);
                    setSelected(e.target.checked ? new Set(items.map((p) => p.id)) : new Set());
                  }}
                  className="h-5 w-5 cursor-pointer accent-[var(--color-sky)]"
                  aria-label="Избери всички на тази страница"
                />
              </th>
              <th className="py-3 pr-2" />
              <th className="py-3">Продукт</th>
              <th className="py-3 pr-2 text-right">Цена €</th>
              <th className="py-3 pr-2 text-right" title="Цена преди намаление. Празно = без промоция.">
                Стара цена €
              </th>
              <th className="py-3 pr-2 text-right">Наличност</th>
              <th className="py-3 pr-2 text-center">В сайта</th>
              <th className="py-3 pr-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((p) => (
              <Row key={p.id} p={p} onDirty={onDirty} selected={selected.has(p.id)} onSelect={onSelect} />
            ))}
          </tbody>
        </table>
        {dirtyIds.size ? (
          <p className="border-t border-line bg-sun-soft px-4 py-2 text-sm font-bold">
            Имате незапазени промени в {dirtyIds.size} реда — натиснете „Запази“ на всеки ред.
          </p>
        ) : null}
      </div>
      {/* Outside the scrolling table, so it sticks to the bottom of the screen. */}
      {selected.size ? (
        <MoveBar
          count={allFound ? total : selected.size}
          offerAll={allOnPage && total > items.length && !allFound}
          total={total}
          onSelectAll={() => setAllFound(true)}
          onClear={() => {
            setSelected(new Set());
            setAllFound(false);
          }}
          categories={categories}
          target={allFound ? { all: query } : { ids: [...selected] }}
          onMoved={(text) => {
            setNotice(text);
            setSelected(new Set());
            setAllFound(false);
          }}
        />
      ) : null}
    </>
  );
}

function MoveBar({
  count,
  offerAll,
  total,
  onSelectAll,
  onClear,
  categories,
  target,
  onMoved,
}: {
  count: number;
  offerAll: boolean;
  total: number;
  onSelectAll: () => void;
  onClear: () => void;
  categories: CategoryOption[];
  target: Parameters<typeof moveProductsAction>[0];
  onMoved: (message: string) => void;
}) {
  const router = useRouter();
  const [action, setAction] = useState<"move" | "age" | "audience">("move");
  const [category, setCategory] = useState("");
  const [sub, setSub] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [audience, setAudience] = useState<"" | "boys" | "girls" | "all">("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const cat = categories.find((c) => c.slug === category);
  const ready = action === "move" ? !!category : action === "age" ? ageMin !== "" : !!audience;
  const apply = () =>
    start(async () => {
      setError(null);
      if (action === "move") {
        const r = await moveProductsAction(target, category, sub);
        if (!r.ok) return setError(r.error ?? "Грешка");
        const where = cat?.subs.find((s) => s.slug === sub)?.name ?? cat?.name ?? "";
        onMoved(r.moved ? `Готово! ${r.moved} продукта са преместени в „${where}“.` : `Избраните продукти вече са в „${where}“.`);
      } else {
        const change =
          action === "age"
            ? { ageMin: Number(ageMin), ageMax: ageMax === "" ? null : Number(ageMax) }
            : { audience: audience as "boys" | "girls" | "all" };
        const r = await setToyInfoAction(target, change);
        if (!r.ok) return setError(r.error ?? "Грешка");
        const what =
          action === "age"
            ? `възраст ${formatAge(Number(ageMin), ageMax === "" ? null : Number(ageMax))}`
            : `„${AUDIENCES[audience as "boys" | "girls" | "all"]}“`;
        onMoved(`Готово! ${r.changed ?? 0} продукта са с ${what}.`);
      }
      router.refresh();
    });
  return (
    <div
      className="sticky bottom-0 z-20 -mx-4 mt-3 flex flex-wrap items-center gap-3 border-t-2 border-sky bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgb(29_35_64/0.08)] backdrop-blur md:-mx-8 md:px-8"
      role="region"
      aria-label="Премести избраните продукти"
    >
      <span className="font-black">Избрани: {count.toLocaleString("bg-BG")}</span>
      {offerAll ? (
        <button type="button" onClick={onSelectAll} className="text-sm font-bold text-sky hover:underline">
          Избери всички {total.toLocaleString("bg-BG")} намерени
        </button>
      ) : null}
      <span className="flex flex-1 flex-wrap items-center gap-2">
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value as typeof action);
            setError(null);
          }}
          className="field w-auto cursor-pointer !py-2 font-bold"
          aria-label="Действие"
        >
          <option value="move">Премести в категория</option>
          <option value="age">Задай възраст</option>
          <option value="audience">Задай за кого е</option>
        </select>
        {action === "move" ? (
          <>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSub("");
                setError(null);
              }}
              className="field w-auto min-w-48 cursor-pointer !py-2"
              aria-label="Премести в категория"
            >
              <option value="">Изберете категория…</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.hidden ? `${c.name} (скрита)` : c.name}
                </option>
              ))}
            </select>
            {cat?.subs.length ? (
              <select value={sub} onChange={(e) => setSub(e.target.value)} className="field w-auto min-w-44 cursor-pointer !py-2" aria-label="Подкатегория">
                <option value="">Без подкатегория</option>
                {cat.subs.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : null}
          </>
        ) : action === "age" ? (
          <>
            <select value={ageMin} onChange={(e) => setAgeMin(e.target.value)} className="field w-auto cursor-pointer !py-2" aria-label="Възраст от">
              <option value="">от…</option>
              {AGE_CHOICES.map((a) => (
                <option key={a.months} value={a.months}>
                  от {a.label}
                </option>
              ))}
            </select>
            <select value={ageMax} onChange={(e) => setAgeMax(e.target.value)} className="field w-auto cursor-pointer !py-2" aria-label="Възраст до" disabled={ageMin === ""}>
              <option value="">без горна граница</option>
              {AGE_CHOICES.filter((a) => a.months > Number(ageMin || -1)).map((a) => (
                <option key={a.months} value={a.months}>
                  до {a.label}
                </option>
              ))}
            </select>
          </>
        ) : (
          <select value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)} className="field w-auto cursor-pointer !py-2" aria-label="За кого">
            <option value="">Изберете…</option>
            {Object.entries(AUDIENCES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        )}
        <button type="button" onClick={apply} disabled={!ready || pending} className="btn btn-primary h-11 px-5 !shadow-none">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FolderInput className="h-4 w-4" />} {action === "move" ? "Премести" : "Приложи"}
        </button>
      </span>
      <button type="button" onClick={onClear} className="btn btn-ghost h-11 px-4 text-sm">
        <X className="h-4 w-4" /> Откажи
      </button>
      {error ? (
        <p className="flex w-full items-center gap-1.5 text-sm font-bold text-brand" role="alert">
          <CircleAlert className="h-4 w-4" /> {error}
        </p>
      ) : null}
    </div>
  );
}
