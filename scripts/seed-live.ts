/**
 * Populates an app with realistic data for user testing: a friend group with
 * history (on-time records), an upcoming plan with mixed responses, a plan
 * happening right now with people on the way, and a cancelled one.
 *
 * Run: bun scripts/seed-live.ts [https://pullup.mit-sdg.dev]
 * Writes seed-secrets.local.json (gitignored) so the facilitator can act as
 * the friends during a session, and prints the plan links for the task list.
 */
const base = (process.argv[2] ?? "https://pullup.mit-sdg.dev").replace(/\/$/, "");
const SLOW = process.env.SEED_FAST ? 0 : 1; // set SEED_FAST=1 to skip the waits (no history then)

async function api(path: string, body: unknown): Promise<any> {
  const r = await fetch(`${base}/api${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (j && j.error) throw new Error(`${path} -> ${j.error} ${JSON.stringify(body).slice(0, 80)}`);
  return j;
}
const at = (minutesFromNow: number) => new Date(Date.now() + minutesFromNow * 60_000).toISOString();
const sleep = (s: number) => Bun.sleep(s * 1000);

const names = ["Priya", "Jordan", "Kenny", "Alex", "Maya"];
const people: Record<string, { user: string; secret: string }> = {};
for (const name of names) people[name] = await api("/me/claim", { name });
const P = (n: string) => people[n]!.secret;
const links: string[] = [];
const link = (plan: string) => `${base}/#/p/${plan}`;

// ---- history: three plans that "already happened", with staggered arrivals
if (SLOW) {
  const history: Array<{ title: string; place: string; organizer: string; arrivals: Array<[string, number]> }> = [
    { title: "Dim sum", place: "Hei La Moon", organizer: "Priya", arrivals: [["Priya", 0], ["Jordan", 0], ["Kenny", 2], ["Maya", 0]] },
    { title: "Bowling", place: "Lucky Strike", organizer: "Jordan", arrivals: [["Jordan", 0], ["Priya", 1], ["Kenny", 3], ["Alex", 0]] },
    { title: "Trivia night", place: "The Burren", organizer: "Maya", arrivals: [["Maya", 0], ["Priya", 0], ["Jordan", 2], ["Kenny", 3]] },
  ];
  for (const h of history) {
    const { plan } = await api("/plans/create", { secret: P(h.organizer), title: h.title, place: h.place, startTime: at(1), decideBy: at(0.5) });
    for (const [who] of h.arrivals) if (who !== h.organizer) await api("/plans/respond", { secret: P(who), plan, status: "GOING" });
    console.log(`seeded ${h.title}; waiting for its start time…`);
    await sleep(65);
    // arrive in order of lateness; each extra minute late is a real minute
    let waited = 0;
    for (const [who, late] of [...h.arrivals].sort((a, b) => a[1] - b[1])) {
      if (late > waited) { await sleep((late - waited) * 60); waited = late; }
      await api("/plans/arrive", { secret: P(who), plan });
    }
    links.push(`${h.title} (past): ${link(plan)}`);
  }
}

// ---- upcoming: Saturday KBBQ with mixed answers, decide-by still open
const kbbq = await api("/plans/create", { secret: P("Priya"), title: "KBBQ", place: "Koreana, Central Sq", startTime: at(3 * 24 * 60), decideBy: at(3 * 24 * 60 - 240) });
await api("/plans/respond", { secret: P("Jordan"), plan: kbbq.plan, status: "GOING" });
await api("/plans/respond", { secret: P("Kenny"), plan: kbbq.plan, status: "MAYBE" });
await api("/plans/respond", { secret: P("Alex"), plan: kbbq.plan, status: "NO" });
links.push(`KBBQ (upcoming, decide-by open): ${link(kbbq.plan)}`);

// ---- a plan whose decide-by passed with an undecided maybe, starting in ~2 hours
const movie = await api("/plans/create", { secret: P("Jordan"), title: "Movie", place: "Kendall Cinema", startTime: at(120), decideBy: at(0.2) });
await api("/plans/respond", { secret: P("Maya"), plan: movie.plan, status: "GOING" });
await api("/plans/respond", { secret: P("Kenny"), plan: movie.plan, status: "MAYBE" });
links.push(`Movie (decide-by passed, Kenny never decided): ${link(movie.plan)}`);

// ---- happening now: pickup basketball, people on the way
const ball = await api("/plans/create", { secret: P("Maya"), title: "Pickup basketball", place: "Z Center", startTime: at(10), decideBy: at(1) });
for (const who of ["Priya", "Jordan", "Kenny"]) await api("/plans/respond", { secret: P(who), plan: ball.plan, status: "GOING" });
await api("/plans/leave", { secret: P("Priya"), plan: ball.plan, etaMinutes: 8 });
await api("/plans/leave", { secret: P("Maya"), plan: ball.plan, etaMinutes: 3 });
await api("/plans/arrive", { secret: P("Maya"), plan: ball.plan });
links.push(`Pickup basketball (starting soon, people on the way): ${link(ball.plan)}`);

// ---- cancelled
const brunch = await api("/plans/create", { secret: P("Alex"), title: "Brunch", place: "Tatte", startTime: at(26 * 60), decideBy: at(20 * 60) });
await api("/plans/respond", { secret: P("Priya"), plan: brunch.plan, status: "GOING" });
await api("/plans/cancel", { secret: P("Alex"), plan: brunch.plan });
links.push(`Brunch (cancelled): ${link(brunch.plan)}`);

await Bun.write("seed-secrets.local.json", JSON.stringify({ base, people, plans: { kbbq: kbbq.plan, movie: movie.plan, ball: ball.plan, brunch: brunch.plan } }, null, 2));
console.log("\nPlan links for the task list:\n" + links.map((l) => "- " + l).join("\n"));
console.log("\nFriends' secrets saved to seed-secrets.local.json (gitignored). Use them to act as a friend during a session.");
