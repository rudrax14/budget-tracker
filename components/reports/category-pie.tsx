"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { CategoryBreakdownItem } from "@/lib/data/types";
import { formatINR } from "@/lib/constants";

export function CategoryPie({ data }: { data: CategoryBreakdownItem[] }) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        No spending this month yet.
      </p>
    );
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="categoryName"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.categoryId} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <ul className="w-full space-y-1.5">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.total / total) * 100) : 0;
          return (
            <li key={d.categoryId} className="flex items-center gap-2 text-sm">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span className="flex-1 truncate">{d.categoryName}</span>
              <span className="text-muted-foreground tabular-nums">{pct}%</span>
              <span className="w-20 text-right font-medium tabular-nums">
                {formatINR(d.total)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
