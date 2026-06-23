"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Theme is only known on the client; avoid a hydration mismatch.
  useEffect(() => setMounted(true), []);
  const current = mounted ? theme : undefined;

  return (
    <div className="bg-muted/40 grid grid-cols-3 gap-1 rounded-lg border p-1">
      {options.map((o) => {
        const Icon = o.icon;
        const active = current === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setTheme(o.value)}
            aria-pressed={active}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-2 text-sm transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
