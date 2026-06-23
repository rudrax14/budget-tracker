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
import type { YearReview as YearReviewData } from "@/lib/data/types";
import { CHART_ACCENT, formatINR, formatINRShort } from "@/lib/constants";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function MiniBar({
  data,
  interval = 0,
}: {
  data: Array<{ total: number; month?: string; day?: string }>;
  interval?: number;
}) {
  const key = data[0] && "month" in data[0] ? "month" : "day";
  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey={key}
          tickLine={false}
          axisLine={false}
          fontSize={10}
          interval={interval}
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
        <Bar dataKey="total" radius={[4, 4, 0, 0]} fill={CHART_ACCENT} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function YearReview({ data }: { data: YearReviewData }) {
  if (data.count === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No expenses recorded in {data.year}.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total spent" value={formatINR(data.total)} />
        <Stat label="Avg / month" value={formatINR(data.avgPerMonth)} />
      </div>

      {data.topWeekdayLabel || data.busiestMonthLabel ? (
        <p className="bg-muted/50 rounded-lg px-3 py-2 text-sm">
          {data.topWeekdayLabel ? (
            <>
              You spend most on{" "}
              <span className="font-semibold">{data.topWeekdayLabel}s</span>.{" "}
            </>
          ) : null}
          {data.busiestMonthLabel ? (
            <>
              Busiest month:{" "}
              <span className="font-semibold">{data.busiestMonthLabel}</span>.
            </>
          ) : null}
        </p>
      ) : null}

      <div>
        <p className="text-muted-foreground mb-1 text-xs">Month by month</p>
        <MiniBar data={data.monthly} interval={1} />
      </div>

      <div>
        <p className="text-muted-foreground mb-1 text-xs">By weekday</p>
        <MiniBar data={data.weekday} />
      </div>

      {data.topCategories.length > 0 ? (
        <div>
          <p className="text-muted-foreground mb-1 text-xs">Top categories</p>
          <ul className="space-y-1.5">
            {data.topCategories.map((c) => (
              <li key={c.categoryId} className="flex items-center gap-2 text-sm">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="flex-1 truncate">{c.categoryName}</span>
                <span className="font-medium tabular-nums">
                  {formatINR(c.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
