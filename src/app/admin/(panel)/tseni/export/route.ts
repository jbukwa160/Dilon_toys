import { getAdmin } from "@/lib/auth";
import { exportPricesCsv, exportPricesXlsx } from "@/lib/admin/prices";
import { findCategoryOrSub } from "@/lib/categories";

// Spreadsheet with all prices, for editing in Excel. Admins only.
export async function GET(req: Request) {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const kat = url.searchParams.get("kat") ?? "";
  const valid = !kat || !!findCategoryOrSub(kat);
  const category = valid ? kat : "";
  const csv = url.searchParams.get("format") === "csv";
  const date = new Date().toISOString().slice(0, 10);
  const name = `ceni-${category || "vsichki"}-${date}.${csv ? "csv" : "xlsx"}`;
  const body = csv ? exportPricesCsv(category) : await exportPricesXlsx(category);
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": csv ? "text/csv; charset=utf-8" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
