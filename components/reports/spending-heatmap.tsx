import { formatINR } from "@/lib/constants";
import type { SpendingHeatmap as SpendingHeatmapData } from "@/lib/data/types";

// Mon-first; label every other row.
const ROW_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

const dfmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

function cellOpacity(total: number, max: number): number {
  const ratio = total / max;
  if (ratio > 0.66) return 1;
  if (ratio > 0.33) return 0.66;
  if (ratio > 0.1) return 0.4;
  return 0.22;
}

export function SpendingHeatmap({ data }: { data: SpendingHeatmapData }) {
  if (data.max <= 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No spending to map yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <div className="text-muted-foreground flex flex-col gap-1 pr-0.5 text-[10px]">
          {ROW_LABELS.map((l, i) => (
            <span key={i} className="flex h-3 items-center leading-none">
              {l}
            </span>
          ))}
        </div>
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {data.columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              {col.map((cell, ri) => (
                <div
                  key={ri}
                  title={
                    cell.date
                      ? `${dfmt.format(new Date(cell.date))}: ${formatINR(cell.total)}`
                      : undefined
                  }
                  className="bg-muted size-3 rounded-[3px]"
                  style={
                    cell.date && cell.total > 0
                      ? {
                          backgroundColor: `rgba(99, 102, 241, ${cellOpacity(cell.total, data.max)})`,
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="text-muted-foreground flex items-center justify-end gap-1 text-[10px]">
        <span>Less</span>
        {[0.22, 0.4, 0.66, 1].map((o) => (
          <span
            key={o}
            className="size-3 rounded-[3px]"
            style={{ backgroundColor: `rgba(99, 102, 241, ${o})` }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
