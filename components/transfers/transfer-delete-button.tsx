"use client";

import { Trash2 } from "lucide-react";
import { deleteTransferAction } from "@/lib/actions/transfers";

export function TransferDeleteButton({ id }: { id: string }) {
  return (
    <form action={deleteTransferAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Delete transfer"
        onClick={(e) => {
          if (!confirm("Delete this transfer?")) e.preventDefault();
        }}
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 inline-flex size-9 items-center justify-center rounded-full transition-colors"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  );
}
