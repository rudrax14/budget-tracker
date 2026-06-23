import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { readUserId } from "@/lib/session";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in · Budget Tracker" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Already signed in → straight to the app.
  if (await readUserId()) redirect("/");

  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <div className="bg-primary text-primary-foreground mx-auto flex size-14 items-center justify-center rounded-2xl shadow-lg">
            <Wallet className="size-7" />
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to your Budget Tracker.
          </p>
        </div>

        <LoginForm redirectTo={next} />
      </div>
    </div>
  );
}
