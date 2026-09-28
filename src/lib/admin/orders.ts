import "server-only";
import { storeDb } from "@/lib/db";
import type { OrderDelivery, OrderLine } from "@/lib/checkout";

export const ORDER_STATUSES = {
  new: { label: "Нова", color: "bg-sun-soft text-ink" },
  confirmed: { label: "Потвърдена", color: "bg-sky-soft text-sky" },
  shipped: { label: "Изпратена", color: "bg-grape-soft text-grape" },
  delivered: { label: "Доставена", color: "bg-mint-soft text-mint" },
  cancelled: { label: "Отказана", color: "bg-line text-muted" },
} as const;
export type OrderStatus = keyof typeof ORDER_STATUSES;

export type AdminOrder = {
  id: string;
  number: number;
  createdAt: string;
  status: OrderStatus;
  customer: { firstName: string; lastName: string; phone: string; email: string };
  delivery: OrderDelivery;
  payment: string;
  items: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  points: number;
  note: string | null;
  adminNote: string | null;
};

type Row = {
  id: string;
  number: number;
  created_at: string;
  status: string;
  customer: string;
  delivery: string;
  payment: string;
  items: string;
  subtotal: number;
  shipping: number;
  total: number;
  points: number;
  note: string | null;
  admin_note: string | null;
};

function toOrder(r: Row): AdminOrder {
  return {
    id: r.id,
    number: r.number,
    createdAt: r.created_at,
    status: (r.status in ORDER_STATUSES ? r.status : "new") as OrderStatus,
    customer: JSON.parse(r.customer),
    delivery: JSON.parse(r.delivery),
    payment: r.payment,
    items: JSON.parse(r.items),
    subtotal: r.subtotal,
    shipping: r.shipping,
    total: r.total,
    points: r.points,
    note: r.note,
    adminNote: r.admin_note,
  };
}

export function listOrders(status: string, page: number, perPage = 30) {
  const db = storeDb();
  const where = status in ORDER_STATUSES ? "WHERE status = ?" : "";
  const params = status in ORDER_STATUSES ? [status] : [];
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM orders ${where}`).get(...params) as { n: number }).n;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const p = Math.min(Math.max(1, page), pageCount);
  const items = (db.prepare(`SELECT * FROM orders ${where} ORDER BY number DESC LIMIT ? OFFSET ?`).all(...params, perPage, (p - 1) * perPage) as Row[]).map(toOrder);
  return { items, total, page: p, pageCount };
}

export function orderCounts(): Record<string, number> {
  const rows = storeDb().prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status").all() as { status: string; n: number }[];
  const out: Record<string, number> = { all: 0 };
  for (const r of rows) {
    out[r.status] = r.n;
    out.all += r.n;
  }
  return out;
}

export function getOrder(id: string): AdminOrder | null {
  const r = storeDb().prepare("SELECT * FROM orders WHERE id = ?").get(id) as Row | undefined;
  return r ? toOrder(r) : null;
}

export function salesSummary() {
  return storeDb()
    .prepare(
      `SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue,
         COALESCE(SUM(CASE WHEN created_at >= ? THEN total END), 0) AS revenue30
       FROM orders WHERE status <> 'cancelled'`,
    )
    .get(new Date(Date.now() - 30 * 86400_000).toISOString()) as { orders: number; revenue: number; revenue30: number };
}
