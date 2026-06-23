"use client";

import { useState, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { createLabelInline } from "@/lib/actions/labels";
import type { LabelDTO } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export function LabelPicker({
  labels: initial,
  selectedIds = [],
}: {
  labels: LabelDTO[];
  selectedIds?: string[];
}) {
  const [labels, setLabels] = useState(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function add() {
    const trimmed = name.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    startTransition(async () => {
      const created = await createLabelInline(trimmed);
      if (created) {
        setLabels((prev) => [
          created,
          ...prev.filter((l) => l.id !== created.id),
        ]);
        setSelected((prev) => new Set(prev).add(created.id));
      }
      setName("");
      setAdding(false);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Submitted with the expense form. */}
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="labelIds" value={id} />
      ))}

      {labels.map((l) => {
        const on = selected.has(l.id);
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => toggle(l.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
              on ? "border-transparent text-white" : "text-foreground",
            )}
            style={on ? { backgroundColor: l.color } : undefined}
          >
            {on ? (
              <Check className="size-3.5" strokeWidth={3} />
            ) : (
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: l.color }}
              />
            )}
            {l.name}
          </button>
        );
      })}

      {adding ? (
        <span className="border-ring inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            onBlur={add}
            placeholder="New label"
            maxLength={40}
            className="w-24 bg-transparent text-sm outline-none"
          />
          <button
            type="button"
            onClick={add}
            disabled={pending}
            aria-label="Add label"
            className="text-blue-500"
          >
            <Check className="size-4" />
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-muted-foreground inline-flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-sm"
        >
          <Plus className="size-4 text-blue-500" /> Add label
        </button>
      )}
    </div>
  );
}
