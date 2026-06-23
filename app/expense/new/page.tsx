import { listCategories } from "@/lib/data/categories";
import { listAccounts } from "@/lib/data/accounts";
import { listLabels } from "@/lib/data/labels";
import { getRecentLabels } from "@/lib/data/expenses";
import { getCurrentUserId } from "@/lib/session";
import { ExpenseCalculator } from "@/components/expense-calculator";
import { addRecordAction } from "@/lib/actions/quick-add";

export const metadata = { title: "Add Expense · Budget Tracker" };
export const dynamic = "force-dynamic";

function todayInputValue(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default async function NewExpensePage() {
  const userId = await getCurrentUserId();
  const [categories, accounts, labels, labelSuggestions] = await Promise.all([
    listCategories(userId),
    listAccounts(userId),
    listLabels(userId),
    getRecentLabels(userId),
  ]);

  return (
    <ExpenseCalculator
      action={addRecordAction}
      categories={categories}
      accounts={accounts}
      labels={labels}
      defaultDate={todayInputValue()}
      labelSuggestions={labelSuggestions}
    />
  );
}
