"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Building2, Check, CircleAlert, Home, LoaderCircle, MapPin, Package, Search } from "lucide-react";
import { COURIER_NAMES, DELIVERY_KEYS, DELIVERY_METHODS, type City, type Courier, type DeliveryKey, type Office } from "@/lib/checkout";

export type DeliveryState = {
  method: DeliveryKey;
  office: Office | null;
  city: City | null;
  address: string;
};

const QUICK_CITIES = ["София", "Пловдив", "Варна", "Бургас", "Русе", "Стара Загора", "Плевен"];

export function CourierBadge({ courier, className }: { courier: Courier; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[0.7rem] font-black uppercase tracking-wider text-white",
        courier === "econt" ? "bg-[#1b3f8b]" : "bg-[#e3000f]",
        className,
      )}
    >
      {COURIER_NAMES[courier]}
    </span>
  );
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function OfficePicker({ courier, value, onChange, error }: { courier: Courier; value: Office | null; onChange: (o: Office | null) => void; error?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ q: string; offices: Office[]; failed?: boolean } | null>(null);
  const q = useDebounced(query.trim(), 250);

  useEffect(() => {
    if (q.length < 2) return;
    const ctrl = new AbortController();
    fetch(`/api/shipping/offices?courier=${courier}&q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: { offices: Office[]; error?: string }) => setResults({ q, offices: d.offices ?? [], failed: !!d.error }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [q, courier]);

  if (value) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border-2 border-mint bg-mint-soft/50 p-4">
        <Check className="mt-0.5 h-5 w-5 shrink-0 text-mint" strokeWidth={3} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CourierBadge courier={courier} />
            <span className="font-black">
              {value.locker ? "Автомат" : "Офис"} „{value.name}“
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {value.city}
            {value.address ? `, ${value.address}` : ""}
          </p>
        </div>
        <button type="button" onClick={() => onChange(null)} className="btn btn-ghost h-9 shrink-0 px-4 text-sm">
          Смени
        </button>
      </div>
    );
  }

  const showing = results && results.q === q && q.length >= 2 ? results : null;
  const loading = q.length >= 2 && !showing;
  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-extrabold text-ink-soft">
          Намерете {courier === "econt" ? "офис или Еконтомат" : "офис или автомат"} на {COURIER_NAMES[courier]}
        </span>
        <span className={clsx("flex items-center rounded-[0.875rem] border-2 bg-white px-3 focus-within:border-sky", error ? "border-brand" : "border-line")}>
          {loading ? <LoaderCircle className="h-5 w-5 animate-spin text-muted" /> : <Search className="h-5 w-5 text-muted" />}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Град, квартал или адрес — напр. Варна Чайка"
            className="w-full bg-transparent px-2 py-3 outline-none focus-visible:outline-none"
            aria-label="Търсене на офис"
          />
        </span>
      </label>
      {!q ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_CITIES.map((c) => (
            <button key={c} type="button" onClick={() => setQuery(c)} className="chip !py-1 !text-xs">
              {c}
            </button>
          ))}
        </div>
      ) : null}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-brand">
          <CircleAlert className="h-4 w-4" /> {error}
        </p>
      ) : null}
      {showing ? (
        showing.offices.length ? (
          <ul className="mt-2 max-h-80 divide-y divide-line overflow-y-auto rounded-2xl border border-line bg-white" role="listbox" aria-label="Офиси">
            {showing.offices.map((o) => (
              <li key={o.id}>
                <button type="button" role="option" aria-selected={false} onClick={() => onChange(o)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-canvas">
                  {o.locker ? <Package className="mt-0.5 h-5 w-5 shrink-0 text-grape" /> : <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-sky" />}
                  <span className="min-w-0">
                    <span className="block font-bold">
                      {o.name}
                      {o.locker ? <span className="ml-2 rounded-full bg-grape-soft px-2 py-0.5 text-[0.7rem] font-extrabold text-grape">Автомат</span> : null}
                    </span>
                    <span className="block text-sm text-muted">
                      {o.city}
                      {o.address ? `, ${o.address}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 rounded-2xl bg-canvas p-4 text-sm font-bold text-ink-soft">
            {showing.failed ? "Списъкът с офиси не може да се зареди в момента. Опитайте отново след малко." : "Няма намерени офиси. Опитайте с името на града."}
          </p>
        )
      ) : null}
    </div>
  );
}

function CityPicker({ courier, value, onChange, error }: { courier: Courier; value: City | null; onChange: (c: City | null) => void; error?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ q: string; cities: City[] } | null>(null);
  const q = useDebounced(query.trim(), 250);

  useEffect(() => {
    if (q.length < 2) return;
    const ctrl = new AbortController();
    fetch(`/api/shipping/cities?courier=${courier}&q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: { cities: City[] }) => setResults({ q, cities: d.cities ?? [] }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [q, courier]);

  if (value) {
    return (
      <div>
        <span className="mb-1.5 block text-sm font-extrabold text-ink-soft">Населено място</span>
        <div className="flex items-center gap-3 rounded-2xl border-2 border-mint bg-mint-soft/50 px-4 py-3">
          <MapPin className="h-5 w-5 text-mint" />
          <span className="flex-1 font-bold">
            {value.name} <span className="font-semibold text-muted">{value.postCode}</span>
            {value.region && value.region !== value.name.replace(/^(гр\.|с\.)\s*/, "") ? <span className="font-normal text-muted">, обл. {value.region}</span> : null}
          </span>
          <button type="button" onClick={() => onChange(null)} className="btn btn-ghost h-9 px-4 text-sm">
            Смени
          </button>
        </div>
      </div>
    );
  }
  const showing = results && results.q === q && q.length >= 2 ? results : null;
  return (
    <div className="relative">
      <label className="block">
        <span className="mb-1.5 block text-sm font-extrabold text-ink-soft">Населено място</span>
        <span className={clsx("flex items-center rounded-[0.875rem] border-2 bg-white px-3 focus-within:border-sky", error ? "border-brand" : "border-line")}>
          {q.length >= 2 && !showing ? <LoaderCircle className="h-5 w-5 animate-spin text-muted" /> : <Search className="h-5 w-5 text-muted" />}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Напишете града или селото"
            autoComplete="off"
            className="w-full bg-transparent px-2 py-3 outline-none focus-visible:outline-none"
            aria-label="Населено място"
          />
        </span>
      </label>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-brand">
          <CircleAlert className="h-4 w-4" /> {error}
        </p>
      ) : null}
      {showing ? (
        <ul className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-line bg-white py-1 shadow-[var(--shadow-lift)]" role="listbox" aria-label="Населени места">
          {showing.cities.length ? (
            showing.cities.map((c) => (
              <li key={c.id}>
                <button type="button" role="option" aria-selected={false} onClick={() => onChange(c)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-canvas">
                  <span className="font-bold">{c.name}</span>
                  <span className="text-sm text-muted">
                    {c.postCode}
                    {c.region ? ` · ${c.region}` : ""}
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-sm text-muted">Няма намерени населени места.</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}

export function DeliveryPicker({
  value,
  onChange,
  errors,
  priceFor,
}: {
  value: DeliveryState;
  onChange: (v: DeliveryState) => void;
  errors: Partial<Record<string, string>>;
  /** Text shown under each option, e.g. "от 3,99 €" or "Безплатна". */
  priceFor: (key: DeliveryKey) => React.ReactNode;
}) {
  const m = DELIVERY_METHODS[value.method];
  const addressRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Начин на доставка">
        {DELIVERY_KEYS.map((k) => {
          const d = DELIVERY_METHODS[k];
          const active = value.method === k;
          return (
            <label
              key={k}
              className={clsx("flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition", active ? "border-brand bg-brand-soft/40" : "border-line hover:border-ink-soft")}
            >
              <input
                type="radio"
                name="delivery"
                value={k}
                checked={active}
                onChange={() => {
                  // Keep the chosen office/city only when it belongs to the same courier.
                  const sameCourier = DELIVERY_METHODS[k].courier === m.courier;
                  onChange({ ...value, method: k, office: sameCourier ? value.office : null, city: sameCourier ? value.city : null });
                }}
                className="sr-only"
              />
              <span className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-xl", active ? "bg-white" : "bg-canvas")}>
                {d.kind === "office" ? <Building2 className="h-5 w-5" /> : <Home className="h-5 w-5" />}
              </span>
              <span className="min-w-0">
                <CourierBadge courier={d.courier} />
                <span className="mt-1 block font-extrabold leading-tight">{d.label}</span>
                <span className="text-sm font-bold text-ink-soft">{priceFor(k)}</span>
              </span>
            </label>
          );
        })}
      </div>
      {errors.delivery ? <p className="text-sm font-bold text-brand">{errors.delivery}</p> : null}

      <input type="hidden" name="officeId" value={m.kind === "office" ? (value.office?.id ?? "") : ""} />
      <input type="hidden" name="cityId" value={m.kind === "address" ? (value.city?.id ?? "") : ""} />

      {m.kind === "office" ? (
        <OfficePicker key={m.courier} courier={m.courier} value={value.office} onChange={(office) => onChange({ ...value, office })} error={errors.office} />
      ) : (
        <div className="grid gap-4">
          <CityPicker
            key={m.courier}
            courier={m.courier}
            value={value.city}
            onChange={(city) => {
              onChange({ ...value, city });
              if (city) setTimeout(() => addressRef.current?.focus(), 0);
            }}
            error={errors.city}
          />
          <label className="block">
            <span className="mb-1.5 block text-sm font-extrabold text-ink-soft">Адрес</span>
            <input
              ref={addressRef}
              name="address"
              value={value.address}
              onChange={(e) => onChange({ ...value, address: e.target.value })}
              autoComplete="street-address"
              placeholder="Улица, №, блок, вход, етаж, апартамент"
              maxLength={300}
              className={clsx("field", errors.address && "!border-brand")}
            />
            {errors.address ? <span className="mt-1 block text-sm font-bold text-brand">{errors.address}</span> : null}
          </label>
        </div>
      )}
    </div>
  );
}
