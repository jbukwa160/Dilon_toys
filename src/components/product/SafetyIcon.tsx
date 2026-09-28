import clsx from "clsx";
import {
  Baby,
  Balloon,
  BatteryMedium,
  Brush,
  Candy,
  CircleDot,
  Eye,
  FlaskConical,
  HardHat,
  Magnet,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { WarningKey } from "@/lib/toy-info";

const ICONS: Record<Exclude<WarningKey, "under3">, LucideIcon> = {
  supervision: Eye,
  balloons: Balloon,
  magnets: Magnet,
  batteries: BatteryMedium,
  buttonBattery: CircleDot,
  water: Waves,
  protective: HardHat,
  crib: Baby,
  cosmetic: Brush,
  chemistry: FlaskConical,
  food: Candy,
};

/** The "not for children under 3" symbol: a child's face with 0-3, crossed out in red. */
function Under3({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Не е подходящо за деца под 3 години">
      <circle cx="24" cy="24" r="21" fill="#fff" stroke="#d62b1f" strokeWidth="4" />
      <circle cx="24" cy="17" r="7" fill="none" stroke="#1d2340" strokeWidth="2.2" />
      <circle cx="21.5" cy="16" r="1" fill="#1d2340" />
      <circle cx="26.5" cy="16" r="1" fill="#1d2340" />
      <path d="M21 19.5q3 2.2 6 0" fill="none" stroke="#1d2340" strokeWidth="1.6" strokeLinecap="round" />
      <text x="24" y="37" textAnchor="middle" fontSize="10" fontWeight="900" fontFamily="system-ui, sans-serif" fill="#1d2340">
        0-3
      </text>
      <line x1="9.5" y1="38.5" x2="38.5" y2="9.5" stroke="#d62b1f" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Pictogram for a safety warning (the official 0-3 symbol, otherwise a clear icon on a warning tile). */
export function SafetyIcon({ warning, className }: { warning: WarningKey; className?: string }) {
  if (warning === "under3") return <Under3 className={className} />;
  const Icon = ICONS[warning];
  return (
    <span className={clsx("grid place-items-center rounded-xl bg-[#fff4d1] text-[#9a5b00] ring-2 ring-[#ffc93c]", className)} aria-hidden>
      <Icon className="h-[55%] w-[55%]" strokeWidth={2.2} />
    </span>
  );
}

/** The crossed-out wheeled bin (separate collection of electrical equipment and batteries). */
export function WeeeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Разделно събиране на електрическо оборудване и батерии">
      <path d="M14 14h20l-2.2 24H16.2z" fill="none" stroke="#1d2340" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M11 14h26M20 10h8" stroke="#1d2340" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="18" cy="40.5" r="2.2" fill="#1d2340" />
      <circle cx="30" cy="40.5" r="2.2" fill="#1d2340" />
      <path d="M9 8l30 34M39 8L9 42" stroke="#1d2340" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
