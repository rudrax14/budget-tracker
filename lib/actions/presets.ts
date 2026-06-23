"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/session";
import { applyPreset, createPreset, deletePreset } from "@/lib/data/presets";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/constants";

export interface PresetFormState {
  error?: string;
  ok?: boolean;
}

export async function createPresetAction(
  _prev: PresetFormState,
  formData: FormData,
): Promise<PresetFormState> {
  const emoji = String(formData.get("emoji") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const pm = String(formData.get("paymentMethod") ?? "") as PaymentMethod;

  if (!label) return { error: "Add a label." };
  if (!amount || amount <= 0) return { error: "Enter a valid amount." };
  if (!categoryId) return { error: "Pick a category." };

  const paymentMethod = PAYMENT_METHODS.includes(pm) ? pm : "UPI";

  const userId = await getCurrentUserId();
  await createPreset(userId, {
    emoji: emoji || undefined,
    label,
    amount,
    categoryId,
    paymentMethod,
  });

  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true };
}

export async function deletePresetAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const userId = await getCurrentUserId();
  await deletePreset(userId, id);
  revalidatePath("/settings");
  revalidatePath("/");
}

// One-tap quick add from the dashboard.
export async function quickAddPresetAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const userId = await getCurrentUserId();
  await applyPreset(userId, id);
  revalidatePath("/");
  revalidatePath("/expenses");
}
