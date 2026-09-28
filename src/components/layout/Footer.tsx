import Link from "next/link";
import { Clock, CreditCard, Mail, MapPin, Phone, Banknote, Truck } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getCategories } from "@/lib/catalog";
import { LogoMark } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  const s = getSettings();
  const categories = getCategories().slice(0, 10);
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 bg-ink text-white/80">
      <div className="bg-sun">
        <div className="container-shop flex flex-col items-start justify-between gap-5 py-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black text-ink">Промоции и нови играчки първо при теб</h2>
            <p className="mt-1 font-semibold text-ink/75">Абонирай се за бюлетина и научавай първи за новите промоции.</p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      <div className="container-shop grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-2">
            <LogoMark className="h-11 w-11" />
            <span className="text-2xl font-black text-white">{s.name}</span>
          </div>
          <p className="mt-4 max-w-xs leading-relaxed">{s.description}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-white">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <Banknote className="h-4 w-4" /> Наложен платеж
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <CreditCard className="h-4 w-4" /> Карта
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <Truck className="h-4 w-4" /> Еконт · Спиди
            </span>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-black text-white">Категории</h3>
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/kategoria/${c.slug}`} className="hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-black text-white">Помощ</h3>
          <ul className="space-y-2">
            <li><Link href="/blog" className="font-bold text-white hover:underline">Блог: съвети и идеи</Link></li>
            <li><Link href="/dostavka" className="hover:text-white">Доставка и плащане</Link></li>
            <li><Link href="/dostavka#vrashtane" className="hover:text-white">Връщане и замяна</Link></li>
            <li><Link href="/otkaz" className="hover:text-white">Отказ от поръчка и формуляр</Link></li>
            <li><Link href="/obshti-usloviya#garantsiya" className="hover:text-white">Гаранция и рекламации</Link></li>
            <li><Link href="/bonus-programa" className="hover:text-white">Бонус програма</Link></li>
            <li><Link href="/obshti-usloviya" className="hover:text-white">Общи условия</Link></li>
            <li><Link href="/obshti-usloviya#poveritelnost" className="hover:text-white">Поверителност</Link></li>
            <li><Link href="/obshti-usloviya#biskvitki" className="hover:text-white">Бисквитки</Link></li>
            <li><Link href="/marki" className="hover:text-white">Всички марки</Link></li>
            <li><Link href="/kontakti" className="hover:text-white">Контакти</Link></li>
            <li>
              <a href="https://kzp.bg" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                Комисия за защита на потребителите
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-black text-white">Контакти</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-sun" />
              <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="font-bold text-white hover:underline">{s.phone}</a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-sun" />
              <a href={`mailto:${s.email}`} className="hover:text-white">{s.email}</a>
            </li>
            <li className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-sun" /> {s.workingHours}
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-sun" /> {s.address}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-shop flex flex-col gap-2 py-5 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {s.name}. Всички права запазени.
            <span className="mt-0.5 block text-xs text-white/60">
              {s.company.legalName} · ЕИК {s.company.eik} · {s.company.registeredAddress}
            </span>
          </span>
          <span>Цените са в евро с включен ДДС.</span>
        </div>
      </div>
    </footer>
  );
}
