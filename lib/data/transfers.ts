import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { Transfer } from "@/lib/models/transfer";
import {
  memAddTransfer,
  memDeleteTransfer,
  memGetTransferOne,
  memGetTransfers,
  memUpdateTransfer,
  type RawTransfer,
} from "@/lib/data/memory-store";
import type {
  NewTransferInput,
  TransferDirection,
  TransferDTO,
  TransferSummary,
} from "@/lib/data/types";
import type { PaymentMethod } from "@/lib/constants";
import { startOfMonth } from "@/lib/dates";

interface LeanTransfer {
  _id: unknown;
  direction: string;
  amount: number;
  person: string;
  accountId?: unknown;
  note?: string | null;
  paymentMethod?: string | null;
  transferDate: Date | string;
}

function leanToRaw(d: LeanTransfer, userId: string): RawTransfer {
  return {
    id: String(d._id),
    userId,
    direction: d.direction as TransferDirection,
    amount: d.amount,
    person: d.person,
    accountId: d.accountId ? String(d.accountId) : undefined,
    note: d.note ?? undefined,
    paymentMethod: (d.paymentMethod ?? undefined) as PaymentMethod | undefined,
    transferDate: new Date(d.transferDate),
  };
}

function toDTO(raw: RawTransfer): TransferDTO {
  return {
    id: raw.id,
    direction: raw.direction,
    amount: raw.amount,
    person: raw.person,
    accountId: raw.accountId,
    note: raw.note,
    paymentMethod: raw.paymentMethod,
    transferDate: raw.transferDate.toISOString(),
  };
}

async function loadRaw(userId: string): Promise<RawTransfer[]> {
  if (!isDbConfigured) return memGetTransfers(userId);
  await connectToDatabase();
  const docs = await Transfer.find({ userId })
    .sort({ transferDate: -1 })
    .lean();
  return docs.map((d) => leanToRaw(d, userId));
}

export async function loadRawTransfers(userId: string): Promise<RawTransfer[]> {
  return loadRaw(userId);
}

export async function listTransfers(userId: string): Promise<TransferDTO[]> {
  const raws = await loadRaw(userId);
  return raws
    .sort((a, b) => b.transferDate.getTime() - a.transferDate.getTime())
    .map(toDTO);
}

export async function getTransferById(
  userId: string,
  id: string,
): Promise<TransferDTO | null> {
  let raw: RawTransfer | null;
  if (!isDbConfigured) {
    raw = memGetTransferOne(userId, id);
  } else {
    await connectToDatabase();
    try {
      const d = await Transfer.findOne({ _id: id, userId }).lean();
      raw = d ? leanToRaw(d, userId) : null;
    } catch {
      return null;
    }
  }
  return raw ? toDTO(raw) : null;
}

export async function createTransfer(
  userId: string,
  input: NewTransferInput,
): Promise<TransferDTO> {
  let raw: RawTransfer;
  if (!isDbConfigured) {
    raw = memAddTransfer(userId, input);
  } else {
    await connectToDatabase();
    const doc = await Transfer.create({ userId, ...input });
    raw = leanToRaw(doc, userId);
  }
  return toDTO(raw);
}

export async function updateTransfer(
  userId: string,
  id: string,
  input: NewTransferInput,
): Promise<TransferDTO | null> {
  let raw: RawTransfer | null;
  if (!isDbConfigured) {
    raw = memUpdateTransfer(userId, id, input);
  } else {
    await connectToDatabase();
    const doc = await Transfer.findOneAndUpdate(
      { _id: id, userId },
      { $set: { ...input } },
      { new: true },
    ).lean();
    raw = doc ? leanToRaw(doc, userId) : null;
  }
  return raw ? toDTO(raw) : null;
}

export async function deleteTransfer(userId: string, id: string): Promise<void> {
  if (!isDbConfigured) {
    memDeleteTransfer(userId, id);
    return;
  }
  await connectToDatabase();
  await Transfer.deleteOne({ _id: id, userId });
}

function summarize(raws: RawTransfer[]): TransferSummary {
  let received = 0;
  let sent = 0;
  for (const t of raws) {
    if (t.direction === "in") received += t.amount;
    else sent += t.amount;
  }
  return { received, sent, net: received - sent };
}

// All-time totals (used on the transfers page).
export async function getTransferTotals(
  userId: string,
): Promise<TransferSummary> {
  return summarize(await loadRaw(userId));
}

// This-month totals (used on the dashboard card).
export async function getMonthlyTransferSummary(
  userId: string,
): Promise<TransferSummary> {
  const raws = await loadRaw(userId);
  const monthStart = startOfMonth();
  return summarize(raws.filter((t) => t.transferDate >= monthStart));
}
