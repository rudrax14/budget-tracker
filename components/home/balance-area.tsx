"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BalancePoint } from "@/lib/data/types";
import { formatINR, formatINRShort } from "@/lib/constants";

export function BalanceArea({ points }: { points: BalancePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: -6 }}>
        <defs>
          <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          fontSize={10}
          interval="preserveStartEnd"
          minTickGap={40}
        />
        <YAxis
          tickFormatter={(v) => formatINRShort(Number(v))}
          tickLine={false}
          axisLine={false}
          width={42}
          fontSize={10}
          domain={["auto", "auto"]}
        />
        <Tooltip
          formatter={(v) => [formatINR(Number(v)), "Balance"]}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid var(--border)",
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#balFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
