"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import {
  createTransfer,
  deleteTransfer,
  updateTransfer,
} from "@/lib/data/transfers";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";
import type { NewTransferInput, TransferDirection } from "@/lib/data/types";

export interface TransferFormState {
  error?: string;
}

type ParseResult =
  | { ok: true; value: NewTransferInput }
  | { ok: false; error: string };

function parseTransfer(formData: FormData): ParseResult {
  const direction = String(formData.get("direction") ?? "out") as TransferDirection;
  const amount = Number(formData.get("amount"));
  const person = String(formData.get("person") ?? "").trim();
  const accountId = String(formData.get("accountId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const dateStr = String(formData.get("transferDate") ?? "");
  const pmRaw = String(formData.get("paymentMethod") ?? "");

  if (direction !== "in" && direction !== "out")
    return { ok: false, error: "Pick sent or received." };
  if (!amount || amount <= 0) return { ok: false, error: "Enter a valid amount." };
  if (!person) return { ok: false, error: "Add a person." };
  if (!dateStr) return { ok: false, error: "Pick a date." };
  const transferDate = new Date(dateStr);
  if (Number.isNaN(transferDate.getTime()))
    return { ok: false, error: "Invalid date." };

  const paymentMethod = PAYMENT_METHODS.includes(pmRaw as PaymentMethod)
    ? (pmRaw as PaymentMethod)
    : undefined;

  return {
    ok: true,
    value: {
      direction,
      amount,
      person,
      accountId: accountId || undefined,
      note: note || undefined,
      paymentMethod,
      transferDate,
    },
  };
}

export async function addTransferAction(
  _prev: TransferFormState,
  formData: FormData,
): Promise<TransferFormState> {
  const parsed = parseTransfer(formData);
  if (!parsed.ok) return { error: parsed.error };

  const userId = await getCurrentUserId();
  await createTransfer(userId, parsed.value);

  revalidatePath("/transfers");
  revalidatePath("/");
  redirect("/transfers");
}

export async function updateTransferAction(
  _prev: TransferFormState,
  formData: FormData,
): Promise<TransferFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing id." };

  const parsed = parseTransfer(formData);
  if (!parsed.ok) return { error: parsed.error };

  const userId = await getCurrentUserId();
  const updated = await updateTransfer(userId, id, parsed.value);
  if (!updated) return { error: "Transfer not found." };

  revalidatePath("/transfers");
  revalidatePath("/");
  redirect("/transfers");
}

export async function deleteTransferAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const userId = await getCurrentUserId();
  await deleteTransfer(userId, id);
  revalidatePath("/transfers");
  revalidatePath("/");
}
