"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const btn = "inline-flex h-10 items-center gap-2 rounded-full border-2 border-line bg-white px-4 text-sm font-extrabold transition hover:border-ink";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-extrabold text-muted">Сподели:</span>
      <a className={btn} href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer">
        Facebook
      </a>
      <a className={btn} href={`viber://forward?text=${enc(`${title} ${url}`)}`}>
        Viber
      </a>
      <button
        type="button"
        className={btn}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {}
        }}
      >
        {copied ? <Check className="h-4 w-4 text-mint" strokeWidth={3} /> : <Link2 className="h-4 w-4" />}
        {copied ? "Копирано" : "Копирай линка"}
      </button>
    </div>
  );
}
