"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createAccountAction,
  deleteAccountAction,
  updateAccountAction,
  type AccountFormState,
} from "@/lib/actions/accounts";
import { ACCOUNT_TYPES, formatINR } from "@/lib/constants";
import type { AccountDTO } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: AccountFormState = {};
const fieldClass =
  "h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function AccountFields({ account }: { account?: AccountDTO }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          key={`name-${account?.name ?? "new"}`}
          name="name"
          defaultValue={account?.name}
          placeholder="Account name"
          required
          aria-label="Name"
          className="h-10 flex-1"
        />
        <input
          name="color"
          type="color"
          defaultValue={account?.color ?? "#3b82f6"}
          aria-label="Color"
          className="border-input h-10 w-12 rounded-md border bg-transparent"
        />
      </div>
      <div className="flex gap-2">
        <select
          name="type"
          defaultValue={account?.type ?? "cash"}
          aria-label="Type"
          className={`${fieldClass} flex-1 capitalize`}
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t}
            </option>
          ))}
        </select>
        <div className="relative w-40">
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm">
            ₹
          </span>
          <Input
            key={`ob-${account?.openingBalance ?? 0}`}
            name="openingBalance"
            type="number"
            step="0.01"
            defaultValue={account?.openingBalance ?? 0}
            aria-label="Opening balance"
            placeholder="Opening"
            className="h-10 pl-6"
          />
        </div>
      </div>
      <p className="text-muted-foreground text-[11px]">
        Opening balance is the starting amount; expenses and transfers adjust it.
      </p>
    </div>
  );
}

export function AccountManager({ accounts }: { accounts: AccountDTO[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <ul className="divide-border divide-y overflow-hidden rounded-xl border">
        {accounts.map((a) =>
          editingId === a.id ? (
            <li key={a.id} className="p-3">
              <EditAccountForm account={a} onDone={() => setEditingId(null)} />
            </li>
          ) : (
            <li key={a.id} className="flex items-center gap-3 p-3">
              <span
                className="size-4 shrink-0 rounded-full"
                style={{ backgroundColor: a.color ?? "#3b82f6" }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.name}</p>
                <p className="text-muted-foreground text-xs capitalize">
                  {a.type}
                </p>
              </div>
              <span className="font-semibold tabular-nums">
                {formatINR(a.balance)}
              </span>
              <button
                type="button"
                aria-label={`Edit ${a.name}`}
                onClick={() => setEditingId(a.id)}
                className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex size-9 items-center justify-center rounded-full"
              >
                <Pencil className="size-4" />
              </button>
              <form action={deleteAccountAction}>
                <input type="hidden" name="id" value={a.id} />
                <button
                  type="submit"
                  aria-label={`Delete ${a.name}`}
                  onClick={(e) => {
                    if (
                      !confirm(
                        `Delete "${a.name}"? Its records move to your first account.`,
                      )
                    )
                      e.preventDefault();
                  }}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 inline-flex size-9 items-center justify-center rounded-full"
                >
                  <Trash2 className="size-4" />
                </button>
              </form>
            </li>
          ),
        )}
      </ul>

      <AddAccountForm key={accounts.length} />
    </div>
  );
}

function EditAccountForm({
  account,
  onDone,
}: {
  account: AccountDTO;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(updateAccountAction, initial);
  const closed = useRef(false);

  useEffect(() => {
    if (state.ok && !closed.current) {
      closed.current = true;
      onDone();
    }
  }, [state.ok, onDone]);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={account.id} />
      <AccountFields account={account} />
      {state.error ? (
        <p className="text-destructive text-xs">{state.error}</p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending} className="gap-1">
          <Check className="size-4" /> Save
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDone}
          className="gap-1"
        >
          <X className="size-4" /> Cancel
        </Button>
      </div>
    </form>
  );
}

function AddAccountForm() {
  const [state, action, pending] = useActionState(createAccountAction, initial);

  return (
    <form
      action={action}
      className="space-y-2 rounded-xl border border-dashed p-3"
    >
      <p className="text-sm font-medium">Add account</p>
      <AccountFields />
      {state.error ? (
        <p className="text-destructive text-xs">{state.error}</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending} className="gap-1">
        <Plus className="size-4" /> Add account
      </Button>
    </form>
  );
}
