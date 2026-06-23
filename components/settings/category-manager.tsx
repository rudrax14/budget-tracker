"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  type CategoryFormState,
} from "@/lib/actions/categories";
import type { CategoryDTO } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: CategoryFormState = {};

export function CategoryManager({ categories }: { categories: CategoryDTO[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <ul className="divide-border divide-y overflow-hidden rounded-xl border">
        {categories.map((c) =>
          editingId === c.id ? (
            <li key={c.id} className="p-3">
              <EditCategoryForm category={c} onDone={() => setEditingId(null)} />
            </li>
          ) : (
            <li key={c.id} className="flex items-center gap-3 p-3">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-lg"
                style={{ backgroundColor: (c.color ?? "#64748b") + "22" }}
              >
                {c.icon ?? "📦"}
              </span>
              <span className="flex-1 truncate font-medium">{c.name}</span>
              <button
                type="button"
                aria-label={`Edit ${c.name}`}
                onClick={() => setEditingId(c.id)}
                className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex size-9 items-center justify-center rounded-full"
              >
                <Pencil className="size-4" />
              </button>
              <form action={deleteCategoryAction}>
                <input type="hidden" name="id" value={c.id} />
                <button
                  type="submit"
                  aria-label={`Delete ${c.name}`}
                  onClick={(e) => {
                    if (!confirm(`Delete category “${c.name}”?`))
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

      <AddCategoryForm key={categories.length} />
    </div>
  );
}

function EditCategoryForm({
  category,
  onDone,
}: {
  category: CategoryDTO;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(updateCategoryAction, initial);
  const closed = useRef(false);

  useEffect(() => {
    if (state.ok && !closed.current) {
      closed.current = true;
      onDone();
    }
  }, [state.ok, onDone]);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={category.id} />
      <div className="flex gap-2">
        <Input
          name="icon"
          defaultValue={category.icon ?? ""}
          placeholder="🍔"
          maxLength={4}
          aria-label="Icon"
          className="h-10 w-14 text-center"
        />
        <Input
          name="name"
          defaultValue={category.name}
          placeholder="Name"
          required
          aria-label="Name"
          className="h-10 flex-1"
        />
        <input
          name="color"
          type="color"
          defaultValue={category.color ?? "#64748b"}
          aria-label="Color"
          className="border-input h-10 w-12 rounded-md border bg-transparent"
        />
      </div>
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

function AddCategoryForm() {
  const [state, action, pending] = useActionState(createCategoryAction, initial);

  return (
    <form
      action={action}
      className="space-y-2 rounded-xl border border-dashed p-3"
    >
      <p className="text-sm font-medium">Add category</p>
      <div className="flex gap-2">
        <Input
          name="icon"
          placeholder="🍔"
          maxLength={4}
          aria-label="Icon"
          className="h-10 w-14 text-center"
        />
        <Input
          name="name"
          placeholder="e.g. Rent"
          required
          aria-label="Name"
          className="h-10 flex-1"
        />
        <input
          name="color"
          type="color"
          defaultValue="#6366f1"
          aria-label="Color"
          className="border-input h-10 w-12 rounded-md border bg-transparent"
        />
      </div>
      {state.error ? (
        <p className="text-destructive text-xs">{state.error}</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending} className="gap-1">
        <Plus className="size-4" /> Add category
      </Button>
    </form>
  );
}
