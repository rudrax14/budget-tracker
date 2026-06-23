import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUserId } from "@/lib/session";
import { listAccounts } from "@/lib/data/accounts";
import { TransferForm } from "@/components/transfers/transfer-form";
import { addTransferAction } from "@/lib/actions/transfers";

export const metadata = { title: "Add Transfer · Budget Tracker" };
export const dynamic = "force-dynamic";

function todayInputValue(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default async function NewTransferPage() {
  const userId = await getCurrentUserId();
  const accounts = await listAccounts(userId);

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
        <h1 className="text-xl font-semibold">Send / Receive Money</h1>
      </header>

      <TransferForm
        action={addTransferAction}
        accounts={accounts}
        defaultDate={todayInputValue()}
        submitLabel="Save transfer"
      />
    </div>
  );
}
