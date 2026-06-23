import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { listCategories } from "@/lib/data/categories";
import { listAccounts } from "@/lib/data/accounts";
import { listLabels } from "@/lib/data/labels";
import { getExpenseById, getRecentLabels } from "@/lib/data/expenses";
import { getCurrentUserId } from "@/lib/session";
import { ExpenseForm } from "@/components/expense-form";
import { updateExpenseAction } from "@/lib/actions/expenses";

export const metadata = { title: "Edit Expense · Budget Tracker" };
export const dynamic = "force-dynamic";

function toDateInput(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const [expense, categories, accounts, labels, labelSuggestions] =
    await Promise.all([
      getExpenseById(userId, id),
      listCategories(userId),
      listAccounts(userId),
      listLabels(userId),
      getRecentLabels(userId),
    ]);

  if (!expense) notFound();

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/expenses"
          aria-label="Back to expenses"
          className="hover:bg-accent inline-flex size-9 items-center justify-center rounded-full"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-semibold">Edit Expense</h1>
      </header>

      <ExpenseForm
        action={updateExpenseAction}
        categories={categories}
        accounts={accounts}
        labels={labels}
        defaultDate={toDateInput(expense.expenseDate)}
        expense={expense}
        labelSuggestions={labelSuggestions}
        submitLabel="Update expense"
      />
    </div>
  );
}
