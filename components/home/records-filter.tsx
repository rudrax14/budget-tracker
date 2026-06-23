"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DateField } from "@/components/ui/date-field";
import { cn } from "@/lib/utils";

const OPTIONS = [
  ["week", "Week"],
  ["month", "Month"],
  ["custom", "Custom"],
] as const;

export function RecordsFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const current = sp.get("r") ?? "week";

  function update(next: URLSearchParams) {
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  function setRange(r: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("r", r);
    if (r !== "custom") {
      params.delete("rf");
      params.delete("rt");
    }
    update(params);
  }

  function setCustom(key: "rf" | "rt", value: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("r", "custom");
    if (value) params.set(key, value);
    else params.delete(key);
    update(params);
  }

  const dateInput =
    "h-8 rounded-md border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring";

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="bg-muted/60 inline-flex rounded-lg p-0.5">
        {OPTIONS.map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => setRange(val)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              current === val
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {current === "custom" ? (
        <div className="flex items-center gap-2">
          <DateField
            value={sp.get("rf") ?? ""}
            onChange={(v) => setCustom("rf", v)}
            placeholder="Start date"
            aria-label="Start date"
            className={dateInput}
          />
          <DateField
            value={sp.get("rt") ?? ""}
            onChange={(v) => setCustom("rt", v)}
            placeholder="End date"
            aria-label="End date"
            className={dateInput}
          />
        </div>
      ) : null}
    </div>
  );
}
