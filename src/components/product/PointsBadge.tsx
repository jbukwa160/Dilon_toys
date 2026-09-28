"use client";

import clsx from "clsx";
import { Star } from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";
import { pointsFor } from "@/lib/format";

/** "+N точки" for a purchase amount, using the points rate from the store settings. */
export function PointsBadge({ amount, className, size = "sm" }: { amount: number; className?: string; size?: "sm" | "lg" }) {
  const { points: rate } = useSettings();
  const points = pointsFor(amount, rate.perEuro);
  if (points <= 0) return null;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full bg-grape-soft font-extrabold text-grape",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className,
      )}
      title="Бонус точки, които ще получите с тази покупка"
    >
      <Star className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} fill="currentColor" strokeWidth={0} />+{points} {points === 1 ? "точка" : "точки"}
    </span>
  );
}
