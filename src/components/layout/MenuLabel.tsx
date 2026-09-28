import clsx from "clsx";
import { contrastText, type MenuAppearance } from "@/lib/settings-types";
import { MenuIcon } from "./MenuIcon";

/** Classes + inline style for a top-menu item's outer element (link or button). */
export function menuItemProps(a: MenuAppearance, active = false): { className: string; style: React.CSSProperties } {
  const base = "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[0.95rem] font-extrabold transition";
  switch (a.style) {
    case "text":
      return { className: clsx(base, "hover:bg-canvas", active && "bg-canvas"), style: { color: a.color } };
    case "pill":
      return { className: clsx(base, "shadow-sm hover:brightness-110"), style: { background: a.color, color: contrastText(a.color) } };
    case "outline":
      return { className: clsx(base, "border-2 hover:bg-canvas", active && "bg-canvas"), style: { borderColor: a.color, color: a.color } };
    case "gradient":
      return { className: clsx(base, "hover:bg-canvas", active && "bg-canvas"), style: {} };
    default:
      return { className: clsx(base, "text-ink-soft hover:bg-canvas hover:text-ink", active && "bg-canvas text-ink"), style: {} };
  }
}

/** Icon + text of a menu item, coloured according to its appearance. */
export function MenuLabel({ label, appearance: a }: { label: string; appearance: MenuAppearance }) {
  // Other styles colour the icon through the parent's text colour.
  const iconColor = a.style === "gradient" ? a.color : undefined;
  return (
    <>
      <MenuIcon name={a.icon} className="h-4.5 w-4.5 shrink-0" style={iconColor ? { color: iconColor } : undefined} />
      {a.style === "gradient" ? (
        <span style={{ backgroundImage: `linear-gradient(90deg, ${a.color}, ${a.color2})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          {label}
        </span>
      ) : (
        <span>{label}</span>
      )}
    </>
  );
}
