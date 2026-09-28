"use client";

import { Printer } from "lucide-react";

/** Prints the page; the print styles on /otkaz leave only the withdrawal form on paper. */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-ghost h-11 px-5 print:hidden">
      <Printer className="h-5 w-5" /> Принтирай формуляра
    </button>
  );
}
