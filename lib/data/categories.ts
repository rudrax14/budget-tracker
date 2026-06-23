import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { Category } from "@/lib/models/category";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import {
  memAddCategory,
  memDeleteCategory,
  memGetCategories,
  memUpdateCategory,
} from "@/lib/data/memory-store";
import type { CategoryDTO } from "@/lib/data/types";

export interface CategoryInput {
  name: string;
  icon?: string;
  color?: string;
}

export async function listCategories(userId: string): Promise<CategoryDTO[]> {
  if (!isDbConfigured) {
    return memGetCategories(userId);
  }

  await connectToDatabase();

  let docs = await Category.find({ userId }).sort({ name: 1 }).lean();

  // Seed the default categories the first time a user is seen.
  if (docs.length === 0) {
    await Category.insertMany(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, userId, isDefault: true })),
    );
    docs = await Category.find({ userId }).sort({ name: 1 }).lean();
  }

  return docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    icon: d.icon ?? undefined,
    color: d.color ?? undefined,
    isDefault: Boolean(d.isDefault),
  }));
}

export async function createCategory(
  userId: string,
  input: CategoryInput,
): Promise<CategoryDTO> {
  if (!isDbConfigured) {
    return memAddCategory(userId, input);
  }

  await connectToDatabase();
  const doc = await Category.create({ ...input, userId, isDefault: false });
  return {
    id: String(doc._id),
    name: doc.name,
    icon: doc.icon ?? undefined,
    color: doc.color ?? undefined,
    isDefault: false,
  };
}

export async function updateCategory(
  userId: string,
  id: string,
  patch: CategoryInput,
): Promise<void> {
  if (!isDbConfigured) {
    memUpdateCategory(userId, id, patch);
    return;
  }

  await connectToDatabase();
  await Category.findOneAndUpdate({ _id: id, userId }, { $set: { ...patch } });
}

export async function deleteCategory(userId: string, id: string): Promise<void> {
  if (!isDbConfigured) {
    memDeleteCategory(userId, id);
    return;
  }

  await connectToDatabase();
  await Category.deleteOne({ _id: id, userId });
}
