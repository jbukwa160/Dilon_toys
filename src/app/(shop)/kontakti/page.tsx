import { getSettings } from "@/lib/settings";
import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Контакти" };

const link = "font-bold text-brand underline";

export default function ContactsPage() {
  const s = getSettings();
  const c = s.company;
  const items = [
    { icon: Phone, label: "Телефон", value: s.phone, href: `tel:${s.phone.replace(/\s/g, "")}` },
    { icon: Mail, label: "Имейл", value: s.email, href: `mailto:${s.email}` },
    { icon: Clock, label: "Работно време", value: s.workingHours },
    { icon: MapPin, label: "Адрес", value: s.address },
  ];
  return (
    <InfoPage title="Контакти" intro="Имате въпрос за поръчка или продукт? Ще се радваме да помогнем.">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map(({ icon: Icon, label, value, href }) => (
          <div key={label} className="flex items-center gap-4 rounded-3xl border border-line bg-white p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-soft text-sky">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <div className="text-sm font-bold text-muted">{label}</div>
              {href ? (
                <a href={href} className="text-lg font-black hover:text-brand">
                  {value}
                </a>
              ) : (
                <div className="text-lg font-black">{value}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <section>
        <h2>Данни за търговеца</h2>
        <ul>
          <li>
            <strong>{c.legalName}</strong>, ЕИК {c.eik}
          </li>
          <li>ДДС номер: [ДДС номер — ако дружеството е регистрирано по ЗДДС]</li>
          <li>Седалище и адрес на управление: {c.registeredAddress}</li>
        </ul>
        <p>
          Искате да върнете продукт? Вижте{" "}
          <Link href="/otkaz" className={link}>
            Отказ от поръчка
          </Link>{" "}
          (с формуляр за отказ) и{" "}
          <Link href="/obshti-usloviya#garantsiya" className={link}>
            рекламации
          </Link>
          .
        </p>
      </section>
      <section>
        <h2>Надзорни органи</h2>
        <ul>
          <li>
            Комисия за защита на потребителите (КЗП) —{" "}
            <a href="https://kzp.bg" target="_blank" rel="noopener noreferrer" className={link}>
              kzp.bg
            </a>
          </li>
          <li>
            Комисия за защита на личните данни (КЗЛД) —{" "}
            <a href="https://cpdp.bg" target="_blank" rel="noopener noreferrer" className={link}>
              cpdp.bg
            </a>
          </li>
        </ul>
      </section>
    </InfoPage>
  );
}
