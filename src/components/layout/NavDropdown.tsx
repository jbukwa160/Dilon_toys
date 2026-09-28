"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, ChevronDown } from "lucide-react";
import { isExternalHref, type MenuColumn, type MenuItem } from "@/lib/settings-types";
import { MenuLabel, menuItemProps } from "./MenuLabel";

function SmartLink({ href, className, children, style }: { href: string; className?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  const ext = isExternalHref(href);
  return (
    <Link href={href} className={className} style={style} target={ext ? "_blank" : undefined} rel={ext ? "noopener" : undefined}>
      {children}
    </Link>
  );
}

/** One column of a dropdown. Also used for the admin preview. */
export function MenuColumnView({ column: c, accent }: { column: MenuColumn; accent: string }) {
  if (c.kind === "image") {
    const body = (
      <>
        <span className="block aspect-[4/3] overflow-hidden rounded-2xl bg-canvas">
          {c.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.image} alt="" className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" referrerPolicy="no-referrer" />
          ) : null}
        </span>
        {c.title ? <span className="mt-2 flex items-center gap-1 font-extrabold group-hover:underline">{c.title}</span> : null}
      </>
    );
    return c.href ? (
      <SmartLink href={c.href} className="group block">
        {body}
      </SmartLink>
    ) : (
      <div>{body}</div>
    );
  }
  return (
    <div className="min-w-0">
      {c.title ? (
        c.href ? (
          <SmartLink href={c.href} className="mb-2 block text-base font-black hover:underline" style={{ color: accent }}>
            {c.title}
          </SmartLink>
        ) : (
          <div className="mb-2 text-base font-black" style={{ color: accent }}>
            {c.title}
          </div>
        )
      ) : null}
      <ul className="space-y-0.5">
        {c.links.map((l) => (
          <li key={l.id}>
            <SmartLink href={l.href} className="block rounded-lg px-2 py-1.5 -mx-2 font-semibold text-ink-soft hover:bg-canvas hover:text-ink">
              {l.label}
            </SmartLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NavDropdown({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);
  const hover = (v: boolean) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(v), v ? 120 : 200);
  };

  const p = menuItemProps(item.appearance, open);
  const accent = item.appearance.style === "plain" ? "#1d2340" : item.appearance.color;
  const cols = item.columns.filter((c) => (c.kind === "image" ? c.image : c.links.length || c.title));
  return (
    <div ref={ref} className="relative" onMouseEnter={() => hover(true)} onMouseLeave={() => hover(false)}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={p.className} style={p.style}>
        <MenuLabel label={item.label} appearance={item.appearance} />
        <ChevronDown className={clsx("h-4 w-4 opacity-60 transition", open && "rotate-180")} />
      </button>
      {open && (cols.length || item.href) ? (
        <div
          className="absolute left-0 top-[calc(100%+10px)] z-50 max-w-[calc(100vw-3rem)] rounded-3xl border border-line bg-white p-6 shadow-[var(--shadow-lift)] [animation:fade-in_.15s_ease-out]"
          style={{ width: `${Math.max(1, cols.length) * 220 + 48}px` }}
        >
          {cols.length ? (
            <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
              {cols.map((c) => (
                <MenuColumnView key={c.id} column={c} accent={accent} />
              ))}
            </div>
          ) : null}
          {item.href ? (
            <SmartLink href={item.href} className={clsx("inline-flex items-center gap-1 font-extrabold hover:underline", cols.length && "mt-5 border-t border-line pt-4 w-full")} style={{ color: accent }}>
              Виж всички в „{item.label}“ <ArrowRight className="h-4 w-4" />
            </SmartLink>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
