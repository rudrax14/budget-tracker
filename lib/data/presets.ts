import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { Preset } from "@/lib/models/preset";
import { listCategories } from "@/lib/data/categories";
import { createExpense } from "@/lib/data/expenses";
import {
  memAddPreset,
  memDeletePreset,
  memGetPreset,
  memGetPresets,
} from "@/lib/data/memory-store";
import type { CategoryDTO, NewPresetInput, PresetDTO } from "@/lib/data/types";
import type { PaymentMethod } from "@/lib/constants";

interface RawPresetLike {
  id: string;
  emoji?: string;
  label: string;
  amount: number;
  categoryId: string;
  paymentMethod: PaymentMethod;
}

function toDTO(raw: RawPresetLike, byId: Map<string, CategoryDTO>): PresetDTO {
  return {
    id: raw.id,
    emoji: raw.emoji,
    label: raw.label,
    amount: raw.amount,
    categoryId: raw.categoryId,
    categoryName: byId.get(raw.categoryId)?.name,
    paymentMethod: raw.paymentMethod,
  };
}

export async function listPresets(userId: string): Promise<PresetDTO[]> {
  const cats = await listCategories(userId);
  const byId = new Map(cats.map((c) => [c.id, c]));

  if (!isDbConfigured) {
    return memGetPresets(userId).map((r) => toDTO(r, byId));
  }

  await connectToDatabase();
  const docs = await Preset.find({ userId }).sort({ createdAt: 1 }).lean();
  return docs.map((d) =>
    toDTO(
      {
        id: String(d._id),
        emoji: d.emoji ?? undefined,
        label: d.label,
        amount: d.amount,
        categoryId: String(d.categoryId),
        paymentMethod: d.paymentMethod as PaymentMethod,
      },
      byId,
    ),
  );
}

export async function createPreset(
  userId: string,
  input: NewPresetInput,
): Promise<void> {
  if (!isDbConfigured) {
    memAddPreset(userId, input);
    return;
  }
  await connectToDatabase();
  await Preset.create({ userId, ...input });
}

export async function deletePreset(userId: string, id: string): Promise<void> {
  if (!isDbConfigured) {
    memDeletePreset(userId, id);
    return;
  }
  await connectToDatabase();
  await Preset.deleteOne({ _id: id, userId });
}

// One-tap: turns a preset into a real expense dated today.
export async function applyPreset(userId: string, id: string): Promise<boolean> {
  let preset: RawPresetLike | null = null;

  if (!isDbConfigured) {
    const r = memGetPreset(userId, id);
    preset = r
      ? {
          id: r.id,
          emoji: r.emoji,
          label: r.label,
          amount: r.amount,
          categoryId: r.categoryId,
          paymentMethod: r.paymentMethod,
        }
      : null;
  } else {
    await connectToDatabase();
    const d = await Preset.findOne({ _id: id, userId }).lean();
    preset = d
      ? {
          id: String(d._id),
          label: d.label,
          amount: d.amount,
          categoryId: String(d.categoryId),
          paymentMethod: d.paymentMethod as PaymentMethod,
        }
      : null;
  }

  if (!preset) return false;

  await createExpense(userId, {
    amount: preset.amount,
    categoryId: preset.categoryId,
    label: preset.label,
    paymentMethod: preset.paymentMethod,
    expenseDate: new Date(),
  });
  return true;
}
