"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, IndianRupee, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/expenses", label: "Expenses", icon: IndianRupee },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();

  // Hide the bottom bar on the full-screen add/edit forms, label screen, and
  // the auth pages.
  if (
    pathname.startsWith("/expense/") ||
    pathname.startsWith("/planned/") ||
    pathname.startsWith("/transfers/") ||
    pathname.startsWith("/labels") ||
    pathname === "/login" ||
    pathname === "/register"
  )
    return null;

  return (
    <nav className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto grid max-w-md grid-cols-5 items-center px-2">
        {tabs.slice(0, 2).map((tab) => (
          <NavItem key={tab.href} tab={tab} active={isActive(pathname, tab.href)} />
        ))}

        <div className="flex justify-center">
          <Link
            href="/expense/new"
            aria-label="Add expense"
            className="bg-primary text-primary-foreground -mt-6 flex size-14 items-center justify-center rounded-full shadow-lg ring-4 ring-background transition-transform active:scale-95"
          >
            <Plus className="size-7" />
          </Link>
        </div>

        {tabs.slice(2).map((tab) => (
          <NavItem key={tab.href} tab={tab} active={isActive(pathname, tab.href)} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  tab,
  active,
}: {
  tab: (typeof tabs)[number];
  active: boolean;
}) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      className={cn(
        "flex flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors",
        active ? "text-primary font-medium" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
      {tab.label}
    </Link>
  );
}
