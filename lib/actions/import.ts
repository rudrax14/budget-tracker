"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/session";
import { importExpensesFromBuffer } from "@/lib/data/import-export";

export interface ImportState {
  error?: string;
  done?: boolean;
  imported?: number;
  skipped?: number;
}

export async function importExpensesAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a .xlsx or .csv file to import." };
  }
  if (file.size > 5_000_000) {
    return { error: "File is too large (max 5 MB)." };
  }

  let result;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const userId = await getCurrentUserId();
    result = await importExpensesFromBuffer(userId, buf);
  } catch {
    return { error: "Could not read that file. Use the exported format." };
  }

  revalidatePath("/");
  revalidatePath("/expenses");
  return { done: true, imported: result.imported, skipped: result.skipped };
}
