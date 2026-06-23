import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Plus, Repeat } from "lucide-react";
import { getCurrentUserId } from "@/lib/session";
import { listPlanned } from "@/lib/data/planned";
import { formatINR } from "@/lib/constants";
import { dueLabel } from "@/lib/dates";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlannedRowActions } from "@/components/planned/planned-row-actions";

export const metadata = { title: "Planned · Budget Tracker" };
export const dynamic = "force-dynamic";

const freqLabel: Record<"weekly" | "monthly" | "yearly", string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export default async function PlannedPage() {
  const userId = await getCurrentUserId();
  const items = await listPlanned(userId);

  const totalOut = items
    .filter((i) => i.direction === "out")
    .reduce((s, i) => s + i.amount, 0);
  const totalIn = items
    .filter((i) => i.direction === "in")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Upcoming &amp; scheduled</p>
          <h1 className="text-2xl font-bold">Planned</h1>
        </div>
        <Link
          href="/planned/new"
          className={cn(buttonVariants({ size: "sm" }), "gap-1")}
        >
          <Plus className="size-4" /> Add
        </Link>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-muted-foreground text-xs">Planned out</p>
            <p className="mt-1 text-xl font-bold">{formatINR(totalOut)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-muted-foreground text-xs">Expected in</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">
              {formatINR(totalIn)}
            </p>
          </CardContent>
        </Card>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground px-4 py-10 text-center text-sm">
            Nothing planned yet.
            <br />
            Add subscriptions, bills, or money you expect to receive.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="px-4 py-0">
            <ul className="divide-border divide-y">
              {items.map((i) => {
                const out = i.direction === "out";
                const Icon = out ? ArrowUpRight : ArrowDownLeft;
                return (
                  <li key={i.id} className="flex items-center gap-3 py-3">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full",
                        out
                          ? "bg-destructive/10 text-destructive"
                          : "bg-emerald-600/10 text-emerald-600",
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{i.label}</p>
                      <p className="text-muted-foreground flex flex-wrap items-center gap-x-1 text-xs">
                        <span>{dueLabel(i.dueDate)}</span>
                        {i.counterparty ? (
                          <span>
                            · {out ? "to" : "from"} {i.counterparty}
                          </span>
                        ) : null}
                        {i.recurring && i.frequency ? (
                          <span className="inline-flex items-center gap-0.5">
                            · <Repeat className="size-3" />
                            {freqLabel[i.frequency]}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 font-semibold",
                        out ? "" : "text-emerald-600",
                      )}
                    >
                      {out ? "" : "+"}
                      {formatINR(i.amount)}
                    </span>
                    <PlannedRowActions id={i.id} direction={i.direction} />
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
