import Link from "next/link";
import {
  Bell,
  CalendarClock,
  LineChart,
  PieChart,
  Plus,
  Settings as SettingsIcon,
} from "lucide-react";
import { getCurrentUserId } from "@/lib/session";
import { listAccounts } from "@/lib/data/accounts";
import { getDashboardStats, listExpenses } from "@/lib/data/expenses";
import {
  getBalanceTrend,
  getCategoryBreakdown,
  getExpenseStructure,
} from "@/lib/data/reports";
import { getUpcoming } from "@/lib/data/planned";
import { listLabels } from "@/lib/data/labels";
import { formatINR } from "@/lib/constants";
import {
  dueLabel,
  relativePast,
  startOfMonth,
  startOfWeek,
} from "@/lib/dates";
import { Card, CardContent } from "@/components/ui/card";
import { RecordIcon } from "@/components/home/record-icon";
import { ExpenseDonut } from "@/components/home/expense-donut";
import { BalanceArea } from "@/components/home/balance-area";
import { HomeTabs } from "@/components/home/home-tabs";
import { RecordsFilter } from "@/components/home/records-filter";
import { LabelChips } from "@/components/label-chips";
import { cn } from "@/lib/utils";

function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const dynamic = "force-dynamic";

function PctBadge({
  pct,
  goodWhenNegative,
}: {
  pct: number;
  goodWhenNegative: boolean;
}) {
  const good = goodWhenNegative ? pct <= 0 : pct >= 0;
  return (
    <div className="text-right">
      <p className="text-muted-foreground text-xs">vs past period</p>
      <p
        className={cn(
          "font-bold",
          good ? "text-emerald-500" : "text-destructive",
        )}
      >
        {pct > 0 ? "+" : ""}
        {Math.round(pct)}%
      </p>
    </div>
  );
}

function ShowMore({ href }: { href: string }) {
  return (
    <Link href={href} className="text-sm font-medium text-blue-500">
      Show more
    </Link>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string; rf?: string; rt?: string }>;
}) {
  const sp = await searchParams;
  const range = sp.r ?? "week";

  let recordsFrom: string | undefined;
  let recordsTo: string | undefined;
  if (range === "month") {
    recordsFrom = ymd(startOfMonth());
  } else if (range === "custom") {
    recordsFrom = sp.rf || undefined;
    recordsTo = sp.rt || undefined;
  } else {
    recordsFrom = ymd(startOfWeek());
  }

  const userId = await getCurrentUserId();
  // Fetch accounts first (seeds defaults exactly once, avoiding a race), then
  // fan out the rest — the balance trend reuses the total we already have.
  const accounts = await listAccounts(userId);
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const [stats, trend, structure, upcoming, breakdown, recordList, labels] =
    await Promise.all([
      getDashboardStats(userId),
      getBalanceTrend(userId, 30, totalBalance),
      getExpenseStructure(userId),
      getUpcoming(userId, 3),
      getCategoryBreakdown(userId),
      listExpenses(userId, { from: recordsFrom, to: recordsTo }),
      listLabels(userId),
    ]);

  const records = recordList.slice(0, 15);
  const labelById = new Map(labels.map((l) => [l.id, l]));
  const accountName = new Map(accounts.map((a) => [a.id, a.name]));

  const chip =
    "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium";

  const accountsView = (
    <div className="space-y-4">
      {/* Accounts */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs">Total balance</p>
            <p className="text-2xl font-bold">{formatINR(totalBalance)}</p>
          </div>
          <Link
            href="/settings"
            aria-label="Manage accounts"
            className="text-muted-foreground hover:bg-accent inline-flex size-9 items-center justify-center rounded-full"
          >
            <SettingsIcon className="size-5" />
          </Link>
        </div>
        <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="min-w-32 shrink-0 rounded-xl p-3 text-white"
              style={{ backgroundColor: a.color ?? "#3b82f6" }}
            >
              <p className="text-xs opacity-90">{a.name}</p>
              <p className="text-lg font-bold">{formatINR(a.balance)}</p>
            </div>
          ))}
          <Link
            href="/settings"
            className="text-muted-foreground hover:bg-accent flex min-w-32 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed py-3 text-sm"
          >
            <Plus className="size-5" />
            Add account
          </Link>
        </div>
      </section>

      {/* Quick chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        <a href="#balance" className={chip}>
          <LineChart className="size-4 text-blue-500" /> Balance
        </a>
        <a href="#spending" className={chip}>
          <PieChart className="size-4 text-orange-500" /> Spending
        </a>
        <a href="#planned" className={chip}>
          <CalendarClock className="size-4 text-amber-500" /> Planned
        </a>
      </div>

      {/* Balance Trend */}
      <Card id="balance">
        <CardContent className="px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Balance Trend</h2>
            <ShowMore href="/reports" />
          </div>
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="text-muted-foreground text-xs">TODAY</p>
              <p className="text-2xl font-bold">{formatINR(trend.current)}</p>
            </div>
            {trend.changePct !== null ? (
              <PctBadge pct={trend.changePct} goodWhenNegative={false} />
            ) : null}
          </div>
          <BalanceArea points={trend.points} />
        </CardContent>
      </Card>

      {/* Expenses structure */}
      <Card id="spending">
        <CardContent className="px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Expenses structure</h2>
            <ShowMore href="/reports" />
          </div>
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="text-muted-foreground text-xs">THIS WEEK</p>
              <p className="text-2xl font-bold">{formatINR(structure.total)}</p>
            </div>
            {structure.changePct !== null ? (
              <PctBadge pct={structure.changePct} goodWhenNegative={true} />
            ) : null}
          </div>
          <ExpenseDonut slices={structure.slices} total={structure.total} />
          {structure.slices.length > 0 ? (
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
              {structure.slices.map((s) => (
                <span
                  key={s.categoryId}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.categoryName}
                </span>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Last records */}
      <Card>
        <CardContent className="px-4 py-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h2 className="font-semibold">Last records</h2>
            <RecordsFilter />
          </div>
          {records.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No records in this period.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {records.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <RecordIcon icon={e.categoryIcon} color={e.categoryColor} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.categoryName}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {e.accountId ? (accountName.get(e.accountId) ?? "") : ""}
                      {e.label ? (
                        <span className="italic">
                          {e.accountId ? " · " : ""}
                          {e.label}
                        </span>
                      ) : null}
                    </p>
                    <LabelChips ids={e.labelIds} labelById={labelById} />
                  </div>
                  <div className="text-right">
                    <p className="text-destructive font-semibold">
                      −{formatINR(e.amount)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {relativePast(e.expenseDate)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {records.length > 0 ? (
            <div className="mt-3 text-center">
              <ShowMore href="/expenses" />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Upcoming planned payments */}
      <Card id="planned">
        <CardContent className="px-4 py-4">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-semibold">Upcoming planned payments</h2>
            <ShowMore href="/planned" />
          </div>
          {upcoming.items.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Nothing planned.{" "}
              <Link href="/planned/new" className="text-blue-500">
                Add one →
              </Link>
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {upcoming.items.map((i) => {
                const out = i.direction === "out";
                return (
                  <li key={i.id} className="flex items-center gap-3 py-2.5">
                    <RecordIcon
                      icon={i.categoryIcon ?? (out ? "📤" : "📥")}
                      color={i.categoryColor ?? (out ? "#22c55e" : "#22c55e")}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{i.label}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {i.categoryName ?? (out ? "Planned out" : "Expected in")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "font-semibold",
                          out ? "text-destructive" : "text-emerald-600",
                        )}
                      >
                        {out ? "−" : "+"}
                        {formatINR(i.amount)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {dueLabel(i.dueDate)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const overBudget =
    stats.monthlyBudget !== null && stats.monthSpend > stats.monthlyBudget;
  const budgetsView = (
    <div className="space-y-4">
      <Card>
        <CardContent className="px-4 py-4">
          <h2 className="mb-2 font-semibold">Monthly budget</h2>
          {stats.monthlyBudget === null ? (
            <p className="text-muted-foreground text-sm">
              No budget set.{" "}
              <Link href="/settings" className="text-blue-500">
                Set one →
              </Link>
            </p>
          ) : (
            <>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="font-medium">
                  {formatINR(stats.monthSpend)} spent
                </span>
                <span className="text-muted-foreground">
                  of {formatINR(stats.monthlyBudget)}
                </span>
              </div>
              <div className="bg-muted h-2.5 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (stats.monthSpend / stats.monthlyBudget) * 100)}%`,
                    backgroundColor: overBudget ? "#ef4444" : "#22c55e",
                  }}
                />
              </div>
              <p className="text-muted-foreground mt-1.5 text-xs">
                {overBudget
                  ? `${formatINR(Math.abs(stats.remainingBudget ?? 0))} over budget`
                  : `${formatINR(stats.remainingBudget ?? 0)} remaining`}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-4 py-4">
          <h2 className="mb-2 font-semibold">This month by category</h2>
          {breakdown.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No spending this month yet.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {breakdown.map((b) => (
                <li
                  key={b.categoryId}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: b.color }}
                  />
                  <span className="flex-1 truncate">{b.categoryName}</span>
                  <span className="font-medium tabular-nums">
                    {formatINR(b.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="mx-auto max-w-md px-4 py-4">
      <header className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Home</h1>
        <Link
          href="/planned"
          aria-label="Upcoming"
          className="text-muted-foreground hover:bg-accent inline-flex size-9 items-center justify-center rounded-full"
        >
          <Bell className="size-5" />
        </Link>
      </header>

      <HomeTabs accountsView={accountsView} budgetsView={budgetsView} />
    </div>
  );
}
