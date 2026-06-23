// Seeds/cleans clearly-marked sample expenses for smoke-testing the UI.
//   npx tsx --env-file=.env.local scripts/smoke.ts seed
//   npx tsx --env-file=.env.local scripts/smoke.ts clean
import mongoose from "mongoose";
import { isDbConfigured } from "@/lib/db";
import { Budget } from "@/lib/models/budget";
import { listCategories } from "@/lib/data/categories";
import {
  createExpense,
  deleteExpense,
  getDashboardStats,
  loadRawExpenses,
} from "@/lib/data/expenses";
import { markPlannedDone } from "@/lib/data/planned";
import { applyPreset } from "@/lib/data/presets";
import { importExpensesFromBuffer } from "@/lib/data/import-export";
import { setOverallMonthlyBudget } from "@/lib/data/budget";
import {
  createPlanned,
  deletePlanned,
  listPlanned,
} from "@/lib/data/planned";
import {
  createPreset,
  deletePreset,
  listPresets,
} from "@/lib/data/presets";
import {
  createTransfer,
  deleteTransfer,
  listTransfers,
} from "@/lib/data/transfers";
import { currentMonthKey } from "@/lib/dates";
import { DEMO_USER_ID } from "@/lib/constants";

const MARK = "__smoke__";

function dayAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function seed() {
  const cats = await listCategories(DEMO_USER_ID);
  const pick = (name: string) => cats.find((c) => c.name === name) ?? cats[0];

  const inputs = [
    { amount: 250, cat: "Food", label: `${MARK} Lunch`, pm: "UPI", date: dayAgo(0) },
    { amount: 600, cat: "Shopping", label: `${MARK} Shirt`, pm: "Credit Card", date: dayAgo(3) },
    { amount: 1500, cat: "Bills", label: `${MARK} Internet`, pm: "Bank", date: dayAgo(15) },
  ] as const;

  const ids: string[] = [];
  for (const i of inputs) {
    const e = await createExpense(DEMO_USER_ID, {
      amount: i.amount,
      categoryId: pick(i.cat).id,
      label: i.label,
      paymentMethod: i.pm,
      expenseDate: i.date,
    });
    ids.push(e.id);
  }
  console.log("SEEDED_IDS=" + ids.join(","));
  console.log("EDIT_ID=" + ids[0]);
}

async function clean() {
  const raws = await loadRawExpenses(DEMO_USER_ID);
  const targets = raws.filter((r) => r.label.startsWith(MARK));
  for (const r of targets) await deleteExpense(DEMO_USER_ID, r.id);
  console.log("CLEANED=" + targets.length);
}

async function budget() {
  const month = currentMonthKey();
  await setOverallMonthlyBudget(DEMO_USER_ID, 20000, month);
  const stats = await getDashboardStats(DEMO_USER_ID);
  console.log(
    `budget=20000 monthSpend=${stats.monthSpend} remaining=${stats.remainingBudget}`,
  );
  // cleanup the budget doc so nothing is left behind
  if (isDbConfigured) await Budget.deleteOne({ userId: DEMO_USER_ID, month });
  console.log("budget cleaned");
}

async function featSeed() {
  const cats = await listCategories(DEMO_USER_ID);
  const food = cats.find((c) => c.name === "Food") ?? cats[0];
  const due = new Date();
  due.setDate(due.getDate() + 4);

  const sub = await createPlanned(DEMO_USER_ID, {
    direction: "out",
    amount: 199,
    label: `${MARK} Netflix`,
    categoryId: cats.find((c) => c.name === "Entertainment")?.id,
    dueDate: due,
    recurring: true,
    frequency: "monthly",
    paymentMethod: "UPI",
  });
  const income = await createPlanned(DEMO_USER_ID, {
    direction: "in",
    amount: 5000,
    label: `${MARK} Salary`,
    counterparty: "Employer",
    dueDate: due,
    recurring: false,
  });
  await createPreset(DEMO_USER_ID, {
    emoji: "☕",
    label: `${MARK} Coffee`,
    amount: 50,
    categoryId: food.id,
    paymentMethod: "UPI",
  });
  await createTransfer(DEMO_USER_ID, {
    direction: "in",
    amount: 2000,
    person: `${MARK} Mom`,
    paymentMethod: "UPI",
    transferDate: new Date(),
  });
  const sent = await createTransfer(DEMO_USER_ID, {
    direction: "out",
    amount: 500,
    person: `${MARK} Rahul`,
    paymentMethod: "UPI",
    transferDate: new Date(),
  });
  console.log(`PLANNED_OUT=${sub.id} PLANNED_IN=${income.id} TRANSFER=${sent.id}`);
}

async function featClean() {
  const planned = await listPlanned(DEMO_USER_ID);
  let n = 0;
  for (const p of planned)
    if (p.label.startsWith(MARK)) {
      await deletePlanned(DEMO_USER_ID, p.id);
      n++;
    }
  const presets = await listPresets(DEMO_USER_ID);
  for (const p of presets)
    if (p.label.startsWith(MARK)) {
      await deletePreset(DEMO_USER_ID, p.id);
      n++;
    }
  const transfers = await listTransfers(DEMO_USER_ID);
  for (const t of transfers)
    if (t.person.startsWith(MARK)) {
      await deleteTransfer(DEMO_USER_ID, t.id);
      n++;
    }
  console.log("FEAT_CLEANED=" + n);
}

async function featVerify() {
  const before = (await loadRawExpenses(DEMO_USER_ID)).length;

  const planned = await listPlanned(DEMO_USER_ID);
  const sub = planned.find(
    (p) => p.label.startsWith(MARK) && p.direction === "out" && p.recurring,
  );
  if (sub) {
    const oldDue = sub.dueDate;
    await markPlannedDone(DEMO_USER_ID, sub.id);
    const after = await listPlanned(DEMO_USER_ID);
    const still = after.find((p) => p.id === sub.id);
    console.log(
      `markDone(out,recurring): stillExists=${!!still} advanced=${
        still ? still.dueDate !== oldDue : false
      }`,
    );
  }

  const presets = await listPresets(DEMO_USER_ID);
  const coffee = presets.find((p) => p.label.startsWith(MARK));
  if (coffee) await applyPreset(DEMO_USER_ID, coffee.id);

  const after = (await loadRawExpenses(DEMO_USER_ID)).length;
  console.log(`expenses ${before} -> ${after} (+${after - before}, expected +2)`);
}

async function importTest() {
  const csv = [
    "Date,Amount,Category,Label,Payment Method,Note",
    `2026-06-20,150,Food,${MARK} ImportA,UPI,from csv`,
    `2026-06-19,90,Travel,${MARK} ImportB,Cash,`,
    `,,,${MARK} Bad,,`, // invalid: no amount/date → should skip
  ].join("\n");
  const res = await importExpensesFromBuffer(
    DEMO_USER_ID,
    Buffer.from(csv, "utf-8"),
  );
  console.log(`import: imported=${res.imported} skipped=${res.skipped} (expected 2 / 1)`);
}

const arg = process.argv[2];
const mode =
  arg === "clean"
    ? clean
    : arg === "budget"
      ? budget
      : arg === "feat-seed"
        ? featSeed
        : arg === "feat-clean"
          ? featClean
          : arg === "feat-verify"
            ? featVerify
            : arg === "import-test"
              ? importTest
              : seed;
mode()
  .then(async () => {
    if (isDbConfigured) await mongoose.disconnect();
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
