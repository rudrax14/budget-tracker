"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/session";
import {
  createPlanned,
  deletePlanned,
  markPlannedDone,
  updatePlanned,
} from "@/lib/data/planned";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";
import type {
  NewPlannedInput,
  PlannedDirection,
  PlannedFrequency,
} from "@/lib/data/types";

export interface PlannedFormState {
  error?: string;
}

type ParseResult =
  | { ok: true; value: NewPlannedInput }
  | { ok: false; error: string };

function parsePlanned(formData: FormData): ParseResult {
  const direction = String(formData.get("direction") ?? "out") as PlannedDirection;
  const amount = Number(formData.get("amount"));
  const label = String(formData.get("label") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const counterparty = String(formData.get("counterparty") ?? "").trim();
  const dueStr = String(formData.get("dueDate") ?? "");
  const recurringRaw = formData.get("recurring");
  const recurring = recurringRaw === "on" || recurringRaw === "true";
  const frequency = String(formData.get("frequency") ?? "") as PlannedFrequency;
  const pmRaw = String(formData.get("paymentMethod") ?? "");

  if (direction !== "out" && direction !== "in")
    return { ok: false, error: "Pick a type." };
  if (!amount || amount <= 0) return { ok: false, error: "Enter a valid amount." };
  if (!label) return { ok: false, error: "Add a label." };
  if (!dueStr) return { ok: false, error: "Pick a due date." };
  const dueDate = new Date(dueStr);
  if (Number.isNaN(dueDate.getTime())) return { ok: false, error: "Invalid date." };
  if (recurring && !["weekly", "monthly", "yearly"].includes(frequency))
    return { ok: false, error: "Pick how often it repeats." };

  const paymentMethod = PAYMENT_METHODS.includes(pmRaw as PaymentMethod)
    ? (pmRaw as PaymentMethod)
    : undefined;

  return {
    ok: true,
    value: {
      direction,
      amount,
      label,
      note: note || undefined,
      categoryId: categoryId || undefined,
      counterparty: counterparty || undefined,
      dueDate,
      recurring,
      frequency: recurring ? frequency : undefined,
      paymentMethod: direction === "out" ? paymentMethod : undefined,
    },
  };
}

export async function addPlannedAction(
  _prev: PlannedFormState,
  formData: FormData,
): Promise<PlannedFormState> {
  const parsed = parsePlanned(formData);
  if (!parsed.ok) return { error: parsed.error };

  const userId = await getCurrentUserId();
  await createPlanned(userId, parsed.value);

  revalidatePath("/planned");
  revalidatePath("/");
  redirect("/planned");
}

export async function updatePlannedAction(
  _prev: PlannedFormState,
  formData: FormData,
): Promise<PlannedFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing id." };

  const parsed = parsePlanned(formData);
  if (!parsed.ok) return { error: parsed.error };

  const userId = await getCurrentUserId();
  const updated = await updatePlanned(userId, id, parsed.value);
  if (!updated) return { error: "Planned item not found." };

  revalidatePath("/planned");
  revalidatePath("/");
  redirect("/planned");
}

export async function deletePlannedAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const userId = await getCurrentUserId();
  await deletePlanned(userId, id);
  revalidatePath("/planned");
  revalidatePath("/");
}

export async function markPlannedDoneAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const userId = await getCurrentUserId();
  await markPlannedDone(userId, id);
  revalidatePath("/planned");
  revalidatePath("/");
  revalidatePath("/expenses");
}
