// Shared domain constants for the Budget Tracker MVP.

export const PAYMENT_METHODS = [
  "UPI",
  "Cash",
  "Credit Card",
  "Debit Card",
  "Bank",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Default categories seeded for every new user (see spec → Database Design).
export const DEFAULT_CATEGORIES: { name: string; icon: string; color: string }[] = [
  { name: "Food", icon: "🍔", color: "#f97316" },
  { name: "Travel", icon: "✈️", color: "#0ea5e9" },
  { name: "Shopping", icon: "🛍️", color: "#ec4899" },
  { name: "Bills", icon: "🧾", color: "#eab308" },
  { name: "Health", icon: "🩺", color: "#10b981" },
  { name: "Entertainment", icon: "🎬", color: "#8b5cf6" },
  { name: "Investment", icon: "📈", color: "#22c55e" },
  { name: "Others", icon: "📦", color: "#64748b" },
];

export const DEFAULT_CURRENCY = "INR";

export const ACCOUNT_TYPES = ["cash", "online", "bank", "card"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

// Accounts seeded for every new user.
export const DEFAULT_ACCOUNTS: {
  name: string;
  type: AccountType;
  color: string;
}[] = [
  { name: "Cash", type: "cash", color: "#3b82f6" },
  { name: "Online", type: "online", color: "#f59e0b" },
];

// Stable id used for the local/demo user when auth is not configured yet.
export const DEMO_USER_ID = "demo-user";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: DEFAULT_CURRENCY,
  maximumFractionDigits: 0,
});

export function formatINR(amount: number): string {
  return inrFormatter.format(amount || 0);
}

// Compact form for chart axes: ₹0, ₹950, ₹12k, ₹1.2L
export function formatINRShort(amount: number): string {
  const n = amount || 0;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `₹${n}`;
}

// Accent color used for single-series charts (bars / trend line).
export const CHART_ACCENT = "#6366f1";
