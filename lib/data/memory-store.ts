// In-memory fallback store used when MONGODB_URI is not configured.
// Lets the whole app work end-to-end with zero setup. Data lives in the
// Node process and resets when the dev server restarts.

import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  type PaymentMethod,
} from "@/lib/constants";
import type {
  CategoryDTO,
  NewAccountInput,
  NewExpenseInput,
  NewLabelInput,
  NewPlannedInput,
  NewPresetInput,
  NewTransferInput,
} from "@/lib/data/types";

export interface RawUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  currency: string;
  createdAt: Date;
}

export type RawPlanned = NewPlannedInput & { id: string; userId: string };
export type RawPreset = NewPresetInput & { id: string; userId: string };
export type RawTransfer = NewTransferInput & { id: string; userId: string };
export type RawAccount = NewAccountInput & { id: string; userId: string };
export type RawLabel = NewLabelInput & { id: string; userId: string };

export interface RawExpense {
  id: string;
  userId: string;
  amount: number;
  categoryId: string;
  accountId?: string;
  labelIds?: string[];
  label: string;
  note?: string;
  paymentMethod: PaymentMethod;
  expenseDate: Date;
  createdAt: Date;
}

export interface RawBudget {
  userId: string;
  amount: number;
  month: string;
  categoryId: string | null;
}

interface Store {
  users: Map<string, RawUser>; // keyed by user id
  categories: Map<string, CategoryDTO[]>;
  expenses: Map<string, RawExpense[]>;
  budgets: Map<string, RawBudget[]>;
  planned: Map<string, RawPlanned[]>;
  presets: Map<string, RawPreset[]>;
  transfers: Map<string, RawTransfer[]>;
  accounts: Map<string, RawAccount[]>;
  labels: Map<string, RawLabel[]>;
}

// Persist across hot reloads in dev.
const globalForStore = globalThis as unknown as { _memoryStore?: Store };

const store: Store = globalForStore._memoryStore ?? {
  users: new Map(),
  categories: new Map(),
  expenses: new Map(),
  budgets: new Map(),
  planned: new Map(),
  presets: new Map(),
  transfers: new Map(),
  accounts: new Map(),
  labels: new Map(),
};

globalForStore._memoryStore = store;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

function ensureSeeded(userId: string): void {
  if (store.categories.has(userId)) return;

  const categories: CategoryDTO[] = DEFAULT_CATEGORIES.map((c) => ({
    id: crypto.randomUUID(),
    name: c.name,
    icon: c.icon,
    color: c.color,
    isDefault: true,
  }));
  store.categories.set(userId, categories);

  const byName = (name: string) => categories.find((c) => c.name === name)!.id;

  // A few sample expenses so the dashboard/reports are not empty on first load.
  const samples: Omit<RawExpense, "id" | "userId" | "createdAt">[] = [
    { amount: 250, categoryId: byName("Food"), label: "Lunch", paymentMethod: "UPI", expenseDate: daysAgo(0) },
    { amount: 80, categoryId: byName("Travel"), label: "Auto", paymentMethod: "Cash", expenseDate: daysAgo(0) },
    { amount: 1200, categoryId: byName("Shopping"), label: "T-shirt", paymentMethod: "Credit Card", expenseDate: daysAgo(2) },
    { amount: 1499, categoryId: byName("Bills"), label: "Electricity", paymentMethod: "Bank", expenseDate: daysAgo(9) },
    { amount: 540, categoryId: byName("Food"), label: "Groceries", paymentMethod: "UPI", expenseDate: daysAgo(18) },
    { amount: 320, categoryId: byName("Entertainment"), label: "Movie", paymentMethod: "UPI", expenseDate: daysAgo(40) },
  ];

  store.expenses.set(
    userId,
    samples.map((s) => ({
      ...s,
      id: crypto.randomUUID(),
      userId,
      createdAt: new Date(),
    })),
  );

  store.budgets.set(userId, []);

  store.accounts.set(
    userId,
    DEFAULT_ACCOUNTS.map((a) => ({
      id: crypto.randomUUID(),
      userId,
      name: a.name,
      type: a.type,
      color: a.color,
      openingBalance: 0,
    })),
  );
}

/* -------------------------------- users ------------------------------- */

export function memGetUserByEmail(email: string): RawUser | null {
  const target = email.trim().toLowerCase();
  for (const user of store.users.values()) {
    if (user.email === target) return user;
  }
  return null;
}

export function memGetUserById(id: string): RawUser | null {
  return store.users.get(id) ?? null;
}

export function memCreateUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  currency?: string;
}): RawUser {
  const user: RawUser = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email.trim().toLowerCase(),
    passwordHash: input.passwordHash,
    currency: input.currency ?? "INR",
    createdAt: new Date(),
  };
  store.users.set(user.id, user);
  return user;
}

/* ----------------------------- categories ----------------------------- */

export function memGetCategories(userId: string): CategoryDTO[] {
  ensureSeeded(userId);
  return store.categories.get(userId) ?? [];
}

export function memAddCategory(
  userId: string,
  input: { name: string; icon?: string; color?: string },
): CategoryDTO {
  ensureSeeded(userId);
  const cat: CategoryDTO = {
    id: crypto.randomUUID(),
    name: input.name,
    icon: input.icon,
    color: input.color,
    isDefault: false,
  };
  store.categories.get(userId)!.push(cat);
  return cat;
}

export function memUpdateCategory(
  userId: string,
  id: string,
  patch: { name?: string; icon?: string; color?: string },
): void {
  ensureSeeded(userId);
  const cat = store.categories.get(userId)!.find((c) => c.id === id);
  if (!cat) return;
  if (patch.name !== undefined) cat.name = patch.name;
  if (patch.icon !== undefined) cat.icon = patch.icon;
  if (patch.color !== undefined) cat.color = patch.color;
}

export function memDeleteCategory(userId: string, id: string): void {
  ensureSeeded(userId);
  store.categories.set(
    userId,
    (store.categories.get(userId) ?? []).filter((c) => c.id !== id),
  );
}

/* ------------------------------ expenses ------------------------------ */

export function memGetExpenses(userId: string): RawExpense[] {
  ensureSeeded(userId);
  return store.expenses.get(userId) ?? [];
}

export function memGetExpense(userId: string, id: string): RawExpense | null {
  ensureSeeded(userId);
  return store.expenses.get(userId)?.find((e) => e.id === id) ?? null;
}

export function memAddExpense(userId: string, input: NewExpenseInput): RawExpense {
  ensureSeeded(userId);
  const record: RawExpense = {
    id: crypto.randomUUID(),
    userId,
    amount: input.amount,
    categoryId: input.categoryId,
    accountId: input.accountId,
    labelIds: input.labelIds,
    label: input.label,
    note: input.note,
    paymentMethod: input.paymentMethod,
    expenseDate: input.expenseDate,
    createdAt: new Date(),
  };
  store.expenses.get(userId)!.unshift(record);
  return record;
}

export function memUpdateExpense(
  userId: string,
  id: string,
  input: NewExpenseInput,
): RawExpense | null {
  ensureSeeded(userId);
  const record = store.expenses.get(userId)?.find((e) => e.id === id);
  if (!record) return null;
  record.amount = input.amount;
  record.categoryId = input.categoryId;
  record.accountId = input.accountId;
  record.labelIds = input.labelIds;
  record.label = input.label;
  record.note = input.note;
  record.paymentMethod = input.paymentMethod;
  record.expenseDate = input.expenseDate;
  return record;
}

export function memDeleteExpense(userId: string, id: string): void {
  ensureSeeded(userId);
  store.expenses.set(
    userId,
    (store.expenses.get(userId) ?? []).filter((e) => e.id !== id),
  );
}

/* ------------------------------- budgets ------------------------------ */

export function memGetBudgets(userId: string): RawBudget[] {
  ensureSeeded(userId);
  return store.budgets.get(userId) ?? [];
}

export function memSetBudget(
  userId: string,
  input: { amount: number; month: string; categoryId?: string | null },
): void {
  ensureSeeded(userId);
  const categoryId = input.categoryId ?? null;
  const list = store.budgets.get(userId)!;
  const existing = list.find(
    (b) => b.month === input.month && b.categoryId === categoryId,
  );
  if (existing) {
    existing.amount = input.amount;
  } else {
    list.push({ userId, amount: input.amount, month: input.month, categoryId });
  }
}

/* ------------------------------- planned ------------------------------ */

function plannedList(userId: string): RawPlanned[] {
  let list = store.planned.get(userId);
  if (!list) {
    list = [];
    store.planned.set(userId, list);
  }
  return list;
}

export function memGetPlanned(userId: string): RawPlanned[] {
  return plannedList(userId);
}

export function memGetPlannedOne(userId: string, id: string): RawPlanned | null {
  return plannedList(userId).find((p) => p.id === id) ?? null;
}

export function memAddPlanned(userId: string, input: NewPlannedInput): RawPlanned {
  const record: RawPlanned = { ...input, id: crypto.randomUUID(), userId };
  plannedList(userId).unshift(record);
  return record;
}

export function memUpdatePlanned(
  userId: string,
  id: string,
  input: NewPlannedInput,
): RawPlanned | null {
  const record = plannedList(userId).find((p) => p.id === id);
  if (!record) return null;
  Object.assign(record, input);
  return record;
}

export function memDeletePlanned(userId: string, id: string): void {
  store.planned.set(
    userId,
    plannedList(userId).filter((p) => p.id !== id),
  );
}

/* ------------------------------- presets ------------------------------ */

function presetList(userId: string): RawPreset[] {
  let list = store.presets.get(userId);
  if (!list) {
    list = [];
    store.presets.set(userId, list);
  }
  return list;
}

export function memGetPresets(userId: string): RawPreset[] {
  return presetList(userId);
}

export function memGetPreset(userId: string, id: string): RawPreset | null {
  return presetList(userId).find((p) => p.id === id) ?? null;
}

export function memAddPreset(userId: string, input: NewPresetInput): RawPreset {
  const record: RawPreset = { ...input, id: crypto.randomUUID(), userId };
  presetList(userId).push(record);
  return record;
}

export function memDeletePreset(userId: string, id: string): void {
  store.presets.set(
    userId,
    presetList(userId).filter((p) => p.id !== id),
  );
}

/* ------------------------------ transfers ----------------------------- */

function transferList(userId: string): RawTransfer[] {
  let list = store.transfers.get(userId);
  if (!list) {
    list = [];
    store.transfers.set(userId, list);
  }
  return list;
}

export function memGetTransfers(userId: string): RawTransfer[] {
  return transferList(userId);
}

export function memGetTransferOne(userId: string, id: string): RawTransfer | null {
  return transferList(userId).find((t) => t.id === id) ?? null;
}

export function memAddTransfer(
  userId: string,
  input: NewTransferInput,
): RawTransfer {
  const record: RawTransfer = { ...input, id: crypto.randomUUID(), userId };
  transferList(userId).unshift(record);
  return record;
}

export function memUpdateTransfer(
  userId: string,
  id: string,
  input: NewTransferInput,
): RawTransfer | null {
  const record = transferList(userId).find((t) => t.id === id);
  if (!record) return null;
  Object.assign(record, input);
  return record;
}

export function memDeleteTransfer(userId: string, id: string): void {
  store.transfers.set(
    userId,
    transferList(userId).filter((t) => t.id !== id),
  );
}

/* ------------------------------ accounts ------------------------------ */

export function memGetAccounts(userId: string): RawAccount[] {
  ensureSeeded(userId);
  return store.accounts.get(userId) ?? [];
}

export function memGetAccount(userId: string, id: string): RawAccount | null {
  ensureSeeded(userId);
  return store.accounts.get(userId)?.find((a) => a.id === id) ?? null;
}

export function memAddAccount(
  userId: string,
  input: NewAccountInput,
): RawAccount {
  ensureSeeded(userId);
  const record: RawAccount = { ...input, id: crypto.randomUUID(), userId };
  store.accounts.get(userId)!.push(record);
  return record;
}

export function memUpdateAccount(
  userId: string,
  id: string,
  input: Partial<NewAccountInput>,
): void {
  ensureSeeded(userId);
  const record = store.accounts.get(userId)?.find((a) => a.id === id);
  if (record) Object.assign(record, input);
}

export function memDeleteAccount(userId: string, id: string): void {
  ensureSeeded(userId);
  store.accounts.set(
    userId,
    (store.accounts.get(userId) ?? []).filter((a) => a.id !== id),
  );
}

/* ------------------------------- labels ------------------------------- */

function labelList(userId: string): RawLabel[] {
  let list = store.labels.get(userId);
  if (!list) {
    list = [];
    store.labels.set(userId, list);
  }
  return list;
}

export function memGetLabels(userId: string): RawLabel[] {
  return labelList(userId);
}

export function memAddLabel(userId: string, input: NewLabelInput): RawLabel {
  const record: RawLabel = { ...input, id: crypto.randomUUID(), userId };
  labelList(userId).push(record);
  return record;
}

export function memDeleteLabel(userId: string, id: string): void {
  store.labels.set(
    userId,
    labelList(userId).filter((l) => l.id !== id),
  );
}
