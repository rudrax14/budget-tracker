import { revalidateTag, unstable_cache } from "next/cache";
import { isDbConfigured } from "@/lib/db";

// One cache tag per user. Every cached read for a user carries this tag, so a
// single revalidateTag after any write busts all of that user's cached data.
function userTag(userId: string): string {
  return `user:${userId}`;
}

// Wrap a per-user DB read in the Next.js Data Cache. The cached value persists
// across requests (and serverless invocations on Vercel), so repeat page loads
// don't re-hit MongoDB. Only the RETURN value is cached, so the wrapped reads
// must return JSON-serializable data (DTOs with ISO date strings — never raw
// Mongo docs with Date objects).
//
// Caching is skipped when there's no real database (the in-memory dev store is
// already in-process and must stay live for instant write feedback).
export function cachedRead<T>(
  userId: string,
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isDbConfigured) return fn();

  return unstable_cache(fn, ["read", userId, key], {
    tags: [userTag(userId)],
    // Safety net: even if a write somewhere forgets to revalidate, data
    // self-heals within two minutes.
    revalidate: 120,
  })();
}

// Bust every cached read for a user after a mutation. Wrapped in try/catch so
// calling a data-layer write outside a request scope (e.g. a CLI script) is a
// no-op instead of throwing.
export function revalidateUser(userId: string): void {
  try {
    revalidateTag(userTag(userId));
  } catch {
    // Not inside a request (no cache to revalidate) — safe to ignore.
  }
}
