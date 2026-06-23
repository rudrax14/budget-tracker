import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { PlannedPayment } from "@/lib/models/planned-payment";
import { listCategories } from "@/lib/data/categories";
import { createExpense } from "@/lib/data/expenses";
import {
  memAddPlanned,
  memDeletePlanned,
  memGetPlanned,
  memGetPlannedOne,
  memUpdatePlanned,
  type RawPlanned,
} from "@/lib/data/memory-store";
import type {
  CategoryDTO,
  NewPlannedInput,
  PlannedDirection,
  PlannedFrequency,
  PlannedPaymentDTO,
  UpcomingSummary,
} from "@/lib/data/types";
import type { PaymentMethod } from "@/lib/constants";
import { addInterval, startOfToday } from "@/lib/dates";

interface LeanPlanned {
  _id: unknown;
  direction: string;
  amount: number;
  label: string;
  note?: string | null;
  categoryId?: string | null;
  counterparty?: string | null;
  dueDate: Date | string;
  recurring?: boolean | null;
  frequency?: string | null;
  paymentMethod?: string | null;
}

function leanToRaw(d: LeanPlanned, userId: string): RawPlanned {
  return {
    id: String(d._id),
    userId,
    direction: d.direction as PlannedDirection,
    amount: d.amount,
    label: d.label,
    note: d.note ?? undefined,
    categoryId: d.categoryId ?? undefined,
    counterparty: d.counterparty ?? undefined,
    dueDate: new Date(d.dueDate),
    recurring: Boolean(d.recurring),
    frequency: (d.frequency ?? undefined) as PlannedFrequency | undefined,
    paymentMethod: (d.paymentMethod ?? undefined) as PaymentMethod | undefined,
  };
}

function toDTO(
  raw: RawPlanned,
  categoryById: Map<string, CategoryDTO>,
): PlannedPaymentDTO {
  const cat = raw.categoryId ? categoryById.get(raw.categoryId) : undefined;
  return {
    id: raw.id,
    direction: raw.direction,
    amount: raw.amount,
    label: raw.label,
    note: raw.note,
    categoryId: raw.categoryId,
    categoryName: cat?.name,
    categoryIcon: cat?.icon,
    categoryColor: cat?.color,
    counterparty: raw.counterparty,
    dueDate: raw.dueDate.toISOString(),
    recurring: raw.recurring,
    frequency: raw.frequency,
    paymentMethod: raw.paymentMethod,
  };
}

async function loadRaw(userId: string): Promise<RawPlanned[]> {
  if (!isDbConfigured) return memGetPlanned(userId);
  await connectToDatabase();
  const docs = await PlannedPayment.find({ userId }).sort({ dueDate: 1 }).lean();
  return docs.map((d) => leanToRaw(d, userId));
}

async function categoryMap(userId: string): Promise<Map<string, CategoryDTO>> {
  const cats = await listCategories(userId);
  return new Map(cats.map((c) => [c.id, c]));
}

export async function listPlanned(userId: string): Promise<PlannedPaymentDTO[]> {
  const [raws, byId] = await Promise.all([loadRaw(userId), categoryMap(userId)]);
  return raws
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .map((r) => toDTO(r, byId));
}

export async function getPlannedById(
  userId: string,
  id: string,
): Promise<PlannedPaymentDTO | null> {
  let raw: RawPlanned | null;
  if (!isDbConfigured) {
    raw = memGetPlannedOne(userId, id);
  } else {
    await connectToDatabase();
    try {
      const d = await PlannedPayment.findOne({ _id: id, userId }).lean();
      raw = d ? leanToRaw(d, userId) : null;
    } catch {
      return null;
    }
  }
  if (!raw) return null;
  return toDTO(raw, await categoryMap(userId));
}

export async function createPlanned(
  userId: string,
  input: NewPlannedInput,
): Promise<PlannedPaymentDTO> {
  let raw: RawPlanned;
  if (!isDbConfigured) {
    raw = memAddPlanned(userId, input);
  } else {
    await connectToDatabase();
    const doc = await PlannedPayment.create({ userId, ...input });
    raw = leanToRaw(doc, userId);
  }
  return toDTO(raw, await categoryMap(userId));
}

export async function updatePlanned(
  userId: string,
  id: string,
  input: NewPlannedInput,
): Promise<PlannedPaymentDTO | null> {
  let raw: RawPlanned | null;
  if (!isDbConfigured) {
    raw = memUpdatePlanned(userId, id, input);
  } else {
    await connectToDatabase();
    const doc = await PlannedPayment.findOneAndUpdate(
      { _id: id, userId },
      { $set: { ...input } },
      { new: true },
    ).lean();
    raw = doc ? leanToRaw(doc, userId) : null;
  }
  if (!raw) return null;
  return toDTO(raw, await categoryMap(userId));
}

export async function deletePlanned(userId: string, id: string): Promise<void> {
  if (!isDbConfigured) {
    memDeletePlanned(userId, id);
    return;
  }
  await connectToDatabase();
  await PlannedPayment.deleteOne({ _id: id, userId });
}

async function setDueDate(userId: string, id: string, next: Date): Promise<void> {
  if (!isDbConfigured) {
    const r = memGetPlannedOne(userId, id);
    if (r) r.dueDate = next;
    return;
  }
  await connectToDatabase();
  await PlannedPayment.updateOne({ _id: id, userId }, { $set: { dueDate: next } });
}

async function fallbackCategoryId(userId: string): Promise<string> {
  const cats = await listCategories(userId);
  return (cats.find((c) => c.name === "Others") ?? cats[0])?.id;
}

// Settle a planned item. Outgoing → logs a real expense. Recurring → rolls the
// due date to the next occurrence; one-time → removed.
export async function markPlannedDone(
  userId: string,
  id: string,
): Promise<{ logged: boolean }> {
  let raw: RawPlanned | null;
  if (!isDbConfigured) {
    raw = memGetPlannedOne(userId, id);
  } else {
    await connectToDatabase();
    const d = await PlannedPayment.findOne({ _id: id, userId }).lean();
    raw = d ? leanToRaw(d, userId) : null;
  }
  if (!raw) return { logged: false };

  let logged = false;
  if (raw.direction === "out") {
    await createExpense(userId, {
      amount: raw.amount,
      categoryId: raw.categoryId ?? (await fallbackCategoryId(userId)),
      label: raw.label,
      note: raw.counterparty ? `To ${raw.counterparty}` : raw.note,
      paymentMethod: raw.paymentMethod ?? "UPI",
      expenseDate: new Date(),
    });
    logged = true;
  }

  if (raw.recurring && raw.frequency) {
    await setDueDate(userId, id, addInterval(raw.dueDate, raw.frequency));
  } else {
    await deletePlanned(userId, id);
  }
  return { logged };
}

export async function getUpcoming(
  userId: string,
  limit = 3,
): Promise<UpcomingSummary> {
  const all = await listPlanned(userId);
  const today = startOfToday();
  const horizon = new Date(today);
  horizon.setDate(today.getDate() + 31);

  const relevant = all.filter((p) => new Date(p.dueDate) <= horizon);
  const totalOut = relevant
    .filter((p) => p.direction === "out")
    .reduce((s, p) => s + p.amount, 0);
  const totalIn = relevant
    .filter((p) => p.direction === "in")
    .reduce((s, p) => s + p.amount, 0);

  return { items: all.slice(0, limit), totalOut, totalIn };
}
