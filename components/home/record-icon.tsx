import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Circular category icon with a small green "cleared" check badge.
export function RecordIcon({
  icon,
  color,
  size = "md",
}: {
  icon?: string;
  color?: string;
  size?: "md" | "sm";
}) {
  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={cn(
          "flex items-center justify-center rounded-full",
          size === "sm" ? "size-9 text-base" : "size-12 text-xl",
        )}
        style={{ backgroundColor: color ?? "#64748b" }}
      >
        {icon ?? "📦"}
      </span>
      <span className="ring-card absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 ring-2">
        <Check className="size-2.5 text-white" strokeWidth={3} />
      </span>
    </span>
  );
}
