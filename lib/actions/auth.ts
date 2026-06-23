"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  clearCookieOptions,
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
} from "@/lib/auth/tokens";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createUser, findUserByEmail } from "@/lib/data/users";

export interface AuthFormState {
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

// Issue a fresh access + refresh cookie pair for the given user.
async function establishSession(userId: string): Promise<void> {
  const [access, refresh] = await Promise.all([
    signAccessToken(userId),
    signRefreshToken(userId),
  ]);
  const store = await cookies();
  store.set(ACCESS_COOKIE, access, accessCookieOptions());
  store.set(REFRESH_COOKIE, refresh, refreshCookieOptions());
}

// Only allow same-origin relative redirects (avoid open-redirect via the form).
function safeRedirect(target: FormDataEntryValue | null): string {
  const value = typeof target === "string" ? target : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "Please enter your name." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (password.length < MIN_PASSWORD)
    return { error: `Password must be at least ${MIN_PASSWORD} characters.` };

  const existing = await findUserByEmail(email);
  if (existing) return { error: "An account with this email already exists." };

  const passwordHash = await hashPassword(password);
  const user = await createUser({ name, email, passwordHash });

  await establishSession(user.id);
  redirect(safeRedirect(formData.get("redirectTo")));
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password)
    return { error: "Enter your email and password." };

  const user = await findUserByEmail(email);
  // Same generic message whether the email is unknown or the password is wrong.
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return { error: "Invalid email or password." };

  await establishSession(user.id);
  redirect(safeRedirect(formData.get("redirectTo")));
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, "", clearCookieOptions());
  store.set(REFRESH_COOKIE, "", clearCookieOptions());
  redirect("/login");
}
