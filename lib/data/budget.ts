import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { Budget } from "@/lib/models/budget";
import { memGetBudgets, memSetBudget } from "@/lib/data/memory-store";
import { currentMonthKey } from "@/lib/dates";

// The overall monthly budget is the Budget doc with no categoryId.
export async function getOverallMonthlyBudget(
  userId: string,
  month: string = currentMonthKey(),
): Promise<number | null> {
  if (!isDbConfigured) {
    const b = memGetBudgets(userId).find(
      (x) => x.month === month && x.categoryId === null,
    );
    return b?.amount ?? null;
  }

  await connectToDatabase();
  const docs = await Budget.find({ userId, month }).lean();
  const overall = docs.find((d) => !d.categoryId);
  return overall?.amount ?? null;
}

export async function setOverallMonthlyBudget(
  userId: string,
  amount: number,
  month: string = currentMonthKey(),
): Promise<void> {
  if (!isDbConfigured) {
    memSetBudget(userId, { amount, month, categoryId: null });
    return;
  }

  await connectToDatabase();
  const docs = await Budget.find({ userId, month });
  const overall = docs.find((d) => !d.categoryId);
  if (overall) {
    overall.amount = amount;
    await overall.save();
  } else {
    await Budget.create({ userId, amount, month });
  }
}
