"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/session";
import { setOverallMonthlyBudget } from "@/lib/data/budget";
import { currentMonthKey } from "@/lib/dates";

export interface BudgetFormState {
  error?: string;
  ok?: boolean;
}

export async function setBudgetAction(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const amount = Number(formData.get("amount"));
  const month = String(formData.get("month") ?? "") || currentMonthKey();

  if (Number.isNaN(amount) || amount < 0) {
    return { error: "Enter a valid budget amount." };
  }

  const userId = await getCurrentUserId();
  await setOverallMonthlyBudget(userId, amount, month);

  revalidatePath("/");
  revalidatePath("/settings");
  return { ok: true };
}
