import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { storeDb } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { PasswordForm } from "@/components/admin/PasswordForm";

export const metadata: Metadata = { title: "Профил и парола" };

export default async function ProfilePage() {
  const admin = await requireAdmin();
  const db = storeDb();
  const user = db.prepare("SELECT created_at, last_login_at FROM admin_users WHERE id = ?").get(admin.id) as { created_at: string; last_login_at: string | null };
  const sessions = (db.prepare("SELECT COUNT(*) AS n FROM admin_sessions WHERE user_id = ? AND expires_at > ?").get(admin.id, new Date().toISOString()) as { n: number }).n;
  return (
    <>
      <PageHeader title="Профил и парола" />
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        <PasswordForm />
        <section className="rounded-3xl border border-line bg-white p-6">
          <h2 className="text-lg font-black">Вашият профил</h2>
          <dl className="mt-3 space-y-2 text-[0.95rem]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Потребител</dt>
              <dd className="font-bold">{admin.username}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Създаден</dt>
              <dd className="font-bold">{formatDateTime(user.created_at)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Последен вход</dt>
              <dd className="font-bold">{user.last_login_at ? formatDateTime(user.last_login_at) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Активни устройства</dt>
              <dd className="font-bold">{sessions}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-muted">При смяна на паролата всички други устройства се изписват автоматично.</p>
        </section>
      </div>
    </>
  );
}
