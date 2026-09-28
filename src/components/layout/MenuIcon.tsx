import {
  Baby,
  Bell,
  Blocks,
  BookOpen,
  Car,
  Crown,
  Flame,
  Gift,
  Heart,
  Percent,
  Puzzle,
  Rocket,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Tag,
  TreePine,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { MenuIconName } from "@/lib/settings-types";

export const MENU_ICON_COMPONENTS: Record<Exclude<MenuIconName, "none">, LucideIcon> = {
  gift: Gift,
  percent: Percent,
  tag: Tag,
  star: Star,
  sparkles: Sparkles,
  flame: Flame,
  heart: Heart,
  crown: Crown,
  rocket: Rocket,
  snowflake: Snowflake,
  sun: Sun,
  tree: TreePine,
  baby: Baby,
  car: Car,
  blocks: Blocks,
  puzzle: Puzzle,
  truck: Truck,
  bell: Bell,
  book: BookOpen,
};

export function MenuIcon({ name, className, style }: { name: MenuIconName; className?: string; style?: React.CSSProperties }) {
  if (name === "none") return null;
  const Icon = MENU_ICON_COMPONENTS[name];
  return Icon ? <Icon className={className} style={style} strokeWidth={2.4} /> : null;
}
