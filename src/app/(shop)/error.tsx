"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-shop flex flex-col items-center py-20 text-center">
      <h1 className="text-3xl font-black">Нещо се обърка</h1>
      <p className="mt-3 text-lg text-ink-soft">Моля, опитайте отново след малко.</p>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="btn btn-primary h-12 px-8">
          Опитай отново
        </button>
        <Link href="/" className="btn btn-ghost h-12 px-8">
          Към началото
        </Link>
      </div>
    </div>
  );
}
