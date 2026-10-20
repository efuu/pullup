import { MongoClient, type Db } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";

export interface TestDb {
  db: Db;
  close(): Promise<void>;
}

/**
 * A fresh, randomly named database for one test file, so tests never touch the
 * app's data and two runs never collide. Uses the real MongoDB from compose.yaml;
 * TEST_MONGO=memory starts a temporary MongoDB instead (no container needed).
 */
export async function openTestDb(): Promise<TestDb> {
  let url = process.env.MONGODB_URL;
  let server: MongoMemoryServer | undefined;
  if (process.env.TEST_MONGO === "memory") {
    server = await MongoMemoryServer.create();
    url = server.getUri();
  }
  if (!url) throw new Error("MONGODB_URL is not set. Copy .env.example to .env, or run `bun run test:memory`.");
  const client = new MongoClient(url, { serverSelectionTimeoutMS: 3000 });
  try {
    await client.connect();
  } catch {
    throw new Error("Could not reach MongoDB. Start it with `bun run db:up`, or run `bun run test:memory`.");
  }
  const db = client.db(`pullup-test-${crypto.randomUUID()}`);
  return {
    db,
    async close() {
      await db.dropDatabase();
      await client.close();
      await server?.stop();
    },
  };
}

/** Kept for the older per-name helper signature used by the concept suites. */
export async function testDb(_name: string): Promise<{ db: Db; close: () => Promise<void> }> {
  const t = await openTestDb();
  return { db: t.db, close: () => t.close() };
}

export const T0 = "2026-10-17T22:00:00.000Z"; // 6:00 pm EDT, the KBBQ
export const minutes = (base: string, delta: number) =>
  new Date(new Date(base).getTime() + delta * 60_000).toISOString();
