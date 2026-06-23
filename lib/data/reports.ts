import { loadRawExpenses } from "@/lib/data/expenses";
import { loadRawTransfers } from "@/lib/data/transfers";
import { listCategories } from "@/lib/data/categories";
import { listPlanned } from "@/lib/data/planned";
import { getTotalBalance } from "@/lib/data/accounts";
import { cachedRead } from "@/lib/data/cache";
import { addInterval, currentMonthKey, startOfToday, startOfWeek } from "@/lib/dates";
import type {
  BalanceTrend,
  CashflowForecast,
  CashflowOccurrence,
  CategoryBreakdownItem,
  DailyTrendItem,
  ExpenseStructure,
  MonthlyTotalItem,
  SpendingHeatmap,
  WeekdayTotal,
  YearReview,
} from "@/lib/data/types";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTH_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Monday-first weekday labels.
const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_FULL = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

// 0 = Sun … 6 = Sat  →  0 = Mon … 6 = Sun
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function monthKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function dayKeyOf(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export async function getCategoryBreakdown(
  userId: string,
  month: string = currentMonthKey(),
): Promise<CategoryBreakdownItem[]> {
 return cachedRead(userId, `getCategoryBreakdown:${month}`, async () => {
  const [raws, categories] = await Promise.all([
    loadRawExpenses(userId),
    listCategories(userId),
  ]);
  const catById = new Map(categories.map((c) => [c.id, c]));

  const totals = new Map<string, number>();
  for (const r of raws) {
    if (monthKeyOf(r.expenseDate) !== month) continue;
    totals.set(r.categoryId, (totals.get(r.categoryId) ?? 0) + r.amount);
  }

  return Array.from(totals.entries())
    .map(([categoryId, total]) => {
      const cat = catById.get(categoryId);
      return {
        categoryId,
        categoryName: cat?.name ?? "Uncategorized",
        color: cat?.color ?? "#64748b",
        total,
      };
    })
    .sort((a, b) => b.total - a.total);
 });
}

export async function getMonthlyTotals(
  userId: string,
  monthsBack = 6,
): Promise<MonthlyTotalItem[]> {
 return cachedRead(userId, `getMonthlyTotals:${monthsBack}`, async () => {
  const raws = await loadRawExpenses(userId);
  const now = new Date();

  const buckets: MonthlyTotalItem[] = [];
  const keyToIndex = new Map<string, number>();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKeyOf(d);
    keyToIndex.set(key, buckets.length);
    buckets.push({ month: MONTH_NAMES[d.getMonth()], monthKey: key, total: 0 });
  }

  for (const r of raws) {
    const idx = keyToIndex.get(monthKeyOf(r.expenseDate));
    if (idx !== undefined) buckets[idx].total += r.amount;
  }
  return buckets;
 });
}

export async function getDailyTrend(
  userId: string,
  days = 30,
): Promise<DailyTrendItem[]> {
 return cachedRead(userId, `getDailyTrend:${days}`, async () => {
  const raws = await loadRawExpenses(userId);
  const today = startOfToday();

  const buckets: DailyTrendItem[] = [];
  const keyToIndex = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keyToIndex.set(dayKeyOf(d), buckets.length);
    buckets.push({ date: `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`, total: 0 });
  }

  for (const r of raws) {
    const idx = keyToIndex.get(dayKeyOf(r.expenseDate));
    if (idx !== undefined) buckets[idx].total += r.amount;
  }
  return buckets;
 });
}

export async function getYearReview(
  userId: string,
  year: number,
): Promise<YearReview> {
 return cachedRead(userId, `getYearReview:${year}`, async () => {
  const [raws, categories] = await Promise.all([
    loadRawExpenses(userId),
    listCategories(userId),
  ]);
  const catById = new Map(categories.map((c) => [c.id, c]));

  const monthly: MonthlyTotalItem[] = MONTH_NAMES.map((m, i) => ({
    month: m,
    monthKey: `${year}-${String(i + 1).padStart(2, "0")}`,
    total: 0,
  }));
  const catTotals = new Map<string, number>();
  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
  let total = 0;
  let count = 0;

  for (const r of raws) {
    if (r.expenseDate.getFullYear() !== year) continue;
    total += r.amount;
    count++;
    monthly[r.expenseDate.getMonth()].total += r.amount;
    catTotals.set(r.categoryId, (catTotals.get(r.categoryId) ?? 0) + r.amount);
    weekdayTotals[mondayIndex(r.expenseDate)] += r.amount;
  }

  const topCategories: CategoryBreakdownItem[] = Array.from(catTotals.entries())
    .map(([categoryId, t]) => {
      const c = catById.get(categoryId);
      return {
        categoryId,
        categoryName: c?.name ?? "Uncategorized",
        color: c?.color ?? "#64748b",
        total: t,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const weekday: WeekdayTotal[] = weekdayTotals.map((t, i) => ({
    day: WEEKDAYS_SHORT[i],
    total: t,
  }));

  const maxWeekday = Math.max(...weekdayTotals);
  const topWeekdayLabel =
    maxWeekday > 0 ? WEEKDAYS_FULL[weekdayTotals.indexOf(maxWeekday)] : null;

  const monthMax = Math.max(...monthly.map((m) => m.total));
  const busiestMonthLabel =
    monthMax > 0 ? MONTH_FULL[monthly.findIndex((m) => m.total === monthMax)] : null;

  const now = new Date();
  const monthsElapsed = year === now.getFullYear() ? now.getMonth() + 1 : 12;
  const avgPerMonth = total / monthsElapsed;

  return {
    year,
    total,
    count,
    avgPerMonth,
    monthly,
    topCategories,
    weekday,
    topWeekdayLabel,
    busiestMonthLabel,
  };
 });
}

export async function getSpendingHeatmap(
  userId: string,
  weeks = 16,
): Promise<SpendingHeatmap> {
 return cachedRead(userId, `getSpendingHeatmap:${weeks}`, async () => {
  const raws = await loadRawExpenses(userId);
  const totals = new Map<string, number>();
  for (const r of raws) {
    const k = dayKeyOf(r.expenseDate);
    totals.set(k, (totals.get(k) ?? 0) + r.amount);
  }

  const today = startOfToday();
  const thisMonday = startOfWeek(today);
  const start = new Date(thisMonday);
  start.setDate(thisMonday.getDate() - (weeks - 1) * 7);

  const columns: SpendingHeatmap["columns"] = [];
  let max = 0;

  for (let w = 0; w < weeks; w++) {
    const col: SpendingHeatmap["columns"][number] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      if (day > today) {
        col.push({ date: null, total: 0 });
        continue;
      }
      const total = totals.get(dayKeyOf(day)) ?? 0;
      if (total > max) max = total;
      col.push({ date: day.toISOString(), total });
    }
    columns.push(col);
  }

  return { weeks, max, columns };
 });
}

export async function getCashflowForecast(
  userId: string,
  days = 30,
): Promise<CashflowForecast> {
 return cachedRead(userId, `getCashflowForecast:${days}`, async () => {
  const planned = await listPlanned(userId);
  const today = startOfToday();
  const end = new Date(today);
  end.setDate(today.getDate() + days);

  const occurrences: CashflowOccurrence[] = [];
  for (const p of planned) {
    let due = startOfToday(new Date(p.dueDate));
    if (p.recurring && p.frequency) {
      let guard = 0;
      while (due < today && guard < 1000) {
        due = addInterval(due, p.frequency);
        guard++;
      }
      while (due <= end && guard < 2000) {
        occurrences.push({
          date: due.toISOString(),
          label: p.label,
          direction: p.direction,
          amount: p.amount,
        });
        due = addInterval(due, p.frequency);
        guard++;
      }
    } else if (due >= today && due <= end) {
      occurrences.push({
        date: due.toISOString(),
        label: p.label,
        direction: p.direction,
        amount: p.amount,
      });
    }
  }

  const dayNet = new Map<string, number>();
  for (const o of occurrences) {
    const k = dayKeyOf(new Date(o.date));
    const delta = o.direction === "in" ? o.amount : -o.amount;
    dayNet.set(k, (dayNet.get(k) ?? 0) + delta);
  }

  const points = [];
  let cumulative = 0;
  for (let i = 0; i <= days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    cumulative += dayNet.get(dayKeyOf(d)) ?? 0;
    points.push({ date: `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`, cumulative });
  }

  const totalIn = occurrences
    .filter((o) => o.direction === "in")
    .reduce((s, o) => s + o.amount, 0);
  const totalOut = occurrences
    .filter((o) => o.direction === "out")
    .reduce((s, o) => s + o.amount, 0);

  occurrences.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return { points, totalIn, totalOut, net: totalIn - totalOut, occurrences };
 });
}

// Running total balance over the last `days`, derived by walking backwards
// from the current balance subtracting each day's net change.
export async function getBalanceTrend(
  userId: string,
  days = 30,
  currentBalance?: number,
): Promise<BalanceTrend> {
 return cachedRead(userId, `getBalanceTrend:${days}:${currentBalance ?? ""}`, async () => {
  const [current, expenses, transfers] = await Promise.all([
    currentBalance !== undefined
      ? Promise.resolve(currentBalance)
      : getTotalBalance(userId),
    loadRawExpenses(userId),
    loadRawTransfers(userId),
  ]);

  const dayNet = new Map<string, number>();
  for (const e of expenses) {
    const k = dayKeyOf(e.expenseDate);
    dayNet.set(k, (dayNet.get(k) ?? 0) - e.amount);
  }
  for (const t of transfers) {
    const k = dayKeyOf(t.transferDate);
    const delta = t.direction === "in" ? t.amount : -t.amount;
    dayNet.set(k, (dayNet.get(k) ?? 0) + delta);
  }

  const today = startOfToday();
  const series: { date: Date; balance: number }[] = [];
  let bal = current;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    series.push({ date: d, balance: bal });
    bal -= dayNet.get(dayKeyOf(d)) ?? 0; // end of the previous day
  }
  series.reverse();

  const points = series.map((s) => ({
    date: `${s.date.getDate()} ${MONTH_NAMES[s.date.getMonth()]}`,
    balance: Math.round(s.balance),
  }));

  const startBal = points[0]?.balance ?? 0;
  const changePct =
    startBal !== 0 ? ((current - startBal) / Math.abs(startBal)) * 100 : null;

  return { points, current: Math.round(current), changePct };
 });
}

// This-week category structure with a vs-last-week comparison.
export async function getExpenseStructure(
  userId: string,
): Promise<ExpenseStructure> {
 return cachedRead(userId, "getExpenseStructure", async () => {
  const [raws, categories] = await Promise.all([
    loadRawExpenses(userId),
    listCategories(userId),
  ]);
  const catById = new Map(categories.map((c) => [c.id, c]));

  const weekStart = startOfWeek();
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(weekStart.getDate() - 7);

  let total = 0;
  let prevTotal = 0;
  const totals = new Map<string, number>();

  for (const r of raws) {
    if (r.expenseDate >= weekStart) {
      total += r.amount;
      totals.set(r.categoryId, (totals.get(r.categoryId) ?? 0) + r.amount);
    } else if (r.expenseDate >= prevWeekStart) {
      prevTotal += r.amount;
    }
  }

  const slices = Array.from(totals.entries())
    .map(([categoryId, t]) => {
      const c = catById.get(categoryId);
      return {
        categoryId,
        categoryName: c?.name ?? "Uncategorized",
        color: c?.color ?? "#64748b",
        total: t,
      };
    })
    .sort((a, b) => b.total - a.total);

  const changePct =
    prevTotal !== 0 ? ((total - prevTotal) / prevTotal) * 100 : null;

  return { total, slices, changePct };
 });
}
