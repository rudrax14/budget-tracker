import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { Account } from "@/lib/models/account";
import { DEFAULT_ACCOUNTS } from "@/lib/constants";
import { loadRawExpenses } from "@/lib/data/expenses";
import { loadRawTransfers } from "@/lib/data/transfers";
import {
  memAddAccount,
  memDeleteAccount,
  memGetAccounts,
  memUpdateAccount,
  type RawAccount,
} from "@/lib/data/memory-store";
import type { AccountDTO, AccountType, NewAccountInput } from "@/lib/data/types";

async function loadRawAccounts(userId: string): Promise<RawAccount[]> {
  if (!isDbConfigured) return memGetAccounts(userId);

  await connectToDatabase();
  let docs = await Account.find({ userId }).sort({ createdAt: 1 }).lean();
  if (docs.length === 0) {
    await Account.insertMany(
      DEFAULT_ACCOUNTS.map((a) => ({ ...a, userId, openingBalance: 0 })),
    );
    docs = await Account.find({ userId }).sort({ createdAt: 1 }).lean();
  }
  return docs.map((d) => ({
    id: String(d._id),
    userId,
    name: d.name,
    type: (d.type ?? "cash") as AccountType,
    color: d.color ?? undefined,
    openingBalance: d.openingBalance ?? 0,
  }));
}

// Accounts with live balances:
//   balance = opening + transfers in − transfers out − expenses
// Records with no/deleted account fall back to the first account.
export async function listAccounts(userId: string): Promise<AccountDTO[]> {
  const [rawAll, expenses, transfers] = await Promise.all([
    loadRawAccounts(userId),
    loadRawExpenses(userId),
    loadRawTransfers(userId),
  ]);

  // Dedupe by name (defends against a first-load seeding race).
  const seen = new Set<string>();
  const accounts = rawAll.filter((a) => {
    const k = a.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (accounts.length === 0) return [];

  const defaultId = accounts[0].id;
  const balances = new Map(accounts.map((a) => [a.id, a.openingBalance]));
  const resolve = (id?: string) => (id && balances.has(id) ? id : defaultId);

  for (const e of expenses) {
    const acc = resolve(e.accountId);
    balances.set(acc, (balances.get(acc) ?? 0) - e.amount);
  }
  for (const t of transfers) {
    const acc = resolve(t.accountId);
    const delta = t.direction === "in" ? t.amount : -t.amount;
    balances.set(acc, (balances.get(acc) ?? 0) + delta);
  }

  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    color: a.color,
    openingBalance: a.openingBalance,
    balance: balances.get(a.id) ?? a.openingBalance,
  }));
}

export async function getTotalBalance(userId: string): Promise<number> {
  const accounts = await listAccounts(userId);
  return accounts.reduce((s, a) => s + a.balance, 0);
}

export async function createAccount(
  userId: string,
  input: NewAccountInput,
): Promise<void> {
  if (!isDbConfigured) {
    memAddAccount(userId, input);
    return;
  }
  await connectToDatabase();
  await Account.create({ ...input, userId });
}

export async function updateAccount(
  userId: string,
  id: string,
  input: Partial<NewAccountInput>,
): Promise<void> {
  if (!isDbConfigured) {
    memUpdateAccount(userId, id, input);
    return;
  }
  await connectToDatabase();
  await Account.findOneAndUpdate({ _id: id, userId }, { $set: { ...input } });
}

export async function deleteAccount(userId: string, id: string): Promise<void> {
  if (!isDbConfigured) {
    memDeleteAccount(userId, id);
    return;
  }
  await connectToDatabase();
  await Account.deleteOne({ _id: id, userId });
}
