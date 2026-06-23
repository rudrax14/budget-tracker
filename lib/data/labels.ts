import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { Label } from "@/lib/models/label";
import { loadRawExpenses } from "@/lib/data/expenses";
import {
  memAddLabel,
  memDeleteLabel,
  memGetLabels,
  type RawLabel,
} from "@/lib/data/memory-store";
import type { LabelDTO, NewLabelInput } from "@/lib/data/types";
import { cachedRead, revalidateUser } from "@/lib/data/cache";

const FALLBACK_COLOR = "#22d3ee";

async function loadRawLabels(userId: string): Promise<RawLabel[]> {
  if (!isDbConfigured) return memGetLabels(userId);
  await connectToDatabase();
  const docs = await Label.find({ userId }).sort({ name: 1 }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    userId,
    name: d.name,
    color: d.color ?? FALLBACK_COLOR,
  }));
}

// Labels ordered most-frequently-used first (for the picker's "most frequent").
export async function listLabels(userId: string): Promise<LabelDTO[]> {
 return cachedRead(userId, "listLabels", async () => {
  const [labels, expenses] = await Promise.all([
    loadRawLabels(userId),
    loadRawExpenses(userId),
  ]);

  const counts = new Map<string, number>();
  for (const e of expenses)
    for (const id of e.labelIds ?? [])
      counts.set(id, (counts.get(id) ?? 0) + 1);

  return labels
    .map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color,
      count: counts.get(l.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
 });
}

export async function createLabel(
  userId: string,
  input: NewLabelInput,
): Promise<LabelDTO> {
  if (!isDbConfigured) {
    const r = memAddLabel(userId, input);
    return { id: r.id, name: r.name, color: r.color, count: 0 };
  }
  await connectToDatabase();
  const doc = await Label.create({ ...input, userId });
  revalidateUser(userId);
  return {
    id: String(doc._id),
    name: doc.name,
    color: doc.color ?? input.color,
    count: 0,
  };
}

export async function deleteLabel(userId: string, id: string): Promise<void> {
  if (!isDbConfigured) {
    memDeleteLabel(userId, id);
    return;
  }
  await connectToDatabase();
  await Label.deleteOne({ _id: id, userId });
  revalidateUser(userId);
}
