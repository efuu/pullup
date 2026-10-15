/**
 * Drives the P2 user journey end to end over HTTP against a freshly started
 * backend. Run: bun scripts/smoke.ts  (needs MongoDB from `bun run db:up`).
 */
import { spawn } from "node:child_process";
import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import type { PullUpWireHttp } from "../generated/wire.ts";

const port = 3999;
const host = spawn("bun", ["src/main.ts"], {
  env: { ...process.env, PORT: String(port), MONGODB_URL: process.env.MONGODB_URL!.replace("/pullup?", "/pullup-smoke?") },
  stdio: ["ignore", "pipe", "inherit"],
});
await new Promise<void>((resolve) =>
  host.stdout.on("data", (chunk: Buffer) => chunk.toString().includes("listening") && resolve()),
);

const client = createHttpClient<PullUpWireHttp>({ baseUrl: `http://127.0.0.1:${port}/api` });
const step = (label: string, value: unknown) => console.log(`\n== ${label}\n${JSON.stringify(value, null, 1)}`);
const ok = <T>(r: T | { error: string }): T => {
  if (typeof r === "object" && r !== null && "error" in r) throw new Error(`unexpected error ${r.error}`);
  return r as T;
};

try {
  const sam = ok(await client.me.claim({ name: "Sam" }));
  const dylan = ok(await client.me.claim({ name: "Dylan" }));
  const kenny = ok(await client.me.claim({ name: "Kenny" }));
  step("claimed", { sam, dylan, kenny });
  step("current (Sam)", await client.me.current({ secret: sam.secret }));
  step("current (bad secret)", await client.me.current({ secret: "nope" }));

  const start = new Date(Date.now() + 90_000).toISOString(); // 90 s from now
  const decideBy = new Date(Date.now() + 5_000).toISOString(); // maybes expire in 5 s
  const created = ok(
    await client.plans.create({ secret: sam.secret, title: "KBBQ", place: "Koreana", startTime: start, decideBy }),
  );
  step("created", created);
  step("create in the past", await client.plans.create({ secret: sam.secret, title: "X", place: "Y", startTime: new Date(Date.now() - 60_000).toISOString(), decideBy: new Date(Date.now() - 120_000).toISOString() }));

  step("respond Dylan going", await client.plans.respond({ secret: dylan.secret, plan: created.plan, status: "GOING" }));
  step("respond Kenny maybe", await client.plans.respond({ secret: kenny.secret, plan: created.plan, status: "MAYBE" }));
  step("view (organizer auto-going, kenny maybe)", await client.plans.view({ secret: dylan.secret, plan: created.plan }));

  await Bun.sleep(5500);
  step("view after decide-by (kenny -> NO)", await client.plans.view({ secret: sam.secret, plan: created.plan }));
  step("maybe after deadline refused", await client.plans.respond({ secret: kenny.secret, plan: created.plan, status: "MAYBE" }));

  step("Dylan pulling up", await client.plans.leave({ secret: dylan.secret, plan: created.plan, etaMinutes: 8 }));
  step("Dylan pulling up twice", await client.plans.leave({ secret: dylan.secret, plan: created.plan, etaMinutes: 8 }));
  step("Sam pulled up (early = on time)", await client.plans.arrive({ secret: sam.secret, plan: created.plan }));
  step("Dylan pulled up", await client.plans.arrive({ secret: dylan.secret, plan: created.plan }));
  await Bun.sleep(300); // let the RecordArrival reaction settle
  step("view board", await client.plans.view({ secret: sam.secret, plan: created.plan }));
  step("Sam views Dylan's record (shared plan)", await client.records.view({ secret: sam.secret, target: dylan.user }));
  step("Kenny views Dylan's record (never GOING together)", await client.records.view({ secret: kenny.secret, target: dylan.user }));
  step("Dylan cancels (not organizer)", await client.plans.cancel({ secret: dylan.secret, plan: created.plan }));
  step("my plans (Dylan)", await client.plans.mine({ secret: dylan.secret }));
  step("Sam cancels", await client.plans.cancel({ secret: sam.secret, plan: created.plan }));
} finally {
  host.kill();
}
