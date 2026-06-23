import type { PaymentMethod } from "@/lib/constants";

export interface CategoryDTO {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
}

export interface ExpenseDTO {
  id: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  accountId?: string;
  accountName?: string;
  labelIds?: string[];
  label: string; // short text title
  note?: string;
  paymentMethod: PaymentMethod;
  expenseDate: string; // ISO string (safe across the server/client boundary)
}

export interface NewExpenseInput {
  amount: number;
  categoryId: string;
  accountId?: string;
  labelIds?: string[];
  label: string;
  note?: string;
  paymentMethod: PaymentMethod;
  expenseDate: Date;
}

export interface LabelDTO {
  id: string;
  name: string;
  color: string;
  count?: number; // how many expenses use it (for "most frequent")
}

export interface NewLabelInput {
  name: string;
  color: string;
}

export interface DashboardStats {
  todaySpend: number;
  weekSpend: number;
  monthSpend: number;
  monthlyBudget: number | null;
  remainingBudget: number | null;
  recentExpenses: ExpenseDTO[];
}

export interface ExpenseFilters {
  search?: string;
  categoryId?: string;
  from?: string; // YYYY-MM-DD (inclusive)
  to?: string; // YYYY-MM-DD (inclusive)
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  color: string;
  total: number;
}

export interface MonthlyTotalItem {
  month: string; // "Jan", "Feb" …
  monthKey: string; // "2026-01"
  total: number;
}

export interface DailyTrendItem {
  date: string; // "1 Jun"
  total: number;
}

export type PlannedDirection = "out" | "in";
export type PlannedFrequency = "weekly" | "monthly" | "yearly";

export interface PlannedPaymentDTO {
  id: string;
  direction: PlannedDirection;
  amount: number;
  label: string;
  note?: string;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  counterparty?: string;
  dueDate: string; // ISO
  recurring: boolean;
  frequency?: PlannedFrequency;
  paymentMethod?: PaymentMethod;
}

export interface NewPlannedInput {
  direction: PlannedDirection;
  amount: number;
  label: string;
  note?: string;
  categoryId?: string;
  counterparty?: string;
  dueDate: Date;
  recurring: boolean;
  frequency?: PlannedFrequency;
  paymentMethod?: PaymentMethod;
}

export interface UpcomingSummary {
  items: PlannedPaymentDTO[];
  totalOut: number;
  totalIn: number;
}

export interface PresetDTO {
  id: string;
  emoji?: string;
  label: string;
  amount: number;
  categoryId: string;
  categoryName?: string;
  paymentMethod: PaymentMethod;
}

export interface NewPresetInput {
  emoji?: string;
  label: string;
  amount: number;
  categoryId: string;
  paymentMethod: PaymentMethod;
}

export type TransferDirection = "in" | "out"; // received | sent

export interface TransferDTO {
  id: string;
  direction: TransferDirection;
  amount: number;
  person: string;
  note?: string;
  paymentMethod?: PaymentMethod;
  accountId?: string;
  transferDate: string; // ISO
}

export interface NewTransferInput {
  direction: TransferDirection;
  amount: number;
  person: string;
  note?: string;
  paymentMethod?: PaymentMethod;
  accountId?: string;
  transferDate: Date;
}

export type AccountType = "cash" | "online" | "bank" | "card";

export interface AccountDTO {
  id: string;
  name: string;
  type: AccountType;
  color?: string;
  openingBalance: number;
  balance: number; // computed: opening + transfers in − transfers out − expenses
}

export interface NewAccountInput {
  name: string;
  type: AccountType;
  color?: string;
  openingBalance: number;
}

export interface BalancePoint {
  date: string; // "22 Jun"
  balance: number;
}

export interface BalanceTrend {
  points: BalancePoint[];
  current: number;
  changePct: number | null; // vs the start of the window
}

export interface StructureSlice {
  categoryId: string;
  categoryName: string;
  color: string;
  total: number;
}

export interface ExpenseStructure {
  total: number;
  slices: StructureSlice[];
  changePct: number | null; // this period vs previous period
}

export interface TransferSummary {
  received: number;
  sent: number;
  net: number;
}

export interface WeekdayTotal {
  day: string; // "Mon" … "Sun"
  total: number;
}

export interface YearReview {
  year: number;
  total: number;
  count: number;
  avgPerMonth: number;
  monthly: MonthlyTotalItem[]; // 12 entries, Jan–Dec
  topCategories: CategoryBreakdownItem[]; // top 5
  weekday: WeekdayTotal[]; // Mon–Sun
  topWeekdayLabel: string | null;
  busiestMonthLabel: string | null;
}

export interface HeatmapCell {
  date: string | null; // ISO; null = padding (future)
  total: number;
}

export interface SpendingHeatmap {
  weeks: number;
  max: number;
  columns: HeatmapCell[][]; // weeks columns × 7 rows (Mon–Sun)
}

export interface CashflowPoint {
  date: string; // "22 Jun"
  cumulative: number;
}

export interface CashflowOccurrence {
  date: string; // ISO
  label: string;
  direction: PlannedDirection;
  amount: number;
}

export interface CashflowForecast {
  points: CashflowPoint[];
  totalIn: number;
  totalOut: number;
  net: number;
  occurrences: CashflowOccurrence[];
}
