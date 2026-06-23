"use client";

import { quickAddPresetAction } from "@/lib/actions/presets";
import { formatINR } from "@/lib/constants";
import type { PresetDTO } from "@/lib/data/types";

export function QuickAdd({ presets }: { presets: PresetDTO[] }) {
  if (presets.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="mb-2 font-semibold">Quick add</h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {presets.map((p) => (
          <form key={p.id} action={quickAddPresetAction} className="shrink-0">
            <input type="hidden" name="id" value={p.id} />
            <button
              type="submit"
              className="bg-card hover:bg-accent flex w-28 flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-transform active:scale-95"
            >
              <span className="text-lg">{p.emoji ?? "⚡"}</span>
              <span className="max-w-full truncate text-sm leading-tight font-medium">
                {p.label}
              </span>
              <span className="text-muted-foreground text-xs">
                {formatINR(p.amount)}
              </span>
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
