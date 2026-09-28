"use client";

import { saveSettingsAction } from "@/app/admin/_actions/content";
import type { StoreSettings } from "@/lib/settings-types";
import { Card, Field, MoneyInput, SaveBar, TextArea, TextInput, Toggle, useEditor } from "./ui";

// Numbers are edited as text ("3,99") and turned back into numbers when saving.
type Draft = Omit<StoreSettings, "shipping" | "points" | "returnDays"> & {
  shipping: { freeOver: string; office: string; address: string; mode: StoreSettings["shipping"]["mode"] };
  points: { perEuro: string; redeemValue: string };
  returnDays: string;
};

const txt = (n: number) => String(n).replace(".", ",");
const num = (s: string) => parseFloat(s.replace(",", ".").replace(/\s/g, ""));

function toDraft(s: StoreSettings): Draft {
  return {
    ...s,
    shipping: { freeOver: txt(s.shipping.freeOver), office: txt(s.shipping.office), address: txt(s.shipping.address), mode: s.shipping.mode },
    points: { perEuro: txt(s.points.perEuro), redeemValue: txt(s.points.redeemValue) },
    returnDays: String(s.returnDays),
  };
}

async function save(d: Draft) {
  const values = [d.shipping.freeOver, d.shipping.office, d.shipping.address, d.points.perEuro, d.points.redeemValue, d.returnDays].map(num);
  if (values.some((v) => !Number.isFinite(v) || v < 0)) return { error: "Проверете числата — трябва да са 0 или повече (напр. 3,99)." };
  return saveSettingsAction({
    ...d,
    shipping: { freeOver: values[0], office: values[1], address: values[2], mode: d.shipping.mode },
    points: { perEuro: values[3], redeemValue: values[4] },
    returnDays: Math.round(values[5]),
  });
}

export function SettingsEditor({ initial }: { initial: StoreSettings }) {
  const ed = useEditor(toDraft(initial), save);
  const s = ed.value;
  const set = (patch: Partial<Draft>) => ed.setValue((v) => ({ ...v, ...patch }));

  return (
    <div className="space-y-6">
      <Card title="Магазин и контакти">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Име на магазина" hint="Показва се в логото, заглавието на страниците и долу в сайта.">
            <TextInput value={s.name} onChange={(e) => set({ name: e.target.value })} maxLength={60} />
          </Field>
          <Field label="Кратко описание (подзаглавие)">
            <TextInput value={s.tagline} onChange={(e) => set({ tagline: e.target.value })} maxLength={120} />
          </Field>
          <Field label="Описание на магазина" hint="Показва се долу в сайта и в резултатите на Google." className="md:col-span-2">
            <TextArea rows={2} value={s.description} onChange={(e) => set({ description: e.target.value })} maxLength={400} />
          </Field>
          <Field label="Телефон">
            <TextInput value={s.phone} onChange={(e) => set({ phone: e.target.value })} maxLength={40} />
          </Field>
          <Field label="Имейл">
            <TextInput type="email" value={s.email} onChange={(e) => set({ email: e.target.value })} maxLength={120} />
          </Field>
          <Field label="Адрес">
            <TextInput value={s.address} onChange={(e) => set({ address: e.target.value })} maxLength={200} />
          </Field>
          <Field label="Работно време">
            <TextInput value={s.workingHours} onChange={(e) => set({ workingHours: e.target.value })} maxLength={120} />
          </Field>
        </div>
      </Card>

      <Card title="Доставка и връщане">
        <Field group label="Как се изчислява цената на доставката" className="mb-5">
          <div className="grid gap-2 md:grid-cols-2">
            {[
              { key: "courier" as const, title: "Цена от куриера (препоръчително)", text: "Клиентът вижда точната цена на Спиди/Еконт за избрания офис или адрес. Ако куриерът не отговори, се ползват цените по-долу." },
              { key: "fixed" as const, title: "Фиксирани цени", text: "Винаги се ползват цените по-долу, независимо от куриера и теглото." },
            ].map((o) => (
              <label key={o.key} className={`cursor-pointer rounded-2xl border-2 p-4 transition ${s.shipping.mode === o.key ? "border-brand bg-brand-soft/40" : "border-line hover:border-ink-soft"}`}>
                <input type="radio" className="sr-only" checked={s.shipping.mode === o.key} onChange={() => set({ shipping: { ...s.shipping, mode: o.key } })} />
                <span className="block font-black">{o.title}</span>
                <span className="text-sm text-ink-soft">{o.text}</span>
              </label>
            ))}
          </div>
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Безплатна доставка над" hint="0 = винаги безплатна.">
            <MoneyInput value={s.shipping.freeOver} onChange={(v) => set({ shipping: { ...s.shipping, freeOver: v } })} />
          </Field>
          <Field label="Фиксирана цена до офис">
            <MoneyInput value={s.shipping.office} onChange={(v) => set({ shipping: { ...s.shipping, office: v } })} />
          </Field>
          <Field label="Фиксирана цена до адрес">
            <MoneyInput value={s.shipping.address} onChange={(v) => set({ shipping: { ...s.shipping, address: v } })} />
          </Field>
          <Field label="Срок за доставка" hint="Текст, напр. „1–3 работни дни“.">
            <TextInput value={s.deliveryDays} onChange={(e) => set({ deliveryDays: e.target.value })} maxLength={60} />
          </Field>
          <Field label="Дни за връщане">
            <TextInput value={s.returnDays} onChange={(e) => set({ returnDays: e.target.value })} inputMode="numeric" />
          </Field>
        </div>
        <Toggle
          className="mt-5"
          checked={s.allowOutOfStockOrders}
          onChange={(v) => set({ allowOutOfStockOrders: v })}
          label="Разреши поръчки на изчерпани продукти"
          description="Ако е изключено, продуктите с наличност 0 не могат да се добавят в количката."
        />
      </Card>

      <Card title="Бонус точки">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Точки за всеки 1 €" hint="Напр. 1 — поръчка за 57,80 € носи 57 точки.">
            <TextInput value={s.points.perEuro} onChange={(e) => set({ points: { ...s.points, perEuro: e.target.value } })} inputMode="decimal" />
          </Field>
          <Field label="Стойност на 1 точка" hint="Напр. 0,05 € — тогава 100 точки = 5 € отстъпка.">
            <MoneyInput value={s.points.redeemValue} onChange={(v) => set({ points: { ...s.points, redeemValue: v } })} />
          </Field>
        </div>
      </Card>

      <Card title="Фирмени данни" description="Показват се в „Общи условия“. Задължителни по закон за онлайн магазин.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Наименование на фирмата">
            <TextInput value={s.company.legalName} onChange={(e) => set({ company: { ...s.company, legalName: e.target.value } })} maxLength={200} />
          </Field>
          <Field label="ЕИК">
            <TextInput value={s.company.eik} onChange={(e) => set({ company: { ...s.company, eik: e.target.value } })} maxLength={40} />
          </Field>
          <Field label="Адрес на управление" className="md:col-span-2">
            <TextInput value={s.company.registeredAddress} onChange={(e) => set({ company: { ...s.company, registeredAddress: e.target.value } })} maxLength={300} />
          </Field>
        </div>
      </Card>

      <Card title="Демо известие">
        <Toggle
          checked={s.showDemoNotice}
          onChange={(v) => set({ showDemoNotice: v })}
          label="Показвай лентата „Демо версия“, докато има продукти с примерни цени"
          description="Изключете я, когато цените в сайта са реални."
        />
      </Card>

      <SaveBar dirty={ed.dirty} pending={ed.pending} status={ed.status} onSave={ed.submit} onReset={ed.reset} />
    </div>
  );
}
