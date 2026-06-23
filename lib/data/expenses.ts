import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { Expense } from "@/lib/models/expense";
import { listCategories } from "@/lib/data/categories";
import { getOverallMonthlyBudget } from "@/lib/data/budget";
import {
  memAddExpense,
  memDeleteExpense,
  memGetExpense,
  memGetExpenses,
  memUpdateExpense,
  type RawExpense,
} from "@/lib/data/memory-store";
import type {
  CategoryDTO,
  DashboardStats,
  ExpenseDTO,
  ExpenseFilters,
  NewExpenseInput,
} from "@/lib/data/types";
import { startOfMonth, startOfToday, startOfWeek } from "@/lib/dates";
import type { PaymentMethod } from "@/lib/constants";
import { cachedRead, revalidateUser } from "@/lib/data/cache";

interface LeanExpense {
  _id: unknown;
  amount: number;
  categoryId: unknown;
  accountId?: unknown;
  labelIds?: unknown;
  label: string;
  note?: string | null;
  paymentMethod: string;
  expenseDate: Date | string;
}

function leanToRaw(d: LeanExpense, userId: string): RawExpense {
  return {
    id: String(d._id),
    userId,
    amount: d.amount,
    categoryId: String(d.categoryId),
    accountId: d.accountId ? String(d.accountId) : undefined,
    labelIds: Array.isArray(d.labelIds) ? d.labelIds.map(String) : undefined,
    label: d.label,
    note: d.note ?? undefined,
    paymentMethod: d.paymentMethod as PaymentMethod,
    expenseDate: new Date(d.expenseDate),
    createdAt: new Date(d.expenseDate),
  };
}

export function toDTO(
  raw: RawExpense,
  categoryById: Map<string, CategoryDTO>,
  accountById?: Map<string, { name: string }>,
): ExpenseDTO {
  const category = categoryById.get(raw.categoryId);
  return {
    id: raw.id,
    amount: raw.amount,
    categoryId: raw.categoryId,
    categoryName: category?.name ?? "Uncategorized",
    categoryIcon: category?.icon,
    categoryColor: category?.color,
    accountId: raw.accountId,
    accountName: raw.accountId ? accountById?.get(raw.accountId)?.name : undefined,
    labelIds: raw.labelIds,
    label: raw.label,
    note: raw.note,
    paymentMethod: raw.paymentMethod,
    expenseDate: raw.expenseDate.toISOString(),
  };
}

// Loads every expense for a user as normalized RawExpense records,
// regardless of the storage backend.
export async function loadRawExpenses(userId: string): Promise<RawExpense[]> {
  if (!isDbConfigured) {
    return memGetExpenses(userId);
  }

  await connectToDatabase();
  const docs = await Expense.find({ userId }).sort({ expenseDate: -1 }).lean();
  return docs.map((d) => leanToRaw(d, userId));
}

async function categoryMap(userId: string): Promise<Map<string, CategoryDTO>> {
  const categories = await listCategories(userId);
  return new Map(categories.map((c) => [c.id, c]));
}

export async function createExpense(
  userId: string,
  input: NewExpenseInput,
): Promise<ExpenseDTO> {
  let raw: RawExpense;

  if (!isDbConfigured) {
    raw = memAddExpense(userId, input);
  } else {
    await connectToDatabase();
    const doc = await Expense.create({ userId, ...input });
    raw = leanToRaw(doc, userId);
  }

  revalidateUser(userId);
  return toDTO(raw, await categoryMap(userId));
}

export async function getExpenseById(
  userId: string,
  id: string,
): Promise<ExpenseDTO | null> {
  let raw: RawExpense | null;

  if (!isDbConfigured) {
    raw = memGetExpense(userId, id);
  } else {
    await connectToDatabase();
    try {
      const doc = await Expense.findOne({ _id: id, userId }).lean();
      raw = doc ? leanToRaw(doc, userId) : null;
    } catch {
      return null; // invalid id (e.g. bad ObjectId)
    }
  }

  if (!raw) return null;
  return toDTO(raw, await categoryMap(userId));
}

export async function updateExpense(
  userId: string,
  id: string,
  input: NewExpenseInput,
): Promise<ExpenseDTO | null> {
  let raw: RawExpense | null;

  if (!isDbConfigured) {
    raw = memUpdateExpense(userId, id, input);
  } else {
    await connectToDatabase();
    const doc = await Expense.findOneAndUpdate(
      { _id: id, userId },
      { $set: { ...input } },
      { new: true },
    ).lean();
    raw = doc ? leanToRaw(doc, userId) : null;
  }

  if (!raw) return null;
  revalidateUser(userId);
  return toDTO(raw, await categoryMap(userId));
}

export async function deleteExpense(userId: string, id: string): Promise<void> {
  if (!isDbConfigured) {
    memDeleteExpense(userId, id);
    return;
  }
  await connectToDatabase();
  await Expense.deleteOne({ _id: id, userId });
  revalidateUser(userId);
}

export async function listExpenses(
  userId: string,
  filters: ExpenseFilters = {},
): Promise<ExpenseDTO[]> {
 return cachedRead(userId, `listExpenses:${JSON.stringify(filters)}`, async () => {
  const [raws, categories] = await Promise.all([
    loadRawExpenses(userId),
    listCategories(userId),
  ]);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  let result = raws;

  if (filters.categoryId) {
    result = result.filter((r) => r.categoryId === filters.categoryId);
  }
  if (filters.from) {
    const from = new Date(`${filters.from}T00:00:00`);
    result = result.filter((r) => r.expenseDate >= from);
  }
  if (filters.to) {
    const to = new Date(`${filters.to}T23:59:59.999`);
    result = result.filter((r) => r.expenseDate <= to);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        (r.note?.toLowerCase().includes(q) ?? false),
    );
  }

  return result
    .sort((a, b) => b.expenseDate.getTime() - a.expenseDate.getTime())
    .map((r) => toDTO(r, categoryById));
 });
}

// Distinct recent labels (newest first) for the add-form autocomplete.
export async function getRecentLabels(
  userId: string,
  limit = 25,
): Promise<string[]> {
 return cachedRead(userId, `getRecentLabels:${limit}`, async () => {
  const raws = await loadRawExpenses(userId);
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const r of raws) {
    const label = r.label.trim();
    const key = label.toLowerCase();
    if (label && !seen.has(key)) {
      seen.add(key);
      labels.push(label);
      if (labels.length >= limit) break;
    }
  }
  return labels;
 });
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
 return cachedRead(userId, "getDashboardStats", async () => {
  const [raws, categories, monthlyBudget] = await Promise.all([
    loadRawExpenses(userId),
    listCategories(userId),
    getOverallMonthlyBudget(userId),
  ]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const todayStart = startOfToday();
  const weekStart = startOfWeek();
  const monthStart = startOfMonth();

  let todaySpend = 0;
  let weekSpend = 0;
  let monthSpend = 0;

  for (const r of raws) {
    if (r.expenseDate >= monthStart) monthSpend += r.amount;
    if (r.expenseDate >= weekStart) weekSpend += r.amount;
    if (r.expenseDate >= todayStart) todaySpend += r.amount;
  }

  const recentExpenses = [...raws]
    .sort((a, b) => b.expenseDate.getTime() - a.expenseDate.getTime())
    .slice(0, 8)
    .map((r) => toDTO(r, categoryById));

  return {
    todaySpend,
    weekSpend,
    monthSpend,
    monthlyBudget,
    remainingBudget: monthlyBudget === null ? null : monthlyBudget - monthSpend,
    recentExpenses,
  };
 });
}
