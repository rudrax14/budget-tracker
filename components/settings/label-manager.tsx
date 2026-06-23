"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createLabelInline, deleteLabelAction } from "@/lib/actions/labels";
import type { LabelDTO } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LabelManager({ labels }: { labels: LabelDTO[] }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#22d3ee");
  const [pending, startTransition] = useTransition();

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await createLabelInline(trimmed, color);
      setName("");
    });
  }

  return (
    <div className="space-y-3">
      {labels.length > 0 ? (
        <ul className="divide-border divide-y overflow-hidden rounded-xl border">
          {labels.map((l) => (
            <li key={l.id} className="flex items-center gap-3 p-3">
              <span
                className="size-4 shrink-0 rounded-full"
                style={{ backgroundColor: l.color }}
              />
              <span className="flex-1 truncate font-medium">{l.name}</span>
              {l.count ? (
                <span className="text-muted-foreground text-xs">
                  {l.count} use{l.count === 1 ? "" : "s"}
                </span>
              ) : null}
              <form action={deleteLabelAction}>
                <input type="hidden" name="id" value={l.id} />
                <button
                  type="submit"
                  aria-label={`Delete ${l.name}`}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 inline-flex size-9 items-center justify-center rounded-full"
                >
                  <Trash2 className="size-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2 rounded-xl border border-dashed p-3">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          aria-label="Label color"
          className="border-input h-10 w-12 rounded-md border bg-transparent"
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="New label"
          maxLength={40}
          className="h-10 flex-1"
        />
        <Button
          type="button"
          size="sm"
          onClick={add}
          disabled={pending}
          className="gap-1"
        >
          <Plus className="size-4" /> Add
        </Button>
      </div>
    </div>
  );
}
