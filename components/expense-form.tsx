"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { ExpenseFormState } from "@/lib/actions/expenses";
import { PAYMENT_METHODS } from "@/lib/constants";
import type {
  AccountDTO,
  CategoryDTO,
  ExpenseDTO,
  LabelDTO,
} from "@/lib/data/types";
import { LabelPicker } from "@/components/label-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const initialState: ExpenseFormState = {};

type ExpenseAction = (
  state: ExpenseFormState,
  formData: FormData,
) => Promise<ExpenseFormState>;

export function ExpenseForm({
  action,
  categories,
  accounts = [],
  labels = [],
  defaultDate,
  expense,
  labelSuggestions = [],
  submitLabel = "Save expense",
}: {
  action: ExpenseAction;
  categories: CategoryDTO[];
  accounts?: AccountDTO[];
  labels?: LabelDTO[];
  defaultDate: string;
  expense?: ExpenseDTO;
  labelSuggestions?: string[];
  submitLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  // Freeze the default date/time at mount. Adding a label mid-entry triggers a
  // server action that re-renders this page; without freezing, `defaultDate`
  // (computed from "now") would change and Base UI would warn about an
  // uncontrolled input's default value changing.
  const [initialDate] = useState(defaultDate);

  // Maps category id → display label so the Select trigger shows the name
  // (with icon) instead of the raw id value.
  const categoryItems = Object.fromEntries(
    categories.map((c) => [c.id, c.icon ? `${c.icon} ${c.name}` : c.name]),
  );

  return (
    <form action={formAction} className="space-y-5">
      {expense ? <input type="hidden" name="id" value={expense.id} /> : null}

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <div className="relative">
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg">
            ₹
          </span>
          <Input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0"
            defaultValue={expense?.amount}
            autoFocus
            required
            className="h-14 pl-8 text-2xl font-semibold"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <Select
          name="categoryId"
          defaultValue={expense?.categoryId ?? categories[0]?.id}
          items={categoryItems}
        >
          <SelectTrigger id="categoryId" className="h-12 w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="mr-2">{c.icon}</span>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {accounts.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="accountId">Account</Label>
          <select
            id="accountId"
            name="accountId"
            defaultValue={expense?.accountId ?? accounts[0]?.id}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-12 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="label">Title</Label>
        <Input
          id="label"
          name="label"
          placeholder="e.g. Lunch, Uber, Groceries"
          defaultValue={expense?.label}
          list="expense-labels"
          autoComplete="off"
          required
          className="h-12"
        />
        {labelSuggestions.length > 0 ? (
          <datalist id="expense-labels">
            {labelSuggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Labels</Label>
        <LabelPicker labels={labels} selectedIds={expense?.labelIds ?? []} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Payment</Label>
        <Select
          name="paymentMethod"
          defaultValue={expense?.paymentMethod ?? "UPI"}
        >
          <SelectTrigger id="paymentMethod" className="h-12 w-full">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expenseDate">Date &amp; time</Label>
        <Input
          id="expenseDate"
          name="expenseDate"
          type="datetime-local"
          defaultValue={initialDate}
          required
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Input
          id="note"
          name="note"
          placeholder="Anything to remember"
          defaultValue={expense?.note}
          className="h-12"
        />
      </div>

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3 pt-2">
        <Link
          href={expense ? "/expenses" : "/"}
          className={cn(buttonVariants({ variant: "outline" }), "h-12 flex-1")}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={isPending} className="h-12 flex-[2]">
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
