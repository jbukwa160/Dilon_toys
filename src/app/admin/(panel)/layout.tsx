import { requireAdmin } from "@/lib/auth";
import { orderCounts } from "@/lib/admin/orders";
import { getSettings } from "@/lib/settings";
import { unreadConversationCount } from "@/lib/chat";
import { AdminShell } from "@/components/admin/AdminShell";

// Pages check the session themselves too (layouts don't re-run on every navigation).
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const newOrders = orderCounts().new ?? 0;
  return (
    <AdminShell username={admin.username} storeName={getSettings().name} newOrders={newOrders} unreadChats={unreadConversationCount()}>
      {children}
    </AdminShell>
  );
}
