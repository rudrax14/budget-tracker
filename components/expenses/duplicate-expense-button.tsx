"use client";

import { Copy } from "lucide-react";
import { duplicateExpenseAction } from "@/lib/actions/expenses";

export function DuplicateExpenseButton({ id }: { id: string }) {
  return (
    <form action={duplicateExpenseAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Duplicate to today"
        title="Duplicate to today"
        className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex size-9 items-center justify-center rounded-full transition-colors"
      >
        <Copy className="size-4" />
      </button>
    </form>
  );
}
