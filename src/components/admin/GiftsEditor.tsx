"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import { ArrowDown, ArrowUp, Check, Crown, ExternalLink, GripVertical, LoaderCircle, Plus, Rocket, Search, Sparkles, Trash2, TriangleAlert, X } from "lucide-react";
import { saveGiftsAction, suggestGiftsAction } from "@/app/admin/_actions/gifts";
import { findProductsAction, type PickerProduct } from "@/app/admin/_actions/products";
import { GIFT_SIDE_SLUG, type GiftIdeas, type GiftSection, type GiftSide, type GiftSideKey } from "@/lib/settings-types";
import type { ProductInfo } from "@/lib/admin/products";
import { formatPrice } from "@/lib/format";
import { Card, Field, SaveBar, TextInput, Toggle, useEditor } from "./ui";

type Cat = { slug: string; name: string };

const SIDE_UI: Record<GiftSideKey, { label: string; icon: typeof Rocket; tab: string; tabActive: string; border: string; accent: string }> = {
  boys: {
    label: "За момчета",
    icon: Rocket,
    tab: "border-sky-200 text-sky-800 hover:border-sky-400",
    tabActive: "border-sky-500 bg-sky-500 text-white shadow-[0_0_24px_rgba(56,189,248,0.45)]",
    border: "border-sky-300",
    accent: "bg-sky-500",
  },
  girls: {
    label: "За момичета",
    icon: Crown,
    tab: "border-pink-200 text-pink-800 hover:border-pink-400",
    tabActive: "border-pink-500 bg-pink-500 text-white shadow-[0_0_24px_rgba(236,72,153,0.45)]",
    border: "border-pink-300",
    accent: "bg-pink-500",
  },
};

const newId = () => Math.random().toString(36).slice(2, 10);

function ProductSearch({ onAdd, isAdded }: { onAdd: (p: PickerProduct) => void; isAdded: (sku: string) => boolean }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ q: string; items: PickerProduct[] } | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const t = setTimeout(() => start(async () => setResults({ q: term, items: await findProductsAction(term) })), 250);
    return () => clearTimeout(t);
  }, [q]);
  const showing = results && results.q === q.trim() && q.trim().length >= 2 ? results.items : null;
  return (
    <div>
      <label className="flex items-center rounded-[0.875rem] border-2 border-line bg-white px-3 focus-within:border-sky">
        {pending ? <LoaderCircle className="h-5 w-5 animate-spin text-muted" /> : <Search className="h-5 w-5 text-muted" />}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Търсете по име, код или баркод, напр. LEGO Ninjago"
          className="w-full bg-transparent px-2 py-3 outline-none focus-visible:outline-none"
          aria-label="Търсене на продукт за добавяне"
        />
        {q ? (
          <button type="button" onClick={() => setQ("")} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-canvas" aria-label="Изчисти">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </label>
      {showing ? (
        showing.length ? (
          <ul className="mt-2 max-h-96 divide-y divide-line overflow-y-auto rounded-2xl border border-line bg-white">
            {showing.map((p) => {
              const added = isAdded(p.sku);
              return (
                <li key={p.sku} className="flex items-center gap-3 px-3 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image ?? "/placeholder.svg"} alt="" referrerPolicy="no-referrer" className="h-12 w-12 shrink-0 rounded-lg border border-line object-contain" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 font-bold">{p.name}</span>
                    <span className="text-xs text-muted">
                      {p.sku} {p.ean ? `· баркод ${p.ean}` : ""} · {formatPrice(p.price)} {p.stock <= 0 ? "· изчерпан" : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={added}
                    onClick={() => onAdd(p)}
                    className={clsx("btn h-9 shrink-0 px-4 text-sm", added ? "bg-mint-soft text-mint" : "btn-primary !shadow-none")}
                  >
                    {added ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" />} {added ? "Добавен" : "Добави"}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 rounded-2xl bg-canvas p-3 text-sm font-bold text-ink-soft">Няма намерени продукти.</p>
        )
      ) : null}
    </div>
  );
}

export function GiftsEditor({ initial, isSaved, infos: initialInfos, categories }: { initial: GiftIdeas; isSaved: boolean; infos: Record<string, ProductInfo>; categories: Cat[] }) {
  const ed = useEditor(initial, saveGiftsAction);
  const gifts = ed.value;
  const [infos, setInfos] = useState(initialInfos);
  const [tab, setTab] = useState<GiftSideKey>("boys");
  const [newSection, setNewSection] = useState("");
  // The ref is read by the drag events (state may not have re-rendered yet); the state drives styling.
  const dragRef = useRef<{ sec: string; idx: number } | null>(null);
  const [drag, setDrag] = useState<{ sec: string; idx: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [suggesting, startSuggest] = useTransition();
  const side = gifts[tab];
  const ui = SIDE_UI[tab];
  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? "Без категория";

  const setSide = (fn: (s: GiftSide) => GiftSide) => ed.setValue((v) => ({ ...v, [tab]: fn(v[tab]) }));
  const setSections = (fn: (s: GiftSection[]) => GiftSection[]) => setSide((s) => ({ ...s, sections: fn(s.sections) }));

  const isAdded = (sku: string) => side.sections.some((s) => s.skus.includes(sku));

  const addProduct = (p: PickerProduct) => {
    setInfos((m) => ({ ...m, [p.sku]: { sku: p.sku, slug: p.slug, name: p.name, image: p.image, price: p.price, stock: p.stock, hidden: p.hidden, category: p.category } }));
    setSections((secs) => {
      if (secs.some((s) => s.skus.includes(p.sku))) return secs;
      const i = secs.findIndex((s) => s.category === p.category);
      if (i >= 0) return secs.map((s, j) => (j === i ? { ...s, skus: [...s.skus, p.sku] } : s));
      return [...secs, { id: newId(), title: catName(p.category), category: p.category, skus: [p.sku] }];
    });
  };

  const moveSku = (fromSec: string, fromIdx: number, toSec: string, toIdx: number) =>
    setSections((secs) => {
      const next = secs.map((s) => ({ ...s, skus: [...s.skus] }));
      const from = next.find((s) => s.id === fromSec);
      const to = next.find((s) => s.id === toSec);
      if (!from || !to) return secs;
      const [sku] = from.skus.splice(fromIdx, 1);
      let idx = toIdx;
      if (fromSec === toSec && fromIdx < toIdx) idx -= 1;
      to.skus.splice(Math.max(0, Math.min(idx, to.skus.length)), 0, sku);
      return next;
    });

  const moveSection = (i: number, d: number) =>
    setSections((secs) => {
      const next = [...secs];
      const [x] = next.splice(i, 1);
      next.splice(i + d, 0, x);
      return next;
    });

  const autofill = () => {
    if (side.sections.some((s) => s.skus.length) && !confirm(`Да заменя ли подаръците „${ui.label}“ с автоматично подбрани популярни продукти?`)) return;
    startSuggest(async () => {
      const r = await suggestGiftsAction(tab);
      setInfos((m) => ({ ...m, ...r.infos }));
      setSections(() => r.sections);
    });
  };

  const counts = { boys: gifts.boys.sections.reduce((n, s) => n + s.skus.length, 0), girls: gifts.girls.sections.reduce((n, s) => n + s.skus.length, 0) };
  const unusedCats = categories.filter((c) => !side.sections.some((s) => s.category === c.slug));

  return (
    <div className="space-y-6">
      <Card>
        <Toggle
          checked={gifts.enabled}
          onChange={(v) => ed.setValue((g) => ({ ...g, enabled: v }))}
          label="Показвай „Идеи за подаръци“ в сайта"
          description={
            <>
              Страницата с подаръци и бутонът в менюто. Надписът, цветът и мястото на бутона се настройват от{" "}
              <a href="/admin/menyu" className="font-bold text-sky underline">
                Меню
              </a>
              .
            </>
          }
        />
        {!isSaved ? (
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-sun-soft p-4 text-sm font-bold">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            В момента сайтът показва автоматично подбрани популярни играчки. Променете списъка и натиснете „Запази“, за да станат ваши.
          </p>
        ) : null}
      </Card>

      <div className="grid grid-cols-2 gap-3" role="tablist">
        {(["boys", "girls"] as GiftSideKey[]).map((k) => {
          const Icon = SIDE_UI[k].icon;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={clsx("flex items-center justify-center gap-3 rounded-3xl border-2 px-4 py-4 text-lg font-black transition", tab === k ? SIDE_UI[k].tabActive : clsx("bg-white", SIDE_UI[k].tab))}
            >
              <Icon className="h-6 w-6" /> {SIDE_UI[k].label}
              <span className={clsx("rounded-full px-2.5 py-0.5 text-sm", tab === k ? "bg-white/25" : "bg-canvas")}>{counts[k]}</span>
            </button>
          );
        })}
      </div>

      <Card className={clsx("border-2", ui.border)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Заглавие">
            <TextInput value={side.title} onChange={(e) => setSide((s) => ({ ...s, title: e.target.value }))} maxLength={60} />
          </Field>
          <Field label="Кратко описание">
            <TextInput value={side.subtitle} onChange={(e) => setSide((s) => ({ ...s, subtitle: e.target.value }))} maxLength={160} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={`/podaratsi/${GIFT_SIDE_SLUG[tab]}`} target="_blank" rel="noopener" className="btn btn-ghost h-11 px-5">
            <ExternalLink className="h-4 w-4" /> Виж страницата
          </a>
          <button type="button" onClick={autofill} disabled={suggesting} className="btn btn-ghost h-11 px-5">
            {suggesting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Попълни автоматично
          </button>
        </div>
      </Card>

      <Card title="Добави подарък" description="Намерете продукт и натиснете „Добави“ — той отива автоматично в секцията на своята категория.">
        <ProductSearch onAdd={addProduct} isAdded={isAdded} />
        <div className="mt-5 flex flex-wrap items-end gap-2 border-t border-line pt-5">
          <Field label="Или добавете празна секция (категория)" className="min-w-64 flex-1">
            <select className="field cursor-pointer" value={newSection} onChange={(e) => setNewSection(e.target.value)}>
              <option value="">— Изберете категория —</option>
              {unusedCats.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <button
            type="button"
            disabled={!newSection}
            onClick={() => {
              setSections((secs) => [...secs, { id: newId(), title: catName(newSection), category: newSection, skus: [] }]);
              setNewSection("");
            }}
            className="btn btn-ghost h-12 px-5"
          >
            <Plus className="h-4 w-4" /> Добави секция
          </button>
        </div>
      </Card>

      <div className="space-y-4">
        {side.sections.map((sec, si) => (
          <section
            key={sec.id}
            className={clsx("rounded-3xl border-2 bg-white p-4 md:p-5 transition", dropTarget === sec.id ? ui.border : "border-line")}
            onDragOver={(e) => {
              if (!dragRef.current) return;
              e.preventDefault();
              setDropTarget(sec.id);
            }}
            onDragLeave={() => setDropTarget((t) => (t === sec.id ? null : t))}
            onDrop={(e) => {
              e.preventDefault();
              const from = dragRef.current;
              if (from) moveSku(from.sec, from.idx, sec.id, sec.skus.length);
              dragRef.current = null;
              setDrag(null);
              setDropTarget(null);
            }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className={clsx("h-8 w-1.5 rounded-full", ui.accent)} />
              <input
                value={sec.title}
                onChange={(e) => setSections((secs) => secs.map((s) => (s.id === sec.id ? { ...s, title: e.target.value } : s)))}
                placeholder={catName(sec.category)}
                maxLength={60}
                className="min-w-0 flex-1 rounded-lg border-2 border-transparent bg-transparent px-2 py-1 text-xl font-black outline-none hover:border-line focus:border-sky"
                aria-label="Заглавие на секцията"
              />
              <span className="text-sm font-bold text-muted">
                {catName(sec.category)} · {sec.skus.length} {sec.skus.length === 1 ? "продукт" : "продукта"}
              </span>
              <div className="flex gap-1.5">
                <button type="button" disabled={si === 0} onClick={() => moveSection(si, -1)} className="grid h-9 w-9 place-items-center rounded-lg border border-line hover:border-ink disabled:opacity-30" aria-label="Секцията нагоре">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={si === side.sections.length - 1}
                  onClick={() => moveSection(si, 1)}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-line hover:border-ink disabled:opacity-30"
                  aria-label="Секцията надолу"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => (!sec.skus.length || confirm(`Да изтрия ли секция „${sec.title || catName(sec.category)}“ с ${sec.skus.length} продукта?`)) && setSections((secs) => secs.filter((s) => s.id !== sec.id))}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-line text-brand hover:border-brand"
                  aria-label="Изтрий секцията"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {sec.skus.length ? (
              <ol className="mt-3 space-y-1.5">
                {sec.skus.map((sku, i) => {
                  const p = infos[sku];
                  return (
                    <li
                      key={sku}
                      draggable
                      onDragStart={(e) => {
                        dragRef.current = { sec: sec.id, idx: i };
                        setDrag({ sec: sec.id, idx: i });
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", sku); // Firefox needs data to start a drag
                      }}
                      onDragEnd={() => {
                        dragRef.current = null;
                        setDrag(null);
                        setDropTarget(null);
                      }}
                      onDragOver={(e) => {
                        if (dragRef.current) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const from = dragRef.current;
                        if (from) moveSku(from.sec, from.idx, sec.id, i);
                        dragRef.current = null;
                        setDrag(null);
                        setDropTarget(null);
                      }}
                      className={clsx(
                        "flex items-center gap-3 rounded-2xl border bg-white px-2 py-1.5 transition",
                        drag?.sec === sec.id && drag.idx === i ? "opacity-40" : "border-line hover:border-ink-soft",
                      )}
                    >
                      <span className="cursor-grab text-muted active:cursor-grabbing" title="Провлачете, за да преместите">
                        <GripVertical className="h-5 w-5" />
                      </span>
                      <span className="w-6 text-center text-sm font-black text-muted">{i + 1}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p?.image ?? "/placeholder.svg"} alt="" referrerPolicy="no-referrer" className="h-12 w-12 shrink-0 rounded-lg border border-line object-contain" draggable={false} />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 font-bold">{p?.name ?? sku}</span>
                        <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                          {sku} {p ? `· ${formatPrice(p.price)}` : ""}
                          {p && p.stock <= 0 ? <span className="rounded-full bg-sun-soft px-2 py-0.5 font-bold text-ink">Изчерпан</span> : null}
                          {p?.hidden ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 font-bold text-brand">
                              <TriangleAlert className="h-3 w-3" /> Скрит — няма да се вижда
                            </span>
                          ) : null}
                          {!p ? <span className="rounded-full bg-brand-soft px-2 py-0.5 font-bold text-brand">Продуктът не съществува</span> : null}
                        </span>
                      </span>
                      <div className="flex shrink-0 gap-1">
                        <button type="button" disabled={i === 0} onClick={() => moveSku(sec.id, i, sec.id, i - 1)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-canvas disabled:opacity-30" aria-label="Нагоре">
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={i === sec.skus.length - 1}
                          onClick={() => moveSku(sec.id, i, sec.id, i + 2)}
                          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-canvas disabled:opacity-30"
                          aria-label="Надолу"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSections((secs) => secs.map((s) => (s.id === sec.id ? { ...s, skus: s.skus.filter((x) => x !== sku) } : s)))}
                          className="grid h-8 w-8 place-items-center rounded-lg text-brand hover:bg-brand-soft"
                          aria-label={`Премахни ${p?.name ?? sku}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="mt-3 rounded-2xl border-2 border-dashed border-line p-4 text-center text-sm font-bold text-ink-soft">
                Няма продукти. Добавете от търсачката горе или провлачете тук от друга секция.
              </p>
            )}
          </section>
        ))}
        {!side.sections.length ? (
          <p className="rounded-3xl border-2 border-dashed border-line bg-white p-8 text-center font-bold text-ink-soft">
            Все още няма подаръци {ui.label.toLowerCase()}. Добавете продукт или натиснете „Попълни автоматично“.
          </p>
        ) : null}
      </div>

      <SaveBar
        dirty={ed.dirty || (!isSaved && ed.status.kind !== "saved")}
        pending={ed.pending}
        status={ed.status}
        onSave={ed.submit}
        onReset={ed.reset}
        extra={
          <a href="/podaratsi" target="_blank" rel="noopener" className="btn btn-ghost h-12 px-5">
            <ExternalLink className="h-4 w-4" /> Виж в сайта
          </a>
        }
      />
    </div>
  );
}
