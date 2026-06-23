"use client";

import { Trash2 } from "lucide-react";
import { deleteExpenseAction } from "@/lib/actions/expenses";

export function DeleteExpenseButton({ id }: { id: string }) {
  return (
    <form action={deleteExpenseAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Delete expense"
        onClick={(e) => {
          if (!confirm("Delete this expense?")) e.preventDefault();
        }}
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 inline-flex size-9 items-center justify-center rounded-full transition-colors"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  );
}
