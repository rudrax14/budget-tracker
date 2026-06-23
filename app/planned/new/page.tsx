import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listCategories } from "@/lib/data/categories";
import { getCurrentUserId } from "@/lib/session";
import { PlannedForm } from "@/components/planned/planned-form";
import { addPlannedAction } from "@/lib/actions/planned";

export const metadata = { title: "Add Planned · Budget Tracker" };
export const dynamic = "force-dynamic";

function todayInputValue(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default async function NewPlannedPage() {
  const userId = await getCurrentUserId();
  const categories = await listCategories(userId);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/planned"
          aria-label="Back to planned"
          className="hover:bg-accent inline-flex size-9 items-center justify-center rounded-full"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-semibold">Add Planned Payment</h1>
      </header>

      <PlannedForm
        action={addPlannedAction}
        categories={categories}
        defaultDueDate={todayInputValue()}
        submitLabel="Add planned"
      />
    </div>
  );
}
