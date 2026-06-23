import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, verifyAccessToken } from "@/lib/auth/tokens";
import { findUserById, type UserRecord } from "@/lib/data/users";

// Resolves the signed-in user's id from the verified access-token cookie.
//
// On protected routes the middleware guarantees a fresh, valid access token
// (refreshing it from the long-lived refresh token when needed), so this read
// normally just succeeds. If it somehow doesn't, we bounce to /login rather
// than fall back to a shared user.
export async function getCurrentUserId(): Promise<string> {
  const userId = await readUserId();
  if (!userId) redirect("/login");
  return userId;
}

// Same lookup without the redirect — for callers that want to branch on the
// absence of a session (e.g. the auth pages themselves).
export async function readUserId(): Promise<string | null> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  return verifyAccessToken(token);
}

// The full user record for the signed-in user (name/email for display).
export async function getCurrentUser(): Promise<UserRecord> {
  const userId = await getCurrentUserId();
  const user = await findUserById(userId);
  if (!user) redirect("/login");
  return user;
}
