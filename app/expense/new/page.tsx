import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listCategories } from "@/lib/data/categories";
import { listAccounts } from "@/lib/data/accounts";
import { listLabels } from "@/lib/data/labels";
import { getRecentLabels } from "@/lib/data/expenses";
import { getCurrentUserId } from "@/lib/session";
import { ExpenseForm } from "@/components/expense-form";
import { addExpenseAction } from "@/lib/actions/expenses";

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
    <div className="mx-auto max-w-md px-4 py-6">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back to dashboard"
          className="hover:bg-accent inline-flex size-9 items-center justify-center rounded-full"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-semibold">Add Expense</h1>
      </header>

      <ExpenseForm
        action={addExpenseAction}
        categories={categories}
        accounts={accounts}
        labels={labels}
        defaultDate={todayInputValue()}
        labelSuggestions={labelSuggestions}
      />
    </div>
  );
}
