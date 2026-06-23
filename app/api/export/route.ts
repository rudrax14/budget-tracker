import { getCurrentUserId } from "@/lib/session";
import { buildExpensesCsv, buildWorkbook } from "@/lib/data/import-export";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const userId = await getCurrentUserId();
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const csv = await buildExpensesCsv(userId);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="expenses-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const data = await buildWorkbook(userId);
  return new Response(
    new Blob([data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="budget-export-${stamp}.xlsx"`,
        "Cache-Control": "no-store",
      },
    },
  );
}
