"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { TransferFormState } from "@/lib/actions/transfers";
import type {
  AccountDTO,
  TransferDirection,
  TransferDTO,
} from "@/lib/data/types";
import { PAYMENT_METHODS } from "@/lib/constants";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initial: TransferFormState = {};
const fieldClass =
  "h-12 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Action = (
  state: TransferFormState,
  formData: FormData,
) => Promise<TransferFormState>;

export function TransferForm({
  action,
  accounts = [],
  defaultDate,
  transfer,
  submitLabel = "Save",
}: {
  action: Action;
  accounts?: AccountDTO[];
  defaultDate: string;
  transfer?: TransferDTO;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const [direction, setDirection] = useState<TransferDirection>(
    transfer?.direction ?? "out",
  );

  return (
    <form action={formAction} className="space-y-5">
      {transfer ? <input type="hidden" name="id" value={transfer.id} /> : null}
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
            {d === "out" ? "Sent" : "Received"}
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
            defaultValue={transfer?.amount}
            autoFocus
            required
            className="h-14 pl-8 text-2xl font-semibold"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="person">
          {direction === "out" ? "Sent to" : "Received from"}
        </Label>
        <Input
          id="person"
          name="person"
          defaultValue={transfer?.person}
          placeholder="e.g. Rahul, Mom"
          required
          className="h-12"
        />
      </div>

      {accounts.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="accountId">
            {direction === "out" ? "Pay from account" : "Receive into account"}
          </Label>
          <select
            id="accountId"
            name="accountId"
            defaultValue={transfer?.accountId ?? accounts[0]?.id}
            className={fieldClass}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="transferDate">Date</Label>
          <Input
            id="transferDate"
            name="transferDate"
            type="date"
            defaultValue={defaultDate}
            required
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Method</Label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            defaultValue={transfer?.paymentMethod ?? "UPI"}
            className={fieldClass}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Input
          id="note"
          name="note"
          defaultValue={transfer?.note ?? ""}
          placeholder="What was it for?"
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
          href="/transfers"
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
