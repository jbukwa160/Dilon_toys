"use client";

import { Truck } from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";
import { formatPrice } from "@/lib/format";

export function FreeShippingProgress({ subtotal }: { subtotal: number }) {
  const goal = useSettings().shipping.freeOver;
  const left = Math.max(0, goal - subtotal);
  const pct = goal > 0 ? Math.min(100, (subtotal / goal) * 100) : 100;
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-bold">
        <Truck className="h-4 w-4 text-mint" />
        {left > 0 ? (
          <span>
            Добавете още <span className="text-brand">{formatPrice(left)}</span> за безплатна доставка
          </span>
        ) : (
          <span className="text-mint">Имате безплатна доставка!</span>
        )}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <div className="h-full rounded-full bg-mint transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
