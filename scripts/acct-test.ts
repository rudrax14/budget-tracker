// Seeds/cleans account-balance test data.
//   npx tsx --env-file=.env.local scripts/acct-test.ts seed
//   npx tsx --env-file=.env.local scripts/acct-test.ts clean
import mongoose from "mongoose";
import { Account } from "@/lib/models/account";
import { listAccounts, updateAccount } from "@/lib/data/accounts";
import {
  createExpense,
  deleteExpense,
  loadRawExpenses,
} from "@/lib/data/expenses";
import {
  createTransfer,
  deleteTransfer,
  listTransfers,
} from "@/lib/data/transfers";
import { listCategories } from "@/lib/data/categories";
import { DEMO_USER_ID } from "@/lib/constants";

const MARK = "__smoke__";

async function seed() {
  const accts = await listAccounts(DEMO_USER_ID);
  const cash = accts.find((a) => a.name === "Cash") ?? accts[0];
  const online = accts.find((a) => a.name === "Online") ?? accts[1] ?? accts[0];
  await updateAccount(DEMO_USER_ID, cash.id, { openingBalance: 10000 });
  await updateAccount(DEMO_USER_ID, online.id, { openingBalance: 6000 });

  const cats = await listCategories(DEMO_USER_ID);
  const food = cats.find((c) => c.name === "Food") ?? cats[0];
  const yest = new Date(Date.now() - 86_400_000);
  await createExpense(DEMO_USER_ID, { amount: 30, categoryId: food.id, accountId: online.id, label: `${MARK} Lassi`, paymentMethod: "UPI", expenseDate: yest });
  await createExpense(DEMO_USER_ID, { amount: 20, categoryId: food.id, accountId: online.id, label: `${MARK} Sugarcane`, paymentMethod: "UPI", expenseDate: yest });
  await createTransfer(DEMO_USER_ID, { direction: "in", amount: 2000, person: `${MARK} Mom`, accountId: cash.id, transferDate: new Date() });

  const after = await listAccounts(DEMO_USER_ID);
  console.log("balances:", after.map((a) => `${a.name}=${a.balance}`).join(", "));
  console.log("total:", after.reduce((s, a) => s + a.balance, 0));
}

async function dedupeAccounts() {
  const docs = await Account.find({ userId: DEMO_USER_ID }).sort({ createdAt: 1 });
  const seen = new Set<string>();
  let removed = 0;
  for (const d of docs) {
    const k = d.name.toLowerCase();
    if (seen.has(k)) {
      await Account.deleteOne({ _id: d._id });
      removed++;
    } else seen.add(k);
  }
  return removed;
}

async function clean() {
  for (const e of await loadRawExpenses(DEMO_USER_ID))
    if (e.label.startsWith(MARK)) await deleteExpense(DEMO_USER_ID, e.id);
  for (const t of await listTransfers(DEMO_USER_ID))
    if (t.person.startsWith(MARK)) await deleteTransfer(DEMO_USER_ID, t.id);
  const removed = await dedupeAccounts();
  for (const a of await listAccounts(DEMO_USER_ID))
    await updateAccount(DEMO_USER_ID, a.id, { openingBalance: 0 });
  console.log(`cleaned records, removed ${removed} dup accounts, reset openings`);
}

(process.argv[2] === "clean" ? clean() : seed())
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
