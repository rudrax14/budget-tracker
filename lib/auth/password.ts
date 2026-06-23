import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Node's crypto scrypt — no third-party dependency. Runs only in server
// actions / route handlers (Node runtime), never in edge middleware.
const scryptAsync = promisify(scrypt);

const KEY_LEN = 64;

// Hash a plaintext password into a self-describing `salt:derivedKey` string.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

// Constant-time verification of a plaintext password against a stored hash.
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, keyHex] = stored.split(":");
  if (!salt || !keyHex) return false;

  const expected = Buffer.from(keyHex, "hex");
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;

  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}
