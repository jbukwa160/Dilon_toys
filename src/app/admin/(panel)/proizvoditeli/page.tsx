import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { listBrandManufacturers } from "@/lib/manufacturers";
import { PageHeader } from "@/components/admin/PageHeader";
import { ManufacturersEditor } from "@/components/admin/ManufacturersEditor";

export const metadata: Metadata = { title: "Производители" };

export default async function ManufacturersPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Производители (GPSR)"
        description="По регламента за обща безопасност на продуктите (GPSR) на всяка обява трябва да има име, пощенски адрес и имейл на производителя, а ако той е извън ЕС — и на отговорното лице в ЕС. Попълнете ги веднъж за всяка марка и те ще се показват при всички нейни продукти."
      />
      <ManufacturersEditor brands={listBrandManufacturers()} />
    </>
  );
}
