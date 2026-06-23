"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function HomeTabs({
  accountsView,
  budgetsView,
}: {
  accountsView: React.ReactNode;
  budgetsView: React.ReactNode;
}) {
  const [tab, setTab] = useState<"accounts" | "budgets">("accounts");

  return (
    <>
      <div className="mb-4 flex border-b">
        {(["accounts", "budgets"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px flex-1 border-b-2 pb-2.5 text-sm font-medium transition-colors",
              tab === t
                ? "border-primary text-foreground"
                : "text-muted-foreground border-transparent",
            )}
          >
            {t === "accounts" ? "Accounts" : "Budgets & Goals"}
          </button>
        ))}
      </div>
      {tab === "accounts" ? accountsView : budgetsView}
    </>
  );
}
