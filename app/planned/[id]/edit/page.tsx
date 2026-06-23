import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { listCategories } from "@/lib/data/categories";
import { getPlannedById } from "@/lib/data/planned";
import { getCurrentUserId } from "@/lib/session";
import { PlannedForm } from "@/components/planned/planned-form";
import { updatePlannedAction } from "@/lib/actions/planned";

export const metadata = { title: "Edit Planned · Budget Tracker" };
export const dynamic = "force-dynamic";

function toDateInput(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default async function EditPlannedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const [planned, categories] = await Promise.all([
    getPlannedById(userId, id),
    listCategories(userId),
  ]);

  if (!planned) notFound();

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
        <h1 className="text-xl font-semibold">Edit Planned Payment</h1>
      </header>

      <PlannedForm
        action={updatePlannedAction}
        categories={categories}
        defaultDueDate={toDateInput(planned.dueDate)}
        planned={planned}
        submitLabel="Update planned"
      />
    </div>
  );
}
