"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/session";
import { createLabel, deleteLabel } from "@/lib/data/labels";
import type { LabelDTO } from "@/lib/data/types";

const PALETTE = [
  "#22d3ee",
  "#34d399",
  "#f472b6",
  "#fbbf24",
  "#a78bfa",
  "#60a5fa",
  "#fb7185",
  "#4ade80",
];

// Imperative server action: create a label and return it (used by the
// in-form label picker without submitting the expense).
export async function createLabelInline(
  name: string,
  colorHint?: string,
): Promise<LabelDTO | null> {
  const trimmed = name.trim().slice(0, 40);
  if (!trimmed) return null;

  const color = colorHint || PALETTE[trimmed.length % PALETTE.length];
  const userId = await getCurrentUserId();
  const label = await createLabel(userId, { name: trimmed, color });

  // Don't revalidate the expense form (would reset it mid-entry); the in-form
  // picker and the /labels screen track new labels in local state.
  revalidatePath("/settings");
  revalidatePath("/labels");
  return label;
}

export async function deleteLabelAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const userId = await getCurrentUserId();
  await deleteLabel(userId, id);
  revalidatePath("/settings");
  revalidatePath("/labels");
}

// Imperative variant for the /labels screen (manages its own local state).
export async function deleteLabelById(id: string): Promise<void> {
  if (!id) return;
  const userId = await getCurrentUserId();
  await deleteLabel(userId, id);
  revalidatePath("/settings");
  revalidatePath("/labels");
}
