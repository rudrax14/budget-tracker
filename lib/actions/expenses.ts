"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import {
  createExpense,
  deleteExpense,
  getExpenseById,
  updateExpense,
} from "@/lib/data/expenses";
import { listCategories } from "@/lib/data/categories";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";
import type { NewExpenseInput } from "@/lib/data/types";

export interface ExpenseFormState {
  error?: string;
}

type ParseResult =
  | { ok: true; value: NewExpenseInput }
  | { ok: false; error: string };

function parseExpenseForm(formData: FormData): ParseResult {
  const amount = Number(formData.get("amount"));
  const categoryId = String(formData.get("categoryId") ?? "");
  const accountId = String(formData.get("accountId") ?? "").trim();
  const labelIds = formData
    .getAll("labelIds")
    .map((v) => String(v))
    .filter(Boolean);
  const label = String(formData.get("label") ?? "").trim();
  const paymentMethod = String(formData.get("paymentMethod") ?? "") as PaymentMethod;
  const dateStr = String(formData.get("expenseDate") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!amount || amount <= 0) return { ok: false, error: "Enter a valid amount." };
  // Category is the required field. The title is optional — when left blank it
  // falls back to the category name (see resolveLabel).
  if (!categoryId) return { ok: false, error: "Pick a category." };
  if (!PAYMENT_METHODS.includes(paymentMethod))
    return { ok: false, error: "Pick a payment method." };
  if (!dateStr) return { ok: false, error: "Pick a date." };

  const expenseDate = new Date(dateStr);
  if (Number.isNaN(expenseDate.getTime()))
    return { ok: false, error: "Invalid date." };

  return {
    ok: true,
    value: {
      amount,
      categoryId,
      accountId: accountId || undefined,
      labelIds,
      label,
      note: note || undefined,
      paymentMethod,
      expenseDate,
    },
  };
}

// Title is optional; when it's blank, use the chosen category's name as the
// display title so records/lists never render an empty label.
async function resolveLabel(
  userId: string,
  value: NewExpenseInput,
): Promise<NewExpenseInput> {
  if (value.label) return value;
  const categories = await listCategories(userId);
  const category = categories.find((c) => c.id === value.categoryId);
  return { ...value, label: category?.name ?? "Expense" };
}

export async function addExpenseAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const parsed = parseExpenseForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const userId = await getCurrentUserId();
  await createExpense(userId, await resolveLabel(userId, parsed.value));

  revalidatePath("/");
  revalidatePath("/expenses");
  redirect("/");
}

export async function updateExpenseAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing expense id." };

  const parsed = parseExpenseForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const userId = await getCurrentUserId();
  const updated = await updateExpense(
    userId,
    id,
    await resolveLabel(userId, parsed.value),
  );
  if (!updated) return { error: "Expense not found." };

  revalidatePath("/");
  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function deleteExpenseAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const userId = await getCurrentUserId();
  await deleteExpense(userId, id);

  revalidatePath("/");
  revalidatePath("/expenses");
}

// Copies an existing expense as a new one dated today.
export async function duplicateExpenseAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const userId = await getCurrentUserId();
  const existing = await getExpenseById(userId, id);
  if (!existing) return;

  await createExpense(userId, {
    amount: existing.amount,
    categoryId: existing.categoryId,
    label: existing.label,
    note: existing.note,
    paymentMethod: existing.paymentMethod,
    expenseDate: new Date(),
  });

  revalidatePath("/");
  revalidatePath("/expenses");
}
