"use client";

import { useRouter } from "next/navigation";

export function SortSelect({ value, options }: { value: string; options: { key: string; label: string; href: string }[] }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm font-bold text-ink-soft">
      <span className="hidden sm:inline">Подреди:</span>
      <select
        value={value}
        onChange={(e) => {
          const opt = options.find((o) => o.key === e.target.value);
          if (opt) router.push(opt.href, { scroll: false });
        }}
        className="h-10 cursor-pointer rounded-full border-2 border-line bg-white px-3 pr-8 font-bold text-ink outline-none focus:border-sky"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
