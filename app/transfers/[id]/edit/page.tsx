import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTransferById } from "@/lib/data/transfers";
import { listAccounts } from "@/lib/data/accounts";
import { getCurrentUserId } from "@/lib/session";
import { TransferForm } from "@/components/transfers/transfer-form";
import { updateTransferAction } from "@/lib/actions/transfers";

export const metadata = { title: "Edit Transfer · Budget Tracker" };
export const dynamic = "force-dynamic";

function toDateInput(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default async function EditTransferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const [transfer, accounts] = await Promise.all([
    getTransferById(userId, id),
    listAccounts(userId),
  ]);

  if (!transfer) notFound();

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/transfers"
          aria-label="Back to transfers"
          className="hover:bg-accent inline-flex size-9 items-center justify-center rounded-full"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-semibold">Edit Transfer</h1>
      </header>

      <TransferForm
        action={updateTransferAction}
        accounts={accounts}
        defaultDate={toDateInput(transfer.transferDate)}
        transfer={transfer}
        submitLabel="Update transfer"
      />
    </div>
  );
}
