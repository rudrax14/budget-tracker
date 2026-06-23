import Link from "next/link";
import { Pencil } from "lucide-react";
import { listExpenses } from "@/lib/data/expenses";
import { listCategories } from "@/lib/data/categories";
import { listLabels } from "@/lib/data/labels";
import { LabelChips } from "@/components/label-chips";
import { getCurrentUserId } from "@/lib/session";
import { formatINR } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { ExpensesFilter } from "@/components/expenses/expenses-filter";
import { DeleteExpenseButton } from "@/components/expenses/delete-expense-button";
import { DuplicateExpenseButton } from "@/components/expenses/duplicate-expense-button";

export const metadata = { title: "Expenses · Budget Tracker" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const sp = await searchParams;
  const userId = await getCurrentUserId();
  const [categories, expenses, labels] = await Promise.all([
    listCategories(userId),
    listExpenses(userId, {
      search: sp.q,
      categoryId: sp.category,
      from: sp.from,
      to: sp.to,
    }),
    listLabels(userId),
  ]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const labelById = new Map(labels.map((l) => [l.id, l]));

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Expenses</h1>

      <ExpensesFilter categories={categories} />

      <p className="text-muted-foreground mb-3 text-sm">
        {expenses.length} {expenses.length === 1 ? "expense" : "expenses"} ·{" "}
        <span className="text-foreground font-medium">{formatINR(total)}</span>
      </p>

      {expenses.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground px-4 py-10 text-center text-sm">
            No expenses match your filters.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="px-4 py-0">
            <ul className="divide-border divide-y">
              {expenses.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-lg"
                    style={{
                      backgroundColor: (e.categoryColor ?? "#64748b") + "22",
                    }}
                  >
                    {e.categoryIcon ?? "📦"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {e.categoryName} · {e.paymentMethod} ·{" "}
                      {dateFmt.format(new Date(e.expenseDate))}
                    </p>
                    {e.note ? (
                      <p className="text-muted-foreground/80 truncate text-xs italic">
                        {e.note}
                      </p>
                    ) : null}
                    <LabelChips ids={e.labelIds} labelById={labelById} />
                  </div>
                  <span className="font-semibold">{formatINR(e.amount)}</span>
                  <div className="flex items-center">
                    <DuplicateExpenseButton id={e.id} />
                    <Link
                      href={`/expense/${e.id}/edit`}
                      aria-label="Edit expense"
                      className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex size-9 items-center justify-center rounded-full transition-colors"
                    >
                      <Pencil className="size-4" />
                    </Link>
                    <DeleteExpenseButton id={e.id} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
