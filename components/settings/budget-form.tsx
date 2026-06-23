"use client";

import { useActionState } from "react";
import { setBudgetAction, type BudgetFormState } from "@/lib/actions/budget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: BudgetFormState = {};

export function BudgetForm({
  currentAmount,
  month,
}: {
  currentAmount: number | null;
  month: string;
}) {
  const [state, action, pending] = useActionState(setBudgetAction, initial);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="month" value={month} />
      <div className="flex items-end gap-3">
        <div className="relative flex-1">
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
            ₹
          </span>
          <Input
            key={currentAmount ?? "empty"}
            name="amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            placeholder="Set a monthly limit"
            defaultValue={currentAmount ?? ""}
            className="h-12 pl-8 text-lg font-semibold"
          />
        </div>
        <Button type="submit" disabled={pending} className="h-12">
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      {state.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : state.ok ? (
        <p className="text-sm text-emerald-600">Budget saved ✓</p>
      ) : (
        <p className="text-muted-foreground text-xs">
          Drives the “Remaining Budget” figure on your dashboard.
        </p>
      )}
    </form>
  );
}
