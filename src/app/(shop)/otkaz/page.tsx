import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { InfoPage } from "@/components/InfoPage";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = {
  title: "Отказ от поръчка",
  description: "Как да се откажете от покупка в срок от 14 дни, как се връщат парите и стандартен формуляр за отказ за принтиране.",
};

// ЗА ПРЕГЛЕД ОТ ЮРИСТ: целият текст на тази страница е шаблон по Закона за защита на потребителите (ЗЗП)
// и трябва да бъде прегледан преди пускане. Данните на търговеца идват от Админ → Настройки.

/** Only for the owner to fill in (not in the settings yet). */
const RETURN_ADDRESS = "[Адрес за връщане на стоки — попълва се от собственика]";

// On paper only the form is left: everything that neither is the form, is inside it, nor contains it is hidden.
const PRINT_CSS =
  "@media print{@page{margin:15mm}body *:not(#formular):not(#formular *):not(:has(#formular)){display:none!important}#formular{border:0!important;padding:0!important}}";

const link = "font-bold text-brand underline";

function Blank({ label, value, lines = 1 }: { label: string; value?: string; lines?: number }) {
  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
        <span className="text-ink">— {label}</span>
        <span className="min-h-7 min-w-48 flex-1 border-b border-dotted border-ink-soft pb-0.5 font-bold text-ink">{value ?? " "}</span>
      </div>
      {Array.from({ length: lines - 1 }, (_, i) => (
        <div key={i} className="mt-1 h-7 border-b border-dotted border-ink-soft" />
      ))}
    </div>
  );
}

export default function WithdrawalPage() {
  const s = getSettings();
  const c = s.company;
  // The legal minimum is 14 days; a longer period set in the admin is honoured.
  const days = Math.max(14, s.returnDays);
  const trader = `${c.legalName}, ЕИК ${c.eik}, ${c.registeredAddress}, имейл: ${s.email}`;

  const steps = [
    [
      "Уведомете ни",
      `Преди да изтече срокът от ${days} дни ни изпратете попълнения формуляр по-долу или друго недвусмислено писмено изявление, че се отказвате — на ${s.email} или по пощата. Достатъчно е да го изпратите преди края на срока.`,
    ],
    [
      "Върнете стоката",
      `Изпратете продуктите без неоправдано забавяне и не по-късно от 14 дни от деня, в който сте ни уведомили за отказа, на адрес: ${RETURN_ADDRESS}.`,
    ],
    ["Получете парите", "Възстановяваме платената сума не по-късно от 14 дни от получаването на уведомлението ви за отказ (подробности по-долу)."],
  ];

  return (
    <InfoPage title="Отказ от поръчка" intro={`Можете да се откажете от покупка в срок от ${days} дни, без да посочвате причина и без да дължите обезщетение.`}>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map(([title, text], i) => (
          <div key={title} className="rounded-3xl bg-sky-soft p-6">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-sky font-black text-white">{i + 1}</span>
            <h2 className="mt-4 text-xl!">{title}</h2>
            <p className="mt-1">{text}</p>
          </div>
        ))}
      </div>

      <section>
        <h2>Срок за отказ</h2>
        <p>
          Срокът е {days} дни и започва от деня, в който вие или посочено от вас лице (различно от куриера) получите стоката. Ако в една поръчка
          има продукти, които пристигат с отделни пратки, срокът тече от получаването на последния продукт. Можете да се откажете и преди да
          получите стоката.
        </p>
      </section>

      <section>
        <h2>Как ви връщаме парите</h2>
        <ul>
          <li>
            Възстановяваме всички получени от вас плащания, включително разходите за доставка (без допълнителните разходи, ако сте избрали
            доставка, различна от най-евтината стандартна доставка, която предлагаме).
          </li>
          <li>Плащаме без неоправдано забавяне и не по-късно от 14 дни от деня, в който получим уведомлението ви за отказ.</li>
          <li>
            Можем да задържим плащането, докато получим стоката обратно или докато ни изпратите доказателство, че сте я изпратили — което от
            двете стане първо.
          </li>
          <li>
            Използваме същия начин на плащане, който сте използвали вие, освен ако изрично не сте се съгласили на друг. При наложен платеж
            връщаме сумата с банков превод по сметка (IBAN), която ни посочите. Не дължите такси за възстановяването.
          </li>
          <li>
            Бонус точките за върнатите продукти се анулират (вижте{" "}
            <Link href="/bonus-programa" className={link}>
              Бонус програма
            </Link>
            ).
          </li>
        </ul>
      </section>

      <section>
        <h2>Разходи за връщане и състояние на стоката</h2>
        {/* СОБСТВЕНИК / ЮРИСТ: по закон преките разходи за връщане може да са за сметка на потребителя, ако е информиран за това.
            Ако магазинът поема връщането (напр. с предплатена товарителница), променете следващото изречение. */}
        <p>Преките разходи за връщане на стоката са за ваша сметка.</p>
        <p>
          Можете да разопаковате и да разгледате продукта така, както бихте го направили в магазин. Отговаряте само за намаляване на стойността
          на стоката, което е резултат от боравене с нея, различно от необходимото, за да установите естеството, характеристиките и
          функционирането ѝ. Препоръчваме да върнете продукта с всички части, упътвания и, ако е възможно, в оригиналната опаковка — така
          обработваме връщането най-бързо.
        </p>
      </section>

      <section>
        <h2>Кога правото на отказ не се прилага</h2>
        {/* ЗА ПРЕГЛЕД ОТ ЮРИСТ: списъкът с изключения е съкратен до случаите, които могат да се отнасят за магазин за играчки. */}
        <ul>
          <li>
            Запечатани стоки, които са разпечатани след доставката и не могат да бъдат върнати по съображения, свързани с опазване на здравето
            или хигиената.
          </li>
          <li>Стоки, изработени по поръчка или персонализирани според изискванията на купувача.</li>
          <li>Запечатани аудио- или видеозаписи или компютърен софтуер, чиято опаковка е отворена след доставката.</li>
        </ul>
        <p>
          Правото на отказ е различно от законовата гаранция: ако продуктът е дефектен или не отговаря на описанието, имате права по{" "}
          <Link href="/obshti-usloviya#garantsiya" className={link}>
            законовата гаранция от 2 години
          </Link>{" "}
          независимо от срока за отказ.
        </p>
      </section>

      <section>
        <h2>Стандартен формуляр за отказ</h2>
        <p>
          Не е задължително да използвате формуляра — можете да ни пишете и със свободен текст. Ако желаете, принтирайте го, попълнете го и ни
          го изпратете сканиран или сниман на{" "}
          <a href={`mailto:${s.email}`} className={link}>
            {s.email}
          </a>{" "}
          или по пощата. Можете и да копирате текста му в имейл. Ще потвърдим получаването на отказа по имейл. За въпроси: {s.phone}.
        </p>
        <PrintButton />
      </section>

      <section id="formular" className="border-2! border-dashed! text-[0.95rem] leading-relaxed">
        <p className="text-center text-xs font-bold text-muted!">Приложение № 6 към чл. 52, ал. 1, т. 8 от Закона за защита на потребителите</p>
        <h2 className="text-center text-xl!">Стандартен формуляр за упражняване правото на отказ</h2>
        <p className="text-center text-sm">(попълнете и изпратете настоящия формуляр единствено ако желаете да се откажете от договора)</p>
        <div className="mt-6! space-y-4">
          <Blank label="До:" value={trader} />
          <div>
            <p className="text-ink!">
              — С настоящото уведомявам/уведомяваме (*), че се отказвам/отказваме (*) от сключения от мен/нас (*) договор за покупка на
              следните стоки/за предоставяне на следната услуга (*)
            </p>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="mt-1 h-7 border-b border-dotted border-ink-soft" />
            ))}
          </div>
          <Blank label="Поръчано на (*)/получено на (*)" />
          <Blank label="Име на потребителя/ите" />
          <Blank label="Адрес на потребителя/ите" lines={2} />
          <Blank label="Подпис на потребителя/ите (само в случай, че настоящият формуляр е на хартия)" />
          <Blank label="Дата" />
          <p className="text-sm">(*) Ненужното се зачертава.</p>
        </div>

        <div className="mt-8! space-y-4 border-t border-line pt-5">
          <p className="text-sm font-bold">По желание (не е част от стандартния формуляр — помага ни да обработим отказа по-бързо):</p>
          <Blank label="Номер на поръчката" />
          <Blank label="Телефон или имейл за връзка" />
          <Blank label="IBAN за връщане на сумата (при плащане с наложен платеж)" />
        </div>
      </section>
    </InfoPage>
  );
}
