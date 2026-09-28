"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { formatNumber } from "@/lib/format";

/** Bottom sheet with the filter sidebar on small screens. Stays open while filters change. */
export function MobileFilters({ active, total, children }: { active: number; total: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost h-10 px-4 text-sm lg:hidden">
        <SlidersHorizontal className="h-4 w-4" /> Филтри{active ? ` (${active})` : ""}
      </button>
      {open ? (
        <div className="fixed inset-0 z-60 lg:hidden" role="dialog" aria-modal="true" aria-label="Филтри">
          <div className="absolute inset-0 bg-ink/40 [animation:fade-in_.15s]" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <span className="text-lg font-black">Филтри</span>
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-canvas" aria-label="Затвори">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5">{children}</div>
            <div className="border-t border-line p-4">
              <button type="button" onClick={() => setOpen(false)} className="btn btn-primary h-12 w-full">
                Покажи {formatNumber(total)} {total === 1 ? "продукт" : "продукта"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
