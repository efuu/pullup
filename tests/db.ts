import { MongoClient, type Db } from "mongodb";

const url = process.env.MONGODB_URL ?? "mongodb://dev:dev@127.0.0.1:27018/pullup?authSource=admin";

/** A fresh database per test file so suites never see each other's documents. */
export async function testDb(name: string): Promise<{ db: Db; close: () => Promise<void> }> {
  const client = new MongoClient(url);
  await client.connect();
  const db = client.db(`pullup-test-${name}`);
  await db.dropDatabase();
  return { db, close: () => client.close() };
}

export const T0 = "2026-10-17T22:00:00.000Z"; // 6:00 pm EDT, the KBBQ
export const minutes = (base: string, delta: number) =>
  new Date(new Date(base).getTime() + delta * 60_000).toISOString();
