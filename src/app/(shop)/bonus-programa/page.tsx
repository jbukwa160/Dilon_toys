import { getSettings } from "@/lib/settings";
import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Бонус програма", description: "Събирайте бонус точки с всяка покупка на играчки." };

export default function BonusPage() {
  const s = getSettings();
  const per100 = formatPrice(100 * s.points.redeemValue);
  return (
    <InfoPage title="Бонус програма" intro={`Всяка покупка ви носи бонус точки: ${s.points.perEuro} точка за всеки похарчен 1 €.`}>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["1", "Пазарувате", "Точките за всеки продукт се виждат в карточката му и в количката."],
          ["2", "Трупате точки", "След доставка на поръчката точките се записват към вашия имейл."],
          ["3", "Ползвате отстъпка", `Всеки 100 точки се равняват на ${per100} отстъпка при следваща поръчка.`],
        ].map(([n, t, d]) => (
          <div key={n} className="rounded-3xl bg-grape-soft p-6">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-grape font-black text-white">{n}</span>
            <h2 className="mt-4 !text-xl">{t}</h2>
            <p className="mt-1">{d}</p>
          </div>
        ))}
      </div>
      <section>
        <h2>Как се изчисляват точките</h2>
        <ul>
          <li>Получавате {s.points.perEuro} точка за всяко цяло евро от стойността на продуктите (без доставката).</li>
          <li>Пример: поръчка за 57,80 € носи 57 бонус точки.</li>
          <li>При връщане на продукт точките за него се анулират.</li>
        </ul>
      </section>
      <p>
        <Link href="/igrachki" className="btn btn-primary h-12 px-8">
          Започни да събираш точки
        </Link>
      </p>
    </InfoPage>
  );
}
