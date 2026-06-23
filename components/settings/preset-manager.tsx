"use client";

import { useActionState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  createPresetAction,
  deletePresetAction,
  type PresetFormState,
} from "@/lib/actions/presets";
import { PAYMENT_METHODS, formatINR } from "@/lib/constants";
import type { CategoryDTO, PresetDTO } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: PresetFormState = {};
const fieldClass =
  "h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function PresetManager({
  presets,
  categories,
}: {
  presets: PresetDTO[];
  categories: CategoryDTO[];
}) {
  return (
    <div className="space-y-3">
      {presets.length > 0 ? (
        <ul className="divide-border divide-y overflow-hidden rounded-xl border">
          {presets.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-3">
              <span className="text-lg">{p.emoji ?? "⚡"}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.label}</p>
                <p className="text-muted-foreground text-xs">
                  {formatINR(p.amount)}
                  {p.categoryName ? ` · ${p.categoryName}` : ""} ·{" "}
                  {p.paymentMethod}
                </p>
              </div>
              <form action={deletePresetAction}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  aria-label={`Delete ${p.label}`}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 inline-flex size-9 items-center justify-center rounded-full"
                >
                  <Trash2 className="size-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}

      <AddPresetForm key={presets.length} categories={categories} />
    </div>
  );
}

function AddPresetForm({ categories }: { categories: CategoryDTO[] }) {
  const [state, action, pending] = useActionState(createPresetAction, initial);

  return (
    <form
      action={action}
      className="space-y-2 rounded-xl border border-dashed p-3"
    >
      <p className="text-sm font-medium">Add quick-add preset</p>
      <div className="flex gap-2">
        <Input
          name="emoji"
          placeholder="☕"
          maxLength={4}
          aria-label="Emoji"
          className="h-10 w-14 text-center"
        />
        <Input
          name="label"
          placeholder="e.g. Coffee"
          required
          aria-label="Label"
          className="h-10 flex-1"
        />
        <div className="relative w-28">
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm">
            ₹
          </span>
          <Input
            name="amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="50"
            required
            aria-label="Amount"
            className="h-10 pl-6"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <select
          name="categoryId"
          required
          defaultValue=""
          aria-label="Category"
          className={`${fieldClass} flex-1`}
        >
          <option value="" disabled>
            Category
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ` : ""}
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="paymentMethod"
          defaultValue="UPI"
          aria-label="Payment method"
          className={`${fieldClass} w-32`}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      {state.error ? (
        <p className="text-destructive text-xs">{state.error}</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending} className="gap-1">
        <Plus className="size-4" /> Add preset
      </Button>
    </form>
  );
}
