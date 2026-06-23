"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { PlannedFormState } from "@/lib/actions/planned";
import type {
  CategoryDTO,
  PlannedDirection,
  PlannedPaymentDTO,
} from "@/lib/data/types";
import { PAYMENT_METHODS } from "@/lib/constants";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initial: PlannedFormState = {};
const fieldClass =
  "h-12 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Action = (
  state: PlannedFormState,
  formData: FormData,
) => Promise<PlannedFormState>;

export function PlannedForm({
  action,
  categories,
  defaultDueDate,
  planned,
  submitLabel = "Save",
}: {
  action: Action;
  categories: CategoryDTO[];
  defaultDueDate: string;
  planned?: PlannedPaymentDTO;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const [direction, setDirection] = useState<PlannedDirection>(
    planned?.direction ?? "out",
  );
  const [recurring, setRecurring] = useState(planned?.recurring ?? false);

  return (
    <form action={formAction} className="space-y-5">
      {planned ? <input type="hidden" name="id" value={planned.id} /> : null}
      <input type="hidden" name="direction" value={direction} />

      <div className="bg-muted/40 grid grid-cols-2 gap-1 rounded-lg border p-1">
        {(["out", "in"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDirection(d)}
            aria-pressed={direction === d}
            className={cn(
              "rounded-md py-2 text-sm font-medium transition-colors",
              direction === d
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {d === "out" ? "Money out" : "Money in"}
          </button>
        ))}
      </div>

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
            defaultValue={planned?.amount}
            autoFocus
            required
            className="h-14 pl-8 text-2xl font-semibold"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          name="label"
          defaultValue={planned?.label}
          placeholder={direction === "out" ? "e.g. Netflix, Rent" : "e.g. Salary, Refund"}
          required
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="counterparty">
          {direction === "out" ? "Pay to" : "Receive from"} (optional)
        </Label>
        <Input
          id="counterparty"
          name="counterparty"
          defaultValue={planned?.counterparty ?? ""}
          placeholder={direction === "out" ? "e.g. Landlord" : "e.g. Employer"}
          className="h-12"
        />
      </div>

      {direction === "out" ? (
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category (optional)</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={planned?.categoryId ?? ""}
            className={fieldClass}
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={defaultDueDate}
            required
            className="h-12"
          />
        </div>
        {direction === "out" ? (
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment</Label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              defaultValue={planned?.paymentMethod ?? "UPI"}
              className={fieldClass}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="recurring"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="border-input size-4 rounded"
          />
          Repeats automatically
        </label>
        {recurring ? (
          <select
            name="frequency"
            defaultValue={planned?.frequency ?? "monthly"}
            aria-label="Frequency"
            className={fieldClass}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Input
          id="note"
          name="note"
          defaultValue={planned?.note ?? ""}
          placeholder="Anything to remember"
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
          href="/planned"
          className={cn(buttonVariants({ variant: "outline" }), "h-12 flex-1")}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending} className="h-12 flex-[2]">
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
