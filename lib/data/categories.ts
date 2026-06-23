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
import { cachedRead, revalidateUser } from "@/lib/data/cache";

export interface CategoryInput {
  name: string;
  icon?: string;
  color?: string;
}

// MongoDB duplicate-key error code. Raised when an insert/update would violate
// the unique (userId, name) index. insertMany({ ordered: false }) wraps these
// in a bulk-write error whose writeErrors all carry the same code.
function isDuplicateKeyError(err: unknown): boolean {
  const e = err as { code?: number; writeErrors?: { code?: number }[] };
  if (e?.code === 11000) return true;
  return Boolean(e?.writeErrors?.length) &&
    e.writeErrors!.every((w) => w.code === 11000);
}

// Thrown when the caller tries to create/rename a category to a name the user
// already has. Action handlers turn this into a friendly form error.
export class DuplicateCategoryError extends Error {
  constructor() {
    super("You already have a category with that name.");
    this.name = "DuplicateCategoryError";
  }
}

export async function listCategories(userId: string): Promise<CategoryDTO[]> {
 return cachedRead(userId, "listCategories", async () => {
  if (!isDbConfigured) {
    return memGetCategories(userId);
  }

  await connectToDatabase();

  let docs = await Category.find({ userId }).sort({ name: 1 }).lean();

  // Seed the default categories the first time a user is seen. Several server
  // components fetch categories in parallel on first load, so this can run
  // concurrently — the unique (userId, name) index + ordered:false insert make
  // it idempotent: duplicate inserts fail with E11000 and are ignored.
  if (docs.length === 0) {
    try {
      await Category.insertMany(
        DEFAULT_CATEGORIES.map((c) => ({ ...c, userId, isDefault: true })),
        { ordered: false },
      );
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
    }
    docs = await Category.find({ userId }).sort({ name: 1 }).lean();
  }

  return docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    icon: d.icon ?? undefined,
    color: d.color ?? undefined,
    isDefault: Boolean(d.isDefault),
  }));
 });
}

export async function createCategory(
  userId: string,
  input: CategoryInput,
): Promise<CategoryDTO> {
  if (!isDbConfigured) {
    return memAddCategory(userId, input);
  }

  await connectToDatabase();
  let doc;
  try {
    doc = await Category.create({ ...input, userId, isDefault: false });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new DuplicateCategoryError();
    throw err;
  }
  revalidateUser(userId);
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
  try {
    await Category.findOneAndUpdate({ _id: id, userId }, { $set: { ...patch } });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new DuplicateCategoryError();
    throw err;
  }
  revalidateUser(userId);
}

export async function deleteCategory(userId: string, id: string): Promise<void> {
  if (!isDbConfigured) {
    memDeleteCategory(userId, id);
    return;
  }

  await connectToDatabase();
  await Category.deleteOne({ _id: id, userId });
  revalidateUser(userId);
}
