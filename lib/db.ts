import mongoose from "mongoose";

// A placeholder URI (empty, or still containing the template `<...>` markers)
// means "no database configured" — callers should use the in-memory fallback.
const rawUri = process.env.MONGODB_URI?.trim() ?? "";

export const isDbConfigured =
  rawUri.length > 0 && !rawUri.includes("<") && rawUri.startsWith("mongodb");

// Cache the connection across hot reloads in dev (Next.js re-evaluates modules).
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as unknown as {
  _mongoose?: MongooseCache;
};

const cache: MongooseCache =
  globalForMongoose._mongoose ?? { conn: null, promise: null };

globalForMongoose._mongoose = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!isDbConfigured) {
    throw new Error(
      "MONGODB_URI is not configured. The app is running on the in-memory store.",
    );
  }

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(rawUri, {
      bufferCommands: false,
      // Serverless-friendly: reuse a small pool, fail fast instead of hanging.
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
