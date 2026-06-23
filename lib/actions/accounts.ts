"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/session";
import {
  createAccount,
  deleteAccount,
  updateAccount,
} from "@/lib/data/accounts";
import { ACCOUNT_TYPES, type AccountType } from "@/lib/constants";
import type { NewAccountInput } from "@/lib/data/types";

export interface AccountFormState {
  error?: string;
  ok?: boolean;
}

function parseAccount(formData: FormData): NewAccountInput {
  const name = String(formData.get("name") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "cash") as AccountType;
  const type = ACCOUNT_TYPES.includes(typeRaw) ? typeRaw : "cash";
  const color = String(formData.get("color") ?? "").trim() || undefined;
  const openingBalance = Number(formData.get("openingBalance")) || 0;
  return { name, type, color, openingBalance };
}

export async function createAccountAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const input = parseAccount(formData);
  if (!input.name) return { error: "Account name is required." };

  const userId = await getCurrentUserId();
  await createAccount(userId, input);

  revalidatePath("/");
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateAccountAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing account id." };

  const input = parseAccount(formData);
  if (!input.name) return { error: "Account name is required." };

  const userId = await getCurrentUserId();
  await updateAccount(userId, id, input);

  revalidatePath("/");
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteAccountAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const userId = await getCurrentUserId();
  await deleteAccount(userId, id);
  revalidatePath("/");
  revalidatePath("/settings");
}
