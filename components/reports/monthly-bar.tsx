"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyTotalItem } from "@/lib/data/types";
import { CHART_ACCENT, formatINR, formatINRShort } from "@/lib/constants";

export function MonthlyBar({ data }: { data: MonthlyTotalItem[] }) {
  const hasData = data.some((d) => d.total > 0);
  if (!hasData) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        No spending recorded yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--border)"
        />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <YAxis
          tickFormatter={(v) => formatINRShort(Number(v))}
          tickLine={false}
          axisLine={false}
          width={44}
          fontSize={11}
        />
        <Tooltip
          formatter={(v) => [formatINR(Number(v)), "Spent"]}
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid var(--border)",
            fontSize: 12,
          }}
        />
        <Bar dataKey="total" radius={[6, 6, 0, 0]} fill={CHART_ACCENT} />
      </BarChart>
    </ResponsiveContainer>
  );
}
