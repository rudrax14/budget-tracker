// One-off end-to-end check of the add-expense → dashboard data flow.
// Creates a test expense, confirms it appears in the dashboard stats, then
// deletes it so nothing is left behind. Run:
//   npx tsx --env-file=.env.local scripts/verify-flow.ts
import mongoose from "mongoose";
import { isDbConfigured, connectToDatabase } from "@/lib/db";
import { listCategories } from "@/lib/data/categories";
import { createExpense, getDashboardStats } from "@/lib/data/expenses";
import { Expense } from "@/lib/models/expense";
import { DEMO_USER_ID } from "@/lib/constants";

async function main() {
  console.log("isDbConfigured:", isDbConfigured);

  const cats = await listCategories(DEMO_USER_ID);
  const cat = cats.find((c) => c.name === "Food") ?? cats[0];
  console.log(`categories: ${cats.length} → using "${cat.name}"`);

  const before = await getDashboardStats(DEMO_USER_ID);

  const created = await createExpense(DEMO_USER_ID, {
    amount: 123,
    categoryId: cat.id,
    label: "__verify_test__",
    paymentMethod: "UPI",
    expenseDate: new Date(),
  });
  console.log(`created expense ${created.id} (${created.categoryName})`);

  const after = await getDashboardStats(DEMO_USER_ID);
  const appears = after.recentExpenses.some((e) => e.id === created.id);
  console.log(
    `today spend: ${before.todaySpend} → ${after.todaySpend} (+${
      after.todaySpend - before.todaySpend
    }) | appears in recent: ${appears}`,
  );

  // Cleanup (only relevant on the DB path).
  if (isDbConfigured) {
    await connectToDatabase();
    await Expense.deleteOne({ _id: created.id });
    await mongoose.disconnect();
    console.log("cleaned up test expense");
  }

  const ok = appears && after.todaySpend - before.todaySpend === 123;
  console.log(ok ? "✅ FLOW OK" : "❌ FLOW MISMATCH");
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error("VERIFY FAILED:", e);
  process.exit(1);
});
