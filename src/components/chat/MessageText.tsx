"use client";

import Link from "next/link";

// Web addresses in chat messages become links; links to this shop open in the same tab (the chat stays open).
const URL_RE = /(https?:\/\/[^\s<>"]*[^\s<>".,!?;:)\]}'])/g;

export function MessageText({ text, linkClassName = "underline" }: { text: string; linkClassName?: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part;
        let local: string | null = null;
        try {
          const u = new URL(part);
          if (typeof window !== "undefined" && u.host === window.location.host) local = u.pathname + u.search + u.hash;
        } catch {
          return part;
        }
        return local ? (
          <Link key={i} href={local} className={`${linkClassName} break-all`}>
            {part}
          </Link>
        ) : (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow" className={`${linkClassName} break-all`}>
            {part}
          </a>
        );
      })}
    </>
  );
}

export function formatChatTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const time = d.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return time;
  return `${d.toLocaleDateString("bg-BG", { day: "numeric", month: "short" })}, ${time}`;
}
