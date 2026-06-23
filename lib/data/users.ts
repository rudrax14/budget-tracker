import { connectToDatabase, isDbConfigured } from "@/lib/db";
import { User } from "@/lib/models/user";
import {
  memCreateUser,
  memGetUserByEmail,
  memGetUserById,
} from "@/lib/data/memory-store";

// Shape returned to the auth layer. `passwordHash` is included only because the
// login flow needs it to verify credentials — never send this to the client.
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  currency: string;
}

export interface NewUserInput {
  name: string;
  email: string;
  passwordHash: string;
}

export async function findUserByEmail(
  email: string,
): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();

  if (!isDbConfigured) {
    const u = memGetUserByEmail(normalized);
    return u
      ? {
          id: u.id,
          name: u.name,
          email: u.email,
          passwordHash: u.passwordHash,
          currency: u.currency,
        }
      : null;
  }

  await connectToDatabase();
  const doc = await User.findOne({ email: normalized }).lean();
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    currency: doc.currency ?? "INR",
  };
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  if (!isDbConfigured) {
    const u = memGetUserById(id);
    return u
      ? {
          id: u.id,
          name: u.name,
          email: u.email,
          passwordHash: u.passwordHash,
          currency: u.currency,
        }
      : null;
  }

  await connectToDatabase();
  // Guard against malformed ids (a stale cookie could carry anything).
  let doc;
  try {
    doc = await User.findById(id).lean();
  } catch {
    return null;
  }
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    currency: doc.currency ?? "INR",
  };
}

export async function createUser(input: NewUserInput): Promise<UserRecord> {
  const email = input.email.trim().toLowerCase();

  if (!isDbConfigured) {
    const u = memCreateUser({
      name: input.name,
      email,
      passwordHash: input.passwordHash,
    });
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      passwordHash: u.passwordHash,
      currency: u.currency,
    };
  }

  await connectToDatabase();
  const doc = await User.create({
    name: input.name,
    email,
    passwordHash: input.passwordHash,
  });
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    currency: doc.currency ?? "INR",
  };
}
