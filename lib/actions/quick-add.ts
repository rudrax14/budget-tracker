"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import { createExpense } from "@/lib/data/expenses";
import { listCategories } from "@/lib/data/categories";
import { createTransfer } from "@/lib/data/transfers";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";

export interface RecordFormState {
  error?: string;
}

// One action behind the calculator's Income / Expense / Transfer tabs.
//  - expense  → an Expense (category + account)
//  - income   → a Transfer received  (direction "in",  person = "from")
//  - transfer → a Transfer sent       (direction "out", person = "to")
export async function addRecordAction(
  _prev: RecordFormState,
  formData: FormData,
): Promise<RecordFormState> {
  const kind = String(formData.get("kind") ?? "expense");

  const amount = Number(formData.get("amount"));
  const accountId = String(formData.get("accountId") ?? "").trim() || undefined;
  const note = String(formData.get("note") ?? "").trim() || undefined;
  const dateStr = String(formData.get("date") ?? "");
  const pmRaw = String(formData.get("paymentMethod") ?? "");
  const paymentMethod = PAYMENT_METHODS.includes(pmRaw as PaymentMethod)
    ? (pmRaw as PaymentMethod)
    : undefined;

  if (!amount || amount <= 0) return { error: "Enter a valid amount." };
  if (!dateStr) return { error: "Pick a date." };
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return { error: "Invalid date." };

  const userId = await getCurrentUserId();

  // ---- Income / Transfer → a Transfer record ----
  if (kind === "income" || kind === "transfer") {
    const person = String(formData.get("person") ?? "").trim();
    if (!person)
      return { error: kind === "income" ? "Who is it from?" : "Who is it to?" };

    await createTransfer(userId, {
      direction: kind === "income" ? "in" : "out",
      amount,
      person,
      accountId,
      note,
      paymentMethod,
      transferDate: date,
    });

    revalidatePath("/transfers");
    revalidatePath("/");
    redirect("/transfers");
  }

  // ---- Expense ----
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!categoryId) return { error: "Pick a category." };
  if (!paymentMethod) return { error: "Pick a payment method." };

  const labelIds = formData
    .getAll("labelIds")
    .map((v) => String(v))
    .filter(Boolean);

  // Title is optional — fall back to the category name.
  let label = String(formData.get("label") ?? "").trim();
  if (!label) {
    const categories = await listCategories(userId);
    label = categories.find((c) => c.id === categoryId)?.name ?? "Expense";
  }

  await createExpense(userId, {
    amount,
    categoryId,
    accountId,
    labelIds,
    label,
    note,
    paymentMethod,
    expenseDate: date,
  });

  revalidatePath("/");
  revalidatePath("/expenses");
  redirect("/");
}
