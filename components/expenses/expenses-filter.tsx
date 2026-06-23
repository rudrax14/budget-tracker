"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DateField } from "@/components/ui/date-field";
import type { CategoryDTO } from "@/lib/data/types";

export function ExpensesFilter({ categories }: { categories: CategoryDTO[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hasFilters =
    Boolean(sp.get("q")) ||
    Boolean(sp.get("category")) ||
    Boolean(sp.get("from")) ||
    Boolean(sp.get("to"));

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function onSearchChange(value: string) {
    setQ(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setParam("q", value), 300);
  }

  function clearAll() {
    setQ("");
    router.replace(pathname);
  }

  const fieldClass =
    "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <div className="mb-4 space-y-3">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search label or note…"
          className="h-11 pl-9"
        />
      </div>

      <select
        aria-label="Filter by category"
        className={fieldClass}
        value={sp.get("category") ?? ""}
        onChange={(e) => setParam("category", e.target.value)}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon ? `${c.icon} ` : ""}
            {c.name}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-3">
        <DateField
          value={sp.get("from") ?? ""}
          onChange={(v) => setParam("from", v)}
          placeholder="Start date"
          aria-label="Start date"
          className={fieldClass}
        />
        <DateField
          value={sp.get("to") ?? ""}
          onChange={(v) => setParam("to", v)}
          placeholder="End date"
          aria-label="End date"
          className={fieldClass}
        />
      </div>

      {hasFilters ? (
        <button
          type="button"
          onClick={clearAll}
          className="text-muted-foreground hover:text-foreground inline-flex h-9 items-center gap-1 text-sm"
        >
          <X className="size-4" /> Clear filters
        </button>
      ) : null}
    </div>
  );
}
