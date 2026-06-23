import { DEMO_USER_ID } from "@/lib/constants";

// Authentication has been removed for now — the app runs as a single local
// user. When you add auth later, resolve the signed-in user's id here.
export async function getCurrentUserId(): Promise<string> {
  return DEMO_USER_ID;
}
