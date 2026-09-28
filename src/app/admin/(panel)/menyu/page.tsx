import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getMenu } from "@/lib/settings";
import { getGifts } from "@/lib/gifts";
import { getLinkOptions } from "@/lib/admin/link-options";
import { PageHeader } from "@/components/admin/PageHeader";
import { MenuEditor } from "@/components/admin/MenuEditor";

export const metadata: Metadata = { title: "Меню" };

export default async function MenuPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Меню"
        description="Лентата под търсачката: бутонът „Всички категории“, връзки и падащи менюта с колони. Изберете надпис, цвят и иконка за всеки елемент."
      />
      <MenuEditor initial={getMenu()} linkOptions={getLinkOptions()} giftsEnabled={getGifts().enabled} />
    </>
  );
}
