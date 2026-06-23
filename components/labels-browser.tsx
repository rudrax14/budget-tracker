"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, X } from "lucide-react";
import { createLabelInline, deleteLabelById } from "@/lib/actions/labels";
import type { LabelDTO } from "@/lib/data/types";

export function LabelsBrowser({ labels: initial }: { labels: LabelDTO[] }) {
  const [labels, setLabels] = useState(initial);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  const mostFrequent = [...labels]
    .filter((l) => (l.count ?? 0) > 0)
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 4);

  const all = [...labels]
    .filter((l) => l.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  function add() {
    const trimmed = name.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    startTransition(async () => {
      const created = await createLabelInline(trimmed);
      if (created) setLabels((prev) => [...prev, created]);
      setName("");
      setAdding(false);
    });
  }

  function remove(id: string, label: string) {
    if (!confirm(`Delete label “${label}”?`)) return;
    startTransition(async () => {
      await deleteLabelById(id);
      setLabels((prev) => prev.filter((l) => l.id !== id));
    });
  }

  return (
    <div className="mx-auto min-h-screen max-w-md pb-28">
      <header className="flex items-center gap-3 px-4 py-4">
        <Link
          href="/"
          aria-label="Close"
          className="hover:bg-accent inline-flex size-9 items-center justify-center rounded-full"
        >
          <X className="size-5" />
        </Link>
        <h1 className="flex-1 text-xl font-semibold">Select Label</h1>
        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          aria-label="Search labels"
          className="hover:bg-accent inline-flex size-9 items-center justify-center rounded-full"
        >
          <Search className="size-5" />
        </button>
      </header>

      {searchOpen ? (
        <div className="px-4 pb-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search labels…"
            className="border-input focus-visible:border-ring h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none"
          />
        </div>
      ) : null}

      {mostFrequent.length > 0 && !query ? (
        <section className="bg-muted/30 px-4 py-4">
          <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide">
            MOST FREQUENT
          </p>
          <div className="grid grid-cols-4 gap-2">
            {mostFrequent.map((l) => (
              <div key={l.id} className="flex flex-col items-center gap-1.5">
                <span
                  className="size-12 rounded-2xl"
                  style={{ backgroundColor: l.color }}
                />
                <span className="text-center text-xs leading-tight">
                  {l.name}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="px-4 py-3">
        <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide">
          ALL LABELS
        </p>
        {all.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            {query ? "No labels match." : "No labels yet. Tap + to add one."}
          </p>
        ) : (
          <ul className="divide-border divide-y">
            {all.map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-3.5">
                <span
                  className="size-7 shrink-0 rounded-lg"
                  style={{ backgroundColor: l.color }}
                />
                <span className="flex-1 truncate text-base">{l.name}</span>
                {l.count ? (
                  <span className="text-muted-foreground text-xs">
                    {l.count}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(l.id, l.name)}
                  aria-label={`Delete ${l.name}`}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 inline-flex size-9 items-center justify-center rounded-full"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {adding ? (
        <div className="bg-background fixed inset-x-0 bottom-0 z-50 border-t p-4">
          <div className="mx-auto flex max-w-md gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
                if (e.key === "Escape") setAdding(false);
              }}
              placeholder="New label name"
              maxLength={40}
              className="border-input focus-visible:border-ring h-11 flex-1 rounded-lg border bg-transparent px-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={add}
              disabled={pending}
              className="bg-primary text-primary-foreground rounded-lg px-5 text-sm font-medium disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          aria-label="Add label"
          className="fixed right-5 bottom-6 z-50 flex size-14 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg transition-transform active:scale-95"
        >
          <Plus className="size-7" />
        </button>
      )}
    </div>
  );
}
