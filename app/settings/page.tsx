import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { listCategories } from "@/lib/data/categories";
import { getOverallMonthlyBudget } from "@/lib/data/budget";
import { listAccounts } from "@/lib/data/accounts";
import { listLabels } from "@/lib/data/labels";
import { getCurrentUser, getCurrentUserId } from "@/lib/session";
import { logoutAction } from "@/lib/actions/auth";
import { currentMonthKey } from "@/lib/dates";
import { isDbConfigured } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BudgetForm } from "@/components/settings/budget-form";
import { CategoryManager } from "@/components/settings/category-manager";
import { AccountManager } from "@/components/settings/account-manager";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { DataIO } from "@/components/settings/data-io";

export const metadata = { title: "Settings · Budget Tracker" };
export const dynamic = "force-dynamic";

const monthLabel = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
});

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  const user = await getCurrentUser();
  const [categories, budget, accounts, labels] = await Promise.all([
    listCategories(userId),
    getOverallMonthlyBudget(userId),
    listAccounts(userId),
    listLabels(userId),
  ]);

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section>
        <h2 className="mb-2 font-semibold">Accounts</h2>
        <AccountManager accounts={accounts} />
      </section>

      <section>
        <div className="mb-2">
          <h2 className="font-semibold">Monthly budget</h2>
          <p className="text-muted-foreground text-xs">
            {monthLabel.format(new Date())}
          </p>
        </div>
        <Card>
          <CardContent className="px-4 py-4">
            <BudgetForm currentAmount={budget} month={currentMonthKey()} />
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Appearance</h2>
        <ThemeToggle />
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Manage categories</h2>
        <CategoryManager categories={categories} />
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Labels</h2>
        <Link href="/labels">
          <Card>
            <CardContent className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex-1">
                <p className="font-medium">Manage labels</p>
                <p className="text-muted-foreground text-xs">
                  {labels.length} label{labels.length === 1 ? "" : "s"} ·
                  reusable tags for expenses
                </p>
              </div>
              <ChevronRight className="text-muted-foreground size-5" />
            </CardContent>
          </Card>
        </Link>
      </section>

      <section>
        <div className="mb-2">
          <h2 className="font-semibold">Data (Excel / CSV)</h2>
          <p className="text-muted-foreground text-xs">
            Export everything, or import expenses from a spreadsheet.
          </p>
        </div>
        <DataIO />
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Account</h2>
        <Card>
          <CardContent className="space-y-3 px-4 py-4">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="destructive" className="w-full">
                Log out
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">About</h2>
        <Card>
          <CardContent className="text-muted-foreground space-y-1 px-4 py-4 text-sm">
            <p>
              Currency: <span className="text-foreground">₹ INR</span>
            </p>
            <p>
              Storage:{" "}
              <span className="text-foreground">
                {isDbConfigured ? "MongoDB Atlas" : "In-memory (dev)"}
              </span>
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
