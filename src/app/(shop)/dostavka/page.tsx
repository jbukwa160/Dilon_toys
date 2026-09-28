import { getSettings } from "@/lib/settings";
import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Доставка и плащане" };

const link = "font-bold text-brand underline";

export default function DeliveryPage() {
  const s = getSettings();
  const days = Math.max(14, s.returnDays);
  const courierPrices = s.shipping.mode === "courier";
  return (
    <InfoPage title="Доставка и плащане" intro={`Доставяме в цялата страна за ${s.deliveryDays}. Безплатна доставка за поръчки над ${formatPrice(s.shipping.freeOver)}.`}>
      <section>
        <h2>Цени за доставка</h2>
        <ul>
          <li>
            До офис на Еконт или Спиди — {courierPrices ? "ориентировъчно " : ""}
            {formatPrice(s.shipping.office)}
          </li>
          <li>
            До адрес с куриер — {courierPrices ? "ориентировъчно " : ""}
            {formatPrice(s.shipping.address)}
          </li>
          <li>
            <strong>Безплатна доставка</strong> за всички поръчки над {formatPrice(s.shipping.freeOver)}
          </li>
        </ul>
        <p>
          Цените са в евро с включен ДДС. Цената на доставката не е включена в цената на продуктите и се показва отделно във формата за поръчка,
          преди да потвърдите поръчката.
          {courierPrices
            ? " Точната цена се изчислява по тарифата на куриера според теглото на пратката и мястото на доставка; при наложен платеж тя включва и таксата на куриера за наложения платеж."
            : null}
        </p>
      </section>
      <section>
        <h2>Срок за доставка</h2>
        <p>
          Поръчките с налични продукти се обработват в рамките на един работен ден и се доставят за {s.deliveryDays}. Ще получите обаждане или
          съобщение за потвърждение на поръчката.
        </p>
      </section>
      <section>
        <h2>Начини на плащане</h2>
        <ul>
          <li>Наложен платеж — плащате на куриера при получаване, в брой или с карта.</li>
          <li>Банков превод — изпращаме данни за плащане след потвърждение на поръчката.</li>
        </ul>
      </section>
      <section id="vrashtane">
        <h2>Връщане и замяна</h2>
        <p>
          Имате право да се откажете от покупката в срок от {days} дни от получаването на стоката, без да посочвате причина. Можете да
          разопаковате и разгледате продукта, както бихте го направили в магазин. Връщаме парите не по-късно от 14 дни от получаването на
          уведомлението ви за отказ. Стъпките, разходите за връщане и стандартният формуляр за отказ са на страница{" "}
          <Link href="/otkaz" className={link}>
            Отказ от поръчка
          </Link>
          .
        </p>
        <p>
          Ако предпочитате да замените продукта с друг, свържете се с нас на {s.phone} или {s.email}.
        </p>
      </section>
      <section id="reklamatsii">
        <h2>Дефектен продукт (рекламации)</h2>
        <p>
          За всички продукти важи законовата гаранция от 2 години от доставката. Ако продуктът е дефектен или не отговаря на описанието, пишете
          ни на {s.email} с номера на поръчката и описание на проблема. Подробности — в{" "}
          <Link href="/obshti-usloviya#garantsiya" className={link}>
            Общите условия
          </Link>
          . Как се изхвърлят батерии и електронни играчки —{" "}
          <Link href="/obshti-usloviya#baterii" className={link}>
            тук
          </Link>
          .
        </p>
      </section>
    </InfoPage>
  );
}
