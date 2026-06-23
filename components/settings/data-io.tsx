"use client";

import { useActionState } from "react";
import { FileSpreadsheet, FileText, Upload } from "lucide-react";
import { importExpensesAction, type ImportState } from "@/lib/actions/import";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initial: ImportState = {};

export function DataIO() {
  const [state, action, pending] = useActionState(importExpensesAction, initial);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <a
          href="/api/export?format=xlsx"
          download
          className={cn(buttonVariants({ variant: "outline" }), "h-11 flex-1 gap-1.5")}
        >
          <FileSpreadsheet className="size-4" /> Excel
        </a>
        <a
          href="/api/export?format=csv"
          download
          className={cn(buttonVariants({ variant: "outline" }), "h-11 flex-1 gap-1.5")}
        >
          <FileText className="size-4" /> CSV
        </a>
      </div>

      <form
        action={action}
        className="space-y-2 rounded-xl border border-dashed p-3"
      >
        <p className="text-sm font-medium">Import expenses</p>
        <p className="text-muted-foreground text-xs">
          Columns: Date, Amount, Category, Label, Payment Method, Note.
          Categories match by name (else “Others”).
        </p>
        <input
          type="file"
          name="file"
          accept=".xlsx,.xls,.csv"
          required
          className="file:bg-secondary file:text-secondary-foreground block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
        <Button type="submit" size="sm" disabled={pending} className="gap-1">
          <Upload className="size-4" /> {pending ? "Importing…" : "Import"}
        </Button>
        {state.error ? (
          <p className="text-destructive text-xs">{state.error}</p>
        ) : null}
        {state.done ? (
          <p className="text-xs text-emerald-600">
            Imported {state.imported}
            {state.skipped ? `, skipped ${state.skipped}` : ""}.
          </p>
        ) : null}
      </form>
    </div>
  );
}
