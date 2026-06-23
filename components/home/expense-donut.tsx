"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { StructureSlice } from "@/lib/data/types";
import { formatINR } from "@/lib/constants";

export function ExpenseDonut({
  slices,
  total,
}: {
  slices: StructureSlice[];
  total: number;
}) {
  if (slices.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        No spending this week.
      </p>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="total"
            nameKey="categoryName"
            innerRadius={72}
            outerRadius={100}
            paddingAngle={2}
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {slices.map((s) => (
              <Cell key={s.categoryId} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-muted-foreground text-sm">All</span>
        <span className="text-xl font-bold">{formatINR(total)}</span>
      </div>
    </div>
  );
}
