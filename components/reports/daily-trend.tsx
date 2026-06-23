"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyTrendItem } from "@/lib/data/types";
import { CHART_ACCENT, formatINR, formatINRShort } from "@/lib/constants";

export function DailyTrend({ data }: { data: DailyTrendItem[] }) {
  const hasData = data.some((d) => d.total > 0);
  if (!hasData) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        No spending in the last 30 days.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_ACCENT} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_ACCENT} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--border)"
        />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          fontSize={10}
          interval="preserveStartEnd"
          minTickGap={28}
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
          contentStyle={{
            borderRadius: 8,
            border: "1px solid var(--border)",
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke={CHART_ACCENT}
          strokeWidth={2}
          fill="url(#trendFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
