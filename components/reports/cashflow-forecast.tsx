"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CashflowForecast as CashflowForecastData } from "@/lib/data/types";
import { CHART_ACCENT, formatINR, formatINRShort } from "@/lib/constants";

const occFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

export function CashflowForecast({ data }: { data: CashflowForecastData }) {
  if (data.occurrences.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nothing scheduled in the next 30 days. Add subscriptions, bills, or
        expected income on the Planned screen.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-muted-foreground text-xs">In</p>
          <p className="font-bold text-emerald-600">{formatINR(data.totalIn)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Out</p>
          <p className="font-bold">{formatINR(data.totalOut)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Net</p>
          <p
            className={
              data.net >= 0 ? "font-bold text-emerald-600" : "text-destructive font-bold"
            }
          >
            {data.net >= 0 ? "+" : ""}
            {formatINR(data.net)}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={data.points} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="cfFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_ACCENT} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
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
            width={48}
            fontSize={11}
          />
          <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="2 2" />
          <Tooltip
            formatter={(v) => [formatINR(Number(v)), "Projected net"]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke={CHART_ACCENT}
            strokeWidth={2}
            fill="url(#cfFill)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <ul className="divide-border divide-y">
        {data.occurrences.slice(0, 6).map((o, i) => {
          const out = o.direction === "out";
          return (
            <li key={i} className="flex items-center gap-3 py-2 text-sm">
              <span className="text-muted-foreground w-14 shrink-0">
                {occFmt.format(new Date(o.date))}
              </span>
              <span className="flex-1 truncate">{o.label}</span>
              <span className={out ? "" : "text-emerald-600"}>
                {out ? "−" : "+"}
                {formatINR(o.amount)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
