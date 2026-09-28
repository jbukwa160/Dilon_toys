import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";
import { ShopChrome } from "@/components/layout/ShopChrome";

export default function NotFound() {
  return (
    <ShopChrome>
      <div className="container-shop flex flex-col items-center py-20 text-center">
        <LogoMark className="h-24 w-24" />
        <h1 className="mt-6 text-4xl font-black">Ой! Тази страница се е скрила</h1>
        <p className="mt-3 max-w-md text-lg text-ink-soft">Не успяхме да намерим търсената страница. Може би играчката вече не е налична.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary h-12 px-8">
            Към началото
          </Link>
          <Link href="/igrachki" className="btn btn-ghost h-12 px-8">
            Всички играчки
          </Link>
        </div>
      </div>
    </ShopChrome>
  );
}
