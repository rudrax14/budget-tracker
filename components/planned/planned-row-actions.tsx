"use client";

import Link from "next/link";
import { Check, Pencil, Trash2 } from "lucide-react";
import {
  deletePlannedAction,
  markPlannedDoneAction,
} from "@/lib/actions/planned";

export function PlannedRowActions({
  id,
  direction,
}: {
  id: string;
  direction: "out" | "in";
}) {
  const doneLabel = direction === "out" ? "Mark as paid" : "Mark as received";

  return (
    <div className="flex items-center">
      <form action={markPlannedDoneAction}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          aria-label={doneLabel}
          title={doneLabel}
          className="inline-flex size-9 items-center justify-center rounded-full text-emerald-600 transition-colors hover:bg-emerald-600/10"
        >
          <Check className="size-4" />
        </button>
      </form>
      <Link
        href={`/planned/${id}/edit`}
        aria-label="Edit"
        className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex size-9 items-center justify-center rounded-full"
      >
        <Pencil className="size-4" />
      </Link>
      <form action={deletePlannedAction}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          aria-label="Delete"
          onClick={(e) => {
            if (!confirm("Delete this planned item?")) e.preventDefault();
          }}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 inline-flex size-9 items-center justify-center rounded-full"
        >
          <Trash2 className="size-4" />
        </button>
      </form>
    </div>
  );
}
