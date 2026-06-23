// Local-time date boundary helpers used by the dashboard analytics.

export function startOfToday(now = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Week starts on Monday.
export function startOfWeek(now = new Date()): Date {
  const d = startOfToday(now);
  const day = d.getDay(); // 0 = Sun … 6 = Sat
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return d;
}

export function startOfMonth(now = new Date()): Date {
  const d = startOfToday(now);
  d.setDate(1);
  return d;
}

// "YYYY-MM" key for the Budget collection.
export function currentMonthKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Advances a date by one recurrence interval.
export function addInterval(
  date: Date,
  frequency: "weekly" | "monthly" | "yearly",
): Date {
  const d = new Date(date);
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
}

// Human label for a past date: "Today", "Yesterday", "3 days ago", or a date.
export function relativePast(iso: string, now = new Date()): string {
  const a = startOfToday(now);
  const b = startOfToday(new Date(iso));
  const days = Math.round((a.getTime() - b.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

// Human label for a due date relative to today: "Overdue", "Today",
// "Tomorrow", "in 3 days", or a date.
export function relativeDue(iso: string, now = new Date()): string {
  const due = new Date(iso);
  const a = startOfToday(now);
  const b = startOfToday(due);
  const days = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  if (days < 0) return days === -1 ? "Yesterday" : `${-days} days overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 14) return `in ${days} days`;
  return due.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// Like relativeDue but always includes the calendar date, e.g.
// "Tomorrow · 24 Jun" (and just "24 Jul" when the relative term is already a date).
export function dueLabel(iso: string, now = new Date()): string {
  const rel = relativeDue(iso, now);
  const date = new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  return rel === date ? date : `${rel} · ${date}`;
}
