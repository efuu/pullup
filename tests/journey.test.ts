/**
 * The whole user journey over HTTP against a freshly started backend and an
 * empty database: concepts, reactions, formers, validators, and the HTTP policy
 * working together. Needs MongoDB (bun run db:up).
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";

const base = process.env.MONGODB_URL!;
const dbName = `pullup-journey-${crypto.randomUUID()}`;
let host: ChildProcess;
let api: (path: string, body: unknown) => Promise<any>;

async function freePort(): Promise<number> {
  const l = createServer();
  await new Promise<void>((r) => l.listen(0, "127.0.0.1", r));
  const port = (l.address() as { port: number }).port;
  await new Promise<void>((r) => l.close(() => r()));
  return port;
}

beforeAll(async () => {
  const port = await freePort();
  host = spawn("bun", ["src/main.ts"], {
    env: { ...process.env, PORT: String(port), MONGODB_URL: base.replace(/\/pullup\?/, `/${dbName}?`) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise<void>((resolve, reject) => {
    host.once("exit", (code) => reject(new Error(`backend exited early (${code})`)));
    host.stdout!.on("data", (c: Buffer) => c.toString().includes("listening") && resolve());
  });
  api = async (path, body) => {
    const r = await fetch(`http://127.0.0.1:${port}/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.json();
  };
}, 30_000);

afterAll(async () => {
  host?.kill();
  // drop the journey database
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(base);
  await client.connect();
  await client.db(dbName).dropDatabase();
  await client.close();
});

describe("the beta journey over HTTP", () => {
  let sam: { user: string; secret: string };
  let dylan: { user: string; secret: string };
  let kenny: { user: string; secret: string };
  let plan: string;

  test("people claim names; a bad secret is unauthorized; a blank name is invalid", async () => {
    sam = await api("/me/claim", { name: "Sam" });
    dylan = await api("/me/claim", { name: "Dylan" });
    kenny = await api("/me/claim", { name: "Kenny" });
    expect(sam.secret).toBeString();
    expect(await api("/me/current", { secret: sam.secret })).toEqual({ user: sam.user, name: "Sam" });
    expect(await api("/me/current", { secret: "nope" })).toEqual({ error: "UNAUTHORIZED" });
    expect(await api("/me/claim", { name: "   " })).toEqual({ error: "INVALID_REQUEST" });
    expect(await api("/me/claim", { name: "x", extra: 1 })).toEqual({ error: "INVALID_REQUEST" });
  });

  test("creating a plan opens responses and counts the organizer as going", async () => {
    const start = new Date(Date.now() + 90_000).toISOString();
    const decideBy = new Date(Date.now() + 2_000).toISOString();
    const created = await api("/plans/create", { secret: sam.secret, title: "KBBQ", place: "Koreana", startTime: start, decideBy });
    expect(created.plan).toBeString();
    plan = created.plan;
    expect(
      await api("/plans/create", { secret: sam.secret, title: "X", place: "Y", startTime: new Date(Date.now() - 60_000).toISOString(), decideBy: new Date(Date.now() - 120_000).toISOString() }),
    ).toEqual({ error: "INVALID_REQUEST" });
    const view = await api("/plans/view", { secret: sam.secret, plan });
    expect(view.page.responses).toEqual([{ user: sam.user, name: "Sam", status: "GOING", lapsed: false, onTime: 0, total: 0 }]);
    expect(view.page.organizerName).toBe("Sam");
    expect(view.page.closed).toBe(false);
  });

  test("others respond; a maybe lapses at decide-by but is kept; a new maybe is refused", async () => {
    expect(await api("/plans/respond", { secret: dylan.secret, plan, status: "GOING" })).toEqual({ plan, status: "GOING" });
    expect(await api("/plans/respond", { secret: kenny.secret, plan, status: "MAYBE" })).toEqual({ plan, status: "MAYBE" });
    expect(await api("/plans/respond", { secret: kenny.secret, plan, status: "LATER" })).toEqual({ error: "INVALID_REQUEST" });
    let view = await api("/plans/view", { secret: dylan.secret, plan });
    let kenny_ = view.page.responses.find((r: any) => r.name === "Kenny");
    expect(kenny_).toMatchObject({ status: "MAYBE", lapsed: false });
    await Bun.sleep(2_200);
    view = await api("/plans/view", { secret: dylan.secret, plan });
    kenny_ = view.page.responses.find((r: any) => r.name === "Kenny");
    // The answer is unchanged; its reading is: never decided, not coming.
    expect(kenny_).toMatchObject({ status: "MAYBE", lapsed: true });
    expect(view.page.responses.filter((r: any) => r.status === "GOING").map((r: any) => r.name).sort()).toEqual(["Dylan", "Sam"]);
    expect(await api("/plans/respond", { secret: kenny.secret, plan, status: "MAYBE" })).toEqual({ error: "CONFLICT" });
    const mine = await api("/plans/mine", { secret: dylan.secret });
    expect(mine.list.plans.map((p: any) => p.title)).toEqual(["KBBQ"]);
  });

  test("only the organizer can reschedule or cancel", async () => {
    const later = new Date(Date.now() + 120_000).toISOString();
    expect(await api("/plans/reschedule", { secret: dylan.secret, plan, startTime: later })).toEqual({ error: "FORBIDDEN" });
    expect(await api("/plans/cancel", { secret: dylan.secret, plan })).toEqual({ error: "FORBIDDEN" });
    expect(await api("/plans/reschedule", { secret: sam.secret, plan, startTime: later })).toEqual({ plan, startTime: later });
    expect((await api("/plans/view", { secret: sam.secret, plan })).page.startTime).toBe(later);
  });

  test("pulling up, correcting the estimate, pulled up; arriving writes the record", async () => {
    expect(await api("/plans/leave", { secret: dylan.secret, plan, etaMinutes: 8 })).toEqual({ plan });
    expect(await api("/plans/leave", { secret: dylan.secret, plan, etaMinutes: 8 })).toEqual({ error: "CONFLICT" });
    expect(await api("/plans/eta", { secret: dylan.secret, plan, etaMinutes: 3 })).toEqual({ plan, etaMinutes: 3 });
    expect(await api("/plans/eta", { secret: sam.secret, plan, etaMinutes: 3 })).toEqual({ error: "CONFLICT" });
    let view = await api("/plans/view", { secret: sam.secret, plan });
    expect(view.page.onTheWay.map((w: any) => [w.name, w.etaMinutes])).toEqual([["Dylan", 3]]);
    expect((await api("/plans/arrive", { secret: dylan.secret, plan })).arrivedAt).toBeString();
    expect((await api("/plans/arrive", { secret: sam.secret, plan })).arrivedAt).toBeString();
    expect(await api("/plans/arrive", { secret: sam.secret, plan })).toEqual({ error: "CONFLICT" });
    await Bun.sleep(300); // RecordArrival settles
    view = await api("/plans/view", { secret: sam.secret, plan });
    expect(view.page.onTheWay).toEqual([]);
    expect(view.page.arrived.map((a: any) => a.name).sort()).toEqual(["Dylan", "Sam"]);
    const tags = Object.fromEntries(view.page.responses.map((r: any) => [r.name, `${r.onTime}/${r.total}`]));
    expect(tags).toEqual({ Sam: "1/1", Dylan: "1/1", Kenny: "0/0" }); // both early, so on time
    expect(view.page.responses.find((r: any) => r.name === "Kenny")).toMatchObject({ status: "MAYBE", lapsed: true });
  });

  test("records are visible only to people who shared a plan", async () => {
    const card = await api("/records/view", { secret: sam.secret, target: dylan.user });
    expect(card.card.name).toBe("Dylan");
    expect(card.card.recent).toEqual([{ plan, title: "KBBQ", startTime: expect.any(String), minutesLate: 0 }]);
    expect(await api("/records/view", { secret: kenny.secret, target: dylan.user })).toEqual({ error: "FORBIDDEN" });
  });

  test("renaming keeps identity; cancelling closes responses", async () => {
    expect(await api("/me/rename", { secret: dylan.secret, name: "Dylan W" })).toEqual({ user: dylan.user, name: "Dylan W" });
    expect(await api("/plans/cancel", { secret: sam.secret, plan })).toEqual({ plan });
    await Bun.sleep(300); // CancelClosesResponses settles
    const view = await api("/plans/view", { secret: sam.secret, plan });
    expect(view.page.cancelled).toBe(true);
    expect(view.page.closed).toBe(true);
    expect(view.page.responses.map((r: any) => r.name).sort()).toEqual(["Dylan W", "Kenny", "Sam"]);
    expect(await api("/plans/respond", { secret: kenny.secret, plan, status: "GOING" })).toEqual({ error: "NOT_FOUND" });
    expect(await api("/plans/cancel", { secret: sam.secret, plan })).toEqual({ error: "CONFLICT" });
  });
});
