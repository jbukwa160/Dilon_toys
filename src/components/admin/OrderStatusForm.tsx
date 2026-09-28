"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import { updateOrderAction } from "@/app/admin/_actions/orders";
import { TextArea } from "./ui";

const STATUSES = [
  { key: "new", label: "Нова" },
  { key: "confirmed", label: "Потвърдена" },
  { key: "shipped", label: "Изпратена" },
  { key: "delivered", label: "Доставена" },
  { key: "cancelled", label: "Отказана" },
];

export function OrderStatusForm({ id, status, note }: { id: string; status: string; note: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [text, setText] = useState(note);
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = value !== status || text !== note;
  return (
    <section className="rounded-3xl border border-line bg-white p-6 lg:sticky lg:top-6">
      <h2 className="text-lg font-black">Статус</h2>
      <div className="mt-3 grid gap-2">
        {STATUSES.map((s) => (
          <label key={s.key} className={clsx("flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2 font-bold", value === s.key ? "border-ink" : "border-line")}>
            <input type="radio" name="status" checked={value === s.key} onChange={() => (setValue(s.key), setResult(null))} className="h-4 w-4 accent-brand" />
            {s.label}
          </label>
        ))}
      </div>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-extrabold">Вътрешна бележка</span>
        <TextArea rows={3} value={text} onChange={(e) => (setText(e.target.value), setResult(null))} placeholder="Вижда се само тук, напр. номер на товарителница" />
      </label>
      <button
        type="button"
        disabled={!dirty || pending}
        onClick={() =>
          start(async () => {
            const r = await updateOrderAction(id, value, text);
            setResult(r);
            if (r.ok) router.refresh();
          })
        }
        className="btn btn-primary mt-4 h-12 w-full"
      >
        {pending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" strokeWidth={3} />} Запази
      </button>
      {result?.ok && !dirty ? <p className="mt-2 text-center text-sm font-bold text-mint">Запазено</p> : null}
      {result?.error ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-brand">
          <CircleAlert className="h-4 w-4" /> {result.error}
        </p>
      ) : null}
    </section>
  );
}
