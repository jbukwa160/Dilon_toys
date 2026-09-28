"use client";

import { useActionState } from "react";
import { subscribeNewsletter } from "@/app/actions";

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletter, null);
  if (state?.ok) {
    return <p className="rounded-full bg-white px-5 py-3 font-extrabold text-mint">Благодарим! Абонирахте се успешно.</p>;
  }
  return (
    <form action={action} className="flex w-full max-w-md flex-col gap-2 md:w-auto">
      <div className="flex rounded-full bg-white p-1.5 shadow-sm">
        <input
          type="email"
          name="email"
          required
          placeholder="Твоят имейл"
          aria-label="Имейл за бюлетин"
          className="min-w-0 flex-1 bg-transparent px-4 text-ink outline-none placeholder:text-muted"
        />
        <button type="submit" disabled={pending} className="btn btn-primary h-11 px-6 !shadow-none">
          {pending ? "…" : "Абонирай се"}
        </button>
      </div>
      {state?.error ? <p className="px-4 text-sm font-bold text-brand-dark">{state.error}</p> : null}
    </form>
  );
}
