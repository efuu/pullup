/**
 * Checks the deployed app: persistence, access control, error handling.
 * Run: bun scripts/check-deployed.ts [https://pullup.mit-sdg.dev]
 * Creates throwaway people and one plan, then cancels the plan.
 */
const base = (process.argv[2] ?? "https://pullup.mit-sdg.dev").replace(/\/$/, "");
let failures = 0;
const results: string[] = [];
function check(label: string, ok: boolean, detail = "") {
  results.push(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures++;
}
async function api(path: string, body: unknown): Promise<any> {
  const r = await fetch(`${base}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

const health = await fetch(`${base}/health`).then((r) => r.json()).catch(() => null);
check("health reports ok", health?.status === "ok", JSON.stringify(health));
const page = await fetch(`${base}/`).then((r) => r.text());
check("root serves the app", page.includes("<div id=\"app\">"));

const sam = await api("/me/claim", { name: `Sam ${Date.now() % 10000}` });
const dylan = await api("/me/claim", { name: "Dylan" });
const kenny = await api("/me/claim", { name: "Kenny" });
check("claim returns a secret", typeof sam.secret === "string");

// --- error handling at the boundary
check("unknown secret -> UNAUTHORIZED", (await api("/me/current", { secret: "nope" })).error === "UNAUTHORIZED");
check("blank name -> INVALID_REQUEST", (await api("/me/claim", { name: "  " })).error === "INVALID_REQUEST");
check("extra field -> INVALID_REQUEST", (await api("/me/claim", { name: "x", user: "admin" })).error === "INVALID_REQUEST");
check("unknown plan -> NOT_FOUND", (await api("/plans/view", { secret: sam.secret, plan: "nope" })).error === "NOT_FOUND");
check(
  "start in the past -> INVALID_REQUEST",
  (await api("/plans/create", { secret: sam.secret, title: "X", place: "Y", startTime: new Date(Date.now() - 60_000).toISOString(), decideBy: new Date(Date.now() - 120_000).toISOString() })).error === "INVALID_REQUEST",
);

// --- persistence: write, then read back through a fresh request
const start = new Date(Date.now() + 3600_000).toISOString();
const created = await api("/plans/create", { secret: sam.secret, title: "Deployed check", place: "Here", startTime: start, decideBy: new Date(Date.now() + 1800_000).toISOString() });
check("create plan", typeof created.plan === "string");
const plan = created.plan;
await api("/plans/respond", { secret: dylan.secret, plan, status: "GOING" });
await api("/plans/respond", { secret: kenny.secret, plan, status: "MAYBE" });
const view = await api("/plans/view", { secret: sam.secret, plan });
check("view persists title/place/time", view.page?.title === "Deployed check" && view.page.startTime === start);
check("organizer auto-going persisted", view.page?.responses.some((r: any) => r.user === sam.user && r.status === "GOING"));
check("other responses persisted", view.page?.responses.length === 3);
const mine = await api("/plans/mine", { secret: dylan.secret });
check("plan list persists", mine.list?.plans.some((p: any) => p.plan === plan));

// --- access control on the backend
check("non-organizer cancel -> FORBIDDEN", (await api("/plans/cancel", { secret: dylan.secret, plan })).error === "FORBIDDEN");
check("non-organizer reschedule -> FORBIDDEN", (await api("/plans/reschedule", { secret: dylan.secret, plan, startTime: start })).error === "FORBIDDEN");
const kennyLeave = await api("/plans/leave", { secret: kenny.secret, plan, etaMinutes: 5 });
check("not-going person cannot pull up", kennyLeave.error === "FORBIDDEN", JSON.stringify(kennyLeave));
check("stranger cannot view a record", (await api("/records/view", { secret: kenny.secret, target: dylan.user })).error === "FORBIDDEN");
check("plan-mate can view a record", (await api("/records/view", { secret: sam.secret, target: dylan.user })).card?.name === "Dylan");

// --- the day-of flow and the record, persisted
check("going person pulls up", (await api("/plans/leave", { secret: dylan.secret, plan, etaMinutes: 8 })).plan === plan);
check("pulling up twice -> CONFLICT", (await api("/plans/leave", { secret: dylan.secret, plan, etaMinutes: 8 })).error === "CONFLICT");
check("arrive", typeof (await api("/plans/arrive", { secret: dylan.secret, plan })).arrivedAt === "string");
await Bun.sleep(500);
const after = await api("/plans/view", { secret: sam.secret, plan });
check("arrival on the board", after.page?.arrived.some((a: any) => a.user === dylan.user));
check("on-time record written by the reaction", after.page?.responses.find((r: any) => r.user === dylan.user)?.total === 1);

// --- cleanup
check("organizer cancels", (await api("/plans/cancel", { secret: sam.secret, plan })).plan === plan);
await Bun.sleep(300);
check("cancelled plan refuses responses", (await api("/plans/respond", { secret: kenny.secret, plan, status: "GOING" })).error === "NOT_FOUND");

console.log(`Deployed check against ${base} at ${new Date().toISOString()}\n`);
console.log(results.join("\n"));
console.log(`\n${results.length - failures} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
