import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getCashflowForecast,
  getCategoryBreakdown,
  getDailyTrend,
  getMonthlyTotals,
  getSpendingHeatmap,
  getYearReview,
} from "@/lib/data/reports";
import { getCurrentUserId } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryPie } from "@/components/reports/category-pie";
import { MonthlyBar } from "@/components/reports/monthly-bar";
import { DailyTrend } from "@/components/reports/daily-trend";
import { SpendingHeatmap } from "@/components/reports/spending-heatmap";
import { CashflowForecast } from "@/components/reports/cashflow-forecast";
import { YearReview } from "@/components/reports/year-review";

export const metadata = { title: "Reports · Budget Tracker" };
export const dynamic = "force-dynamic";

const monthLabel = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
});

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="px-4 py-4">
        <div className="mb-3">
          <h2 className="font-semibold">{title}</h2>
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = Number(sp.year) || currentYear;

  const userId = await getCurrentUserId();
  const [breakdown, monthly, daily, heatmap, forecast, yearReview] =
    await Promise.all([
      getCategoryBreakdown(userId),
      getMonthlyTotals(userId, 6),
      getDailyTrend(userId, 30),
      getSpendingHeatmap(userId, 16),
      getCashflowForecast(userId, 30),
      getYearReview(userId, year),
    ]);

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      <ChartCard title="Category breakdown" subtitle={monthLabel.format(new Date())}>
        <CategoryPie data={breakdown} />
      </ChartCard>

      <ChartCard title="Monthly spending" subtitle="Last 6 months">
        <MonthlyBar data={monthly} />
      </ChartCard>

      <ChartCard title="Daily spending trend" subtitle="Last 30 days">
        <DailyTrend data={daily} />
      </ChartCard>

      <ChartCard title="Spending heatmap" subtitle="Last 16 weeks · darker = more spent">
        <SpendingHeatmap data={heatmap} />
      </ChartCard>

      <ChartCard title="Cashflow forecast" subtitle="Next 30 days · planned in &amp; out">
        <CashflowForecast data={forecast} />
      </ChartCard>

      <Card>
        <CardContent className="px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Year in Review</h2>
              <p className="text-muted-foreground text-xs">{year}</p>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href={`/reports?year=${year - 1}`}
                aria-label="Previous year"
                className="hover:bg-accent inline-flex size-8 items-center justify-center rounded-full"
              >
                <ChevronLeft className="size-4" />
              </Link>
              {year < currentYear ? (
                <Link
                  href={`/reports?year=${year + 1}`}
                  aria-label="Next year"
                  className="hover:bg-accent inline-flex size-8 items-center justify-center rounded-full"
                >
                  <ChevronRight className="size-4" />
                </Link>
              ) : (
                <span className="text-muted-foreground/30 inline-flex size-8 items-center justify-center">
                  <ChevronRight className="size-4" />
                </span>
              )}
            </div>
          </div>
          <YearReview data={yearReview} />
        </CardContent>
      </Card>
    </div>
  );
}
