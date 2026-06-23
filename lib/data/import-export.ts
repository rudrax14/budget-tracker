import * as XLSX from "xlsx";
import { listCategories } from "@/lib/data/categories";
import { listExpenses, createExpense } from "@/lib/data/expenses";
import { listTransfers } from "@/lib/data/transfers";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";

export interface ImportResult {
  imported: number;
  skipped: number;
}

function pick(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== "") return row[k];
  }
  return undefined;
}

// Parses an .xlsx/.csv buffer and creates expenses. Tolerant of column
// casing and matches categories by name (falling back to "Others").
export async function importExpensesFromBuffer(
  userId: string,
  buf: Buffer,
): Promise<ImportResult> {
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return { imported: 0, skipped: 0 };

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const categories = await listCategories(userId);
  const byName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
  const fallback = categories.find((c) => c.name === "Others") ?? categories[0];

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const amount = Number(pick(row, "Amount", "amount"));
    const label = String(pick(row, "Label", "label") ?? "").trim();
    const dateRaw = pick(row, "Date", "date");
    const catName = String(pick(row, "Category", "category") ?? "")
      .trim()
      .toLowerCase();
    const pmRaw = String(
      pick(row, "Payment Method", "PaymentMethod", "Payment", "payment") ?? "",
    ).trim();
    const note = String(pick(row, "Note", "note") ?? "").trim();

    const date =
      dateRaw instanceof Date ? dateRaw : new Date(String(dateRaw ?? ""));

    if (!amount || amount <= 0 || !label || Number.isNaN(date.getTime())) {
      skipped++;
      continue;
    }

    const category = (catName ? byName.get(catName) : undefined) ?? fallback;
    const paymentMethod: PaymentMethod = PAYMENT_METHODS.includes(
      pmRaw as PaymentMethod,
    )
      ? (pmRaw as PaymentMethod)
      : "UPI";

    await createExpense(userId, {
      amount,
      categoryId: category.id,
      label,
      note: note || undefined,
      paymentMethod,
      expenseDate: date,
    });
    imported++;
  }

  return { imported, skipped };
}

function dateOnly(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

// Builds an .xlsx workbook (Expenses + Transfers sheets) as a byte array.
export async function buildWorkbook(
  userId: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const [expenses, transfers] = await Promise.all([
    listExpenses(userId, {}),
    listTransfers(userId),
  ]);

  const expRows = expenses.map((e) => ({
    Date: dateOnly(e.expenseDate),
    Amount: e.amount,
    Category: e.categoryName,
    Label: e.label,
    "Payment Method": e.paymentMethod,
    Note: e.note ?? "",
  }));

  const trRows = transfers.map((t) => ({
    Date: dateOnly(t.transferDate),
    Type: t.direction === "in" ? "Received" : "Sent",
    Amount: t.amount,
    Person: t.person,
    "Payment Method": t.paymentMethod ?? "",
    Note: t.note ?? "",
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(expRows),
    "Expenses",
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(trRows),
    "Transfers",
  );

  // Copy into a fresh ArrayBuffer-backed array (valid BlobPart / BodyInit).
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
  return new Uint8Array(out);
}

// Expenses-only CSV.
export async function buildExpensesCsv(userId: string): Promise<string> {
  const expenses = await listExpenses(userId, {});
  const rows = expenses.map((e) => ({
    Date: dateOnly(e.expenseDate),
    Amount: e.amount,
    Category: e.categoryName,
    Label: e.label,
    "Payment Method": e.paymentMethod,
    Note: e.note ?? "",
  }));
  return XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(rows));
}
