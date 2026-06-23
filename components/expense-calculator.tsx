"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import type { RecordFormState } from "@/lib/actions/quick-add";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { AccountDTO, CategoryDTO, LabelDTO } from "@/lib/data/types";
import { LabelPicker } from "@/components/label-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RecordAction = (
  state: RecordFormState,
  formData: FormData,
) => Promise<RecordFormState>;

const initialState: RecordFormState = {};

type Tab = "income" | "expense" | "transfer";
const TABS: Tab[] = ["income", "expense", "transfer"];

// Keep only digits and a single dot, capped at two decimals.
function sanitizeAmount(raw: string): string {
  let s = raw.replace(/[^\d.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
  }
  const [int, dec] = s.split(".");
  return dec !== undefined ? `${int}.${dec.slice(0, 2)}` : int;
}

const CARD = "rounded-xl bg-card ring-1 ring-foreground/10";

export function ExpenseCalculator({
  action,
  categories,
  accounts = [],
  labels = [],
  labelSuggestions = [],
  defaultDate,
}: {
  action: RecordAction;
  categories: CategoryDTO[];
  accounts?: AccountDTO[];
  labels?: LabelDTO[];
  labelSuggestions?: string[];
  defaultDate: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  // Default to the "Online" account (by type, then name), falling back to the
  // first account.
  const defaultAccountId =
    accounts.find((a) => a.type === "online")?.id ??
    accounts.find((a) => a.name.toLowerCase() === "online")?.id ??
    accounts[0]?.id ??
    "";

  const [tab, setTab] = useState<Tab>("expense");
  const [amount, setAmount] = useState("");
  const [person, setPerson] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [sheet, setSheet] = useState<null | "category" | "account">(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [initialDate] = useState(defaultDate);

  const isTransfer = tab === "income" || tab === "transfer";
  const canSave = parseFloat(amount) > 0 && (!isTransfer || person.trim() !== "");
  const title =
    tab === "income" ? "Add income" : tab === "transfer" ? "Add transfer" : "Add expense";

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  const category = categories.find((c) => c.id === categoryId);
  const account = accounts.find((a) => a.id === accountId);

  const amountLen = (amount || "0").length;
  const amountSize = amountLen > 11 ? "text-4xl" : amountLen > 8 ? "text-5xl" : "text-6xl";

  return (
    <form action={formAction}>
      <input type="hidden" name="kind" value={tab} readOnly />
      <input type="hidden" name="categoryId" value={categoryId} readOnly />
      <input type="hidden" name="accountId" value={accountId} readOnly />

      <div className="bg-background text-foreground fixed inset-0 z-40 flex justify-center">
        <div className="flex w-full max-w-md flex-col px-4">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <Link
              href="/"
              aria-label="Cancel"
              className="hover:bg-accent -ml-2 flex size-10 items-center justify-center rounded-full"
            >
              <X className="size-5" />
            </Link>
            <h1 className="truncate px-2 text-base font-semibold">{title}</h1>
            <Button type="submit" disabled={!canSave || isPending} size="sm" className="h-9 px-4">
              <Check className="size-4" strokeWidth={3} />
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>

          {/* Tabs (underline style, matching Home) */}
          <div className="grid shrink-0 grid-cols-3 border-b text-center text-sm">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "-mb-px border-b-2 pb-3 capitalize transition-colors",
                  tab === t
                    ? "border-foreground text-foreground font-semibold"
                    : "text-muted-foreground border-transparent",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Scrollable body — keeps every field reachable above the keyboard */}
          <div className="-mr-1 min-h-0 flex-1 overflow-y-auto pr-1 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {/* Amount — native number keyboard */}
          <div className="py-7 sm:py-10">
            <p className="text-muted-foreground text-center text-xs font-medium tracking-widest uppercase">
              Amount
            </p>
            <div className="mt-3 flex items-center justify-center gap-1">
              <span className="text-muted-foreground text-3xl font-bold">₹</span>
              <input
                name="amount"
                value={amount}
                onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                inputMode="decimal"
                enterKeyHint="done"
                autoFocus
                placeholder="0"
                aria-label="Amount"
                className={cn(
                  "placeholder:text-muted-foreground/30 w-full max-w-[72%] bg-transparent text-center font-bold tracking-tight tabular-nums outline-none",
                  amountSize,
                )}
              />
            </div>
          </div>

          {/* Account / Category */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSheet("account")}
              className={cn(CARD, "px-4 py-3 text-left transition active:scale-[0.98]")}
            >
              <span className="text-muted-foreground block text-xs">Account</span>
              <span className="mt-0.5 flex items-center gap-2 font-semibold">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: account?.color ?? "#3b82f6" }}
                />
                <span className="truncate">{account?.name ?? "—"}</span>
              </span>
            </button>

            {isTransfer ? (
              <div className={cn(CARD, "px-4 py-3")}>
                <span className="text-muted-foreground block text-xs">
                  {tab === "income" ? "From" : "To"}
                </span>
                <input
                  name="person"
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                  placeholder={tab === "income" ? "Received from" : "Paid to"}
                  className="placeholder:text-muted-foreground/40 mt-0.5 w-full bg-transparent font-semibold outline-none placeholder:font-normal"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSheet("category")}
                className={cn(CARD, "px-4 py-3 text-left transition active:scale-[0.98]")}
              >
                <span className="text-muted-foreground block text-xs">Category</span>
                <span className="mt-0.5 flex items-center gap-2 font-semibold">
                  <span className="shrink-0">{category?.icon ?? "🏷️"}</span>
                  <span className="truncate">{category?.name ?? "—"}</span>
                </span>
              </button>
            )}
          </div>

          {/* Title (only for expenses) — directly editable here */}
          {!isTransfer ? (
            <>
              <input
                name="label"
                placeholder="Title (optional) — defaults to category"
                autoComplete="off"
                list="expense-labels"
                className={cn(
                  CARD,
                  "placeholder:text-muted-foreground focus-visible:ring-ring/50 mt-3 h-12 w-full px-4 text-base outline-none focus-visible:ring-2",
                )}
              />
              {labelSuggestions.length > 0 ? (
                <datalist id="expense-labels">
                  {labelSuggestions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              ) : null}
            </>
          ) : null}

          {/* Details */}
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className={cn(CARD, "mt-3 flex items-center gap-3 px-4 py-3.5 text-left transition active:scale-[0.99]")}
          >
            <SlidersHorizontal className="text-muted-foreground size-5" />
            <span className="flex-1">
              <span className="block text-sm font-medium">More details</span>
              <span className="text-muted-foreground block text-xs">
                {isTransfer ? "Payment, date & note" : "Labels, payment, date & note"}
              </span>
            </span>
            <ChevronRight className="text-muted-foreground size-5" />
          </button>
          </div>
        </div>
      </div>

      {/* ---------------- Account / Category sheet ---------------- */}
      {sheet ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/50"
            onClick={() => setSheet(null)}
          />
          <div className="bg-background animate-rise relative mx-auto max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-2xl p-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <div className="bg-muted-foreground/30 mx-auto mb-3 h-1.5 w-10 rounded-full" />
            <h2 className="mb-3 px-1 text-base font-semibold">
              {sheet === "account" ? "Choose account" : "Choose category"}
            </h2>
            <div className="grid grid-cols-1 gap-1">
              {sheet === "account"
                ? accounts.map((a) => (
                    <SheetRow
                      key={a.id}
                      active={a.id === accountId}
                      onClick={() => {
                        setAccountId(a.id);
                        setSheet(null);
                      }}
                    >
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: a.color ?? "#3b82f6" }}
                      />
                      {a.name}
                    </SheetRow>
                  ))
                : categories.map((c) => (
                    <SheetRow
                      key={c.id}
                      active={c.id === categoryId}
                      onClick={() => {
                        setCategoryId(c.id);
                        setSheet(null);
                      }}
                    >
                      <span className="text-lg">{c.icon ?? "🏷️"}</span>
                      {c.name}
                    </SheetRow>
                  ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------------- Details slide-over ---------------- */}
      <div
        className={cn(
          "bg-background fixed inset-0 z-50 flex justify-center transition-transform duration-300 ease-out",
          detailsOpen ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
        aria-hidden={!detailsOpen}
      >
        <div className="flex w-full max-w-md flex-col">
          <div className="flex items-center gap-2 border-b px-2 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={() => setDetailsOpen(false)}
              aria-label="Back"
              className="hover:bg-accent flex size-10 items-center justify-center rounded-full"
            >
              <ChevronLeft className="size-5" />
            </button>
            <h2 className="text-base font-semibold">Details</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDetailsOpen(false)}
              className="ml-auto"
            >
              Done
            </Button>
          </div>

          <div className="space-y-6 overflow-y-auto px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {!isTransfer ? (
              <Field label="Labels">
                <LabelPicker labels={labels} />
              </Field>
            ) : null}

            <Field label="Payment">
              <select
                id="paymentMethod"
                name="paymentMethod"
                defaultValue="UPI"
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-12 w-full rounded-xl border bg-transparent px-3.5 text-sm outline-none focus-visible:ring-3"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Date & time">
              <input
                id="date"
                name="date"
                type="datetime-local"
                defaultValue={initialDate}
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-12 w-full rounded-xl border bg-transparent px-3.5 text-base outline-none focus-visible:ring-3"
              />
            </Field>

            <Field label="Note">
              <input
                id="note"
                name="note"
                placeholder="Anything to remember"
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-12 w-full rounded-xl border bg-transparent px-3.5 text-base outline-none focus-visible:ring-3"
              />
            </Field>
          </div>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

function SheetRow({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-base transition",
        active ? "bg-accent font-semibold" : "hover:bg-accent/60",
      )}
    >
      {children}
      {active ? <Check className="text-foreground ml-auto size-4" /> : null}
    </button>
  );
}
