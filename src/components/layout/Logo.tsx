import Link from "next/link";

export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect x="4" y="14" width="40" height="30" rx="8" fill="#FFC93C" />
      <rect x="2" y="9" width="44" height="11" rx="5" fill="#F0503A" />
      <rect x="21" y="9" width="6" height="35" fill="#fff" opacity=".9" />
      <path d="M24 9c-4-8-14-10-15-4-1 5 8 5 15 4Zm0 0c4-8 14-10 15-4 1 5-8 5-15 4Z" fill="#7552F5" />
      <circle cx="14" cy="31" r="3" fill="#1D2340" />
      <circle cx="34" cy="31" r="3" fill="#1D2340" />
      <path d="M19 36c3 3 7 3 10 0" stroke="#1D2340" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({ name }: { name: string }) {
  const [first, ...rest] = name.split(" ");
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${name} — начало`}>
      <LogoMark className="h-10 w-10 md:h-11 md:w-11" />
      <span className="text-[1.45rem] font-black leading-none tracking-tight md:text-[1.7rem]">
        <span className="text-brand">{first}</span>
        {rest.length ? <span className="text-ink"> {rest.join(" ")}</span> : null}
      </span>
    </Link>
  );
}
