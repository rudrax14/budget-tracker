import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus } from "lucide-react";
import { getCurrentUserId } from "@/lib/session";
import { getTransferTotals, listTransfers } from "@/lib/data/transfers";
import { formatINR } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TransferDeleteButton } from "@/components/transfers/transfer-delete-button";

export const metadata = { title: "Send & Receive · Budget Tracker" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

export default async function TransfersPage() {
  const userId = await getCurrentUserId();
  const [transfers, totals] = await Promise.all([
    listTransfers(userId),
    getTransferTotals(userId),
  ]);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Money you send &amp; receive</p>
          <h1 className="text-2xl font-bold">Send &amp; Receive</h1>
        </div>
        <Link
          href="/transfers/new"
          className={cn(buttonVariants({ size: "sm" }), "gap-1")}
        >
          <Plus className="size-4" /> Add
        </Link>
      </header>

      <Card className="mb-5">
        <CardContent className="grid grid-cols-3 divide-x divide-border px-0 py-3 text-center">
          <div>
            <p className="text-muted-foreground text-xs">Received</p>
            <p className="mt-1 font-bold text-emerald-600">
              {formatINR(totals.received)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Sent</p>
            <p className="mt-1 font-bold">{formatINR(totals.sent)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Net</p>
            <p
              className={cn(
                "mt-1 font-bold",
                totals.net >= 0 ? "text-emerald-600" : "text-destructive",
              )}
            >
              {totals.net >= 0 ? "+" : ""}
              {formatINR(totals.net)}
            </p>
          </div>
        </CardContent>
      </Card>

      {transfers.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground px-4 py-10 text-center text-sm">
            No transfers yet.
            <br />
            Log money you send to or receive from people.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="px-4 py-0">
            <ul className="divide-border divide-y">
              {transfers.map((t) => {
                const sent = t.direction === "out";
                const Icon = sent ? ArrowUpRight : ArrowDownLeft;
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full",
                        sent
                          ? "bg-destructive/10 text-destructive"
                          : "bg-emerald-600/10 text-emerald-600",
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {sent ? "To" : "From"} {t.person}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {dateFmt.format(new Date(t.transferDate))}
                        {t.paymentMethod ? ` · ${t.paymentMethod}` : ""}
                        {t.note ? ` · ${t.note}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 font-semibold",
                        sent ? "" : "text-emerald-600",
                      )}
                    >
                      {sent ? "−" : "+"}
                      {formatINR(t.amount)}
                    </span>
                    <div className="flex items-center">
                      <Link
                        href={`/transfers/${t.id}/edit`}
                        aria-label="Edit transfer"
                        className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex size-9 items-center justify-center rounded-full transition-colors"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <TransferDeleteButton id={t.id} />
                    </div>
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
