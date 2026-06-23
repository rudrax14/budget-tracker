"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/session";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/data/categories";

export interface CategoryFormState {
  error?: string;
  ok?: boolean;
}

function parseCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  return { name, icon: icon || undefined, color: color || undefined };
}

export async function createCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const input = parseCategory(formData);
  if (!input.name) return { error: "Category name is required." };

  const userId = await getCurrentUserId();
  await createCategory(userId, input);

  revalidatePath("/settings");
  revalidatePath("/expense/new");
  return { ok: true };
}

export async function updateCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const id = String(formData.get("id") ?? "");
  const input = parseCategory(formData);
  if (!id) return { error: "Missing category id." };
  if (!input.name) return { error: "Category name is required." };

  const userId = await getCurrentUserId();
  await updateCategory(userId, id, input);

  revalidatePath("/settings");
  revalidatePath("/expenses");
  return { ok: true };
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const userId = await getCurrentUserId();
  await deleteCategory(userId, id);

  revalidatePath("/settings");
}
