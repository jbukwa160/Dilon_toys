"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { LoaderCircle, Lock, ShoppingBag } from "lucide-react";
import { placeOrder, type CheckoutState } from "@/app/actions";
import { DELIVERY_METHODS, PAYMENT_METHODS, type DeliveryKey, type PaymentKey, type ShippingQuote } from "@/lib/checkout";
import { DeliveryPicker, type DeliveryState } from "./DeliveryPicker";
import { useCart } from "@/lib/store";
import { formatPrice, shippingFor } from "@/lib/format";
import { useSettings } from "@/components/SettingsProvider";
import { ProductImage } from "@/components/product/ProductImage";
import { PointsBadge } from "@/components/product/PointsBadge";
import { useFreshProducts } from "./useFreshProducts";

function Field({
  label,
  name,
  error,
  className,
  ...rest
}: { label: string; name: string; error?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={clsx("block", className)}>
      <span className="mb-1.5 block text-sm font-extrabold text-ink-soft">{label}</span>
      <input name={name} className={clsx("field", error && "!border-brand")} aria-invalid={!!error} {...rest} />
      {error ? <span className="mt-1 block text-sm font-bold text-brand">{error}</span> : null}
    </label>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-5 md:p-7">
      <h2 className="mb-5 flex items-center gap-3 text-xl font-black">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-sm text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clear, refresh } = useCart();
  const settings = useSettings();
  const [delivery, setDelivery] = useState<DeliveryState>({ method: "speedy-office", office: null, city: null, address: "" });
  const [payment, setPayment] = useState<PaymentKey>("cod");
  const [state, action, pending] = useActionState<CheckoutState | null, FormData>(placeOrder, null);
  const [quote, setQuote] = useState<{ key: string; quote: ShippingQuote } | null>(null);

  // Live delivery price once an office / city is chosen.
  const method = DELIVERY_METHODS[delivery.method];
  const target = method.kind === "office" ? delivery.office?.id : delivery.city?.id;
  const itemsKey = items.map((i) => `${i.id}x${i.qty}`).join(",");
  const quoteKey = target ? [delivery.method, target, payment, itemsKey].join("|") : "";
  useEffect(() => {
    if (!quoteKey) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: delivery.method,
          officeId: method.kind === "office" ? target : undefined,
          cityId: method.kind === "address" ? target : undefined,
          payment,
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
        }),
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then((q: ShippingQuote) => setQuote({ key: quoteKey, quote: q }))
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // quoteKey captures every input of the request
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey]);
  useFreshProducts(
    items.map((i) => i.id),
    refresh,
  );

  useEffect(() => {
    if (state?.ok && state.orderId) {
      clear();
      router.replace(`/porachka/${state.orderId}`);
    }
  }, [state, clear, router]);

  if (!items.length && !state?.ok) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-white px-6 py-16 text-center">
        <ShoppingBag className="h-12 w-12 text-muted" />
        <p className="text-xl font-black">Няма продукти за поръчка</p>
        <Link href="/igrachki" className="btn btn-primary h-12 px-8">
          Към играчките
        </Link>
      </div>
    );
  }

  const current = quote && quote.key === quoteKey ? quote.quote : null;
  const fixed = shippingFor(subtotal, method.kind, settings.shipping);
  const shipping = current ? current.price : fixed;
  const estimated = !current && fixed > 0;
  const loadingQuote = !!quoteKey && !current;
  const total = subtotal + shipping;
  const priceFor = (k: DeliveryKey) => {
    const f = shippingFor(subtotal, DELIVERY_METHODS[k].kind, settings.shipping);
    if (f === 0) return <span className="text-mint">Безплатна</span>;
    if (k === delivery.method && current) return formatPrice(current.price);
    return settings.shipping.mode === "courier" ? `около ${formatPrice(f)}` : formatPrice(f);
  };
  const e = state?.fieldErrors ?? {};
  const v = state?.values ?? {};

  return (
    <form action={action} className="grid items-start gap-6 lg:grid-cols-[1fr_400px]" noValidate>
      <input type="hidden" name="items" value={JSON.stringify(items.map((i) => ({ id: i.id, qty: i.qty })))} />
      <div className="space-y-5">
        <Section n={1} title="Данни за контакт">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Име" name="firstName" autoComplete="given-name" required defaultValue={v.firstName} error={e.firstName} />
            <Field label="Фамилия" name="lastName" autoComplete="family-name" required defaultValue={v.lastName} error={e.lastName} />
            <Field label="Телефон" name="phone" type="tel" autoComplete="tel" placeholder="08X XXX XXXX" required defaultValue={v.phone} error={e.phone} />
            <Field label="Имейл" name="email" type="email" autoComplete="email" required defaultValue={v.email} error={e.email} />
          </div>
        </Section>

        <Section n={2} title="Доставка">
          <DeliveryPicker value={delivery} onChange={setDelivery} errors={e} priceFor={priceFor} />
        </Section>

        <Section n={3} title="Плащане">
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(PAYMENT_METHODS) as PaymentKey[]).map((k) => (
              <label
                key={k}
                className={clsx(
                  "flex cursor-pointer flex-col gap-1 rounded-2xl border-2 p-4 transition",
                  payment === k ? "border-brand bg-brand-soft/40" : "border-line hover:border-ink-soft",
                )}
              >
                <input type="radio" name="payment" value={k} checked={payment === k} onChange={() => setPayment(k)} className="sr-only" />
                <span className="font-extrabold">{PAYMENT_METHODS[k].label}</span>
                <span className="text-sm text-ink-soft">{PAYMENT_METHODS[k].hint}</span>
              </label>
            ))}
          </div>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-extrabold text-ink-soft">Бележка към поръчката (по желание)</span>
            <textarea name="note" rows={3} className="field resize-y" maxLength={1000} defaultValue={v.note} />
          </label>
        </Section>
      </div>

      <aside className="rounded-3xl border border-line bg-white p-6 lg:sticky lg:top-44">
        <h2 className="text-xl font-black">Вашата поръчка</h2>
        <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-3">
              <span className="relative h-14 w-14 shrink-0 rounded-xl border border-line bg-white p-1">
                <ProductImage src={i.image} alt="" />
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.7rem] font-black text-white">{i.qty}</span>
              </span>
              <span className="line-clamp-2 flex-1 text-sm font-bold">{i.name}</span>
              <span className="text-sm font-black">{formatPrice(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-[0.95rem]">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Продукти</dt>
            <dd className="font-bold">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">
              Доставка
              <span className="block text-xs text-muted">{method.short}</span>
            </dt>
            <dd className="text-right font-bold">
              {loadingQuote ? (
                <LoaderCircle className="ml-auto h-4 w-4 animate-spin text-muted" />
              ) : shipping === 0 ? (
                <span className="text-mint">Безплатна</span>
              ) : (
                <>
                  {estimated ? "около " : ""}
                  {formatPrice(shipping)}
                </>
              )}
              {estimated && !loadingQuote ? <span className="block text-xs font-semibold text-muted">точната цена след избор на {method.kind === "office" ? "офис" : "адрес"}</span> : null}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-3">
            <dt className="font-extrabold">Общо за плащане</dt>
            <dd className="text-2xl font-black">{formatPrice(total)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-sm font-bold text-ink-soft">Ще спечелите</dt>
            <dd>
              <PointsBadge amount={subtotal} size="lg" />
            </dd>
          </div>
        </dl>

        <label className="mt-5 flex items-start gap-3 text-sm">
          <input type="checkbox" name="terms" defaultChecked={v.terms === "on"} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
          <span className="text-ink-soft">
            Прочетох и приемам{" "}
            <Link href="/obshti-usloviya" target="_blank" className="font-bold text-brand underline">
              общите условия
            </Link>{" "}
            и{" "}
            <Link href="/obshti-usloviya#poveritelnost" target="_blank" className="font-bold text-brand underline">
              политиката за поверителност
            </Link>
            .
          </span>
        </label>
        {e.terms ? <p className="mt-1 text-sm font-bold text-brand">{e.terms}</p> : null}

        {state?.error ? (
          <p className="mt-4 rounded-2xl bg-brand-soft p-3 text-sm font-bold text-brand-dark" role="alert">
            {state.error}{" "}
            {state.changed ? (
              <Link href="/kolichka" className="underline">
                Към количката
              </Link>
            ) : null}
          </p>
        ) : null}

        <p className="mt-4 text-xs leading-relaxed text-muted">
          Имате право на отказ в срок от {Math.max(14, settings.returnDays)} дни — вижте{" "}
          <Link href="/otkaz" target="_blank" className="font-bold underline">
            Отказ от поръчка
          </Link>{" "}
          и{" "}
          <Link href="/obshti-usloviya" target="_blank" className="font-bold underline">
            общите условия
          </Link>
          .
        </p>

        {/* The long legal wording wraps on narrow screens, so the button grows instead of overflowing. */}
        <button type="submit" disabled={pending} className="btn btn-primary mt-3 min-h-14 w-full whitespace-normal px-4 py-3 text-lg leading-tight">
          <Lock className="h-5 w-5 shrink-0" />
          {pending ? (
            "Изпращане…"
          ) : (
            <span className="text-center">
              Поръчка с задължение за плащане <span className="whitespace-nowrap">· {formatPrice(total)}</span>
            </span>
          )}
        </button>
      </aside>
    </form>
  );
}
