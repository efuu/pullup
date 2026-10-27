# PullUp: design document

Final design as of P4, and how it got here. Commit links point at the version being described.

## What it is

A plan page you paste into the group chat. It answers three questions a chat thread can't: who is actually coming, who has actually left, and who was actually on time. No accounts: a browser claims a name once and keeps a secret.

## Concepts, final

| Concept | Prevents | Notes on the final form |
|---|---|---|
| Identifying | one person's answers scattering across names, and friends bailing at "create an account" | name + browser secret; rename keeps identity |
| Planning [User] | a plan living only as a buried chat message | organizer-only reschedule and cancel, enforced in the actions |
| RSVPing [User, Event] | acting on a headcount that undecided answers inflated | going / maybe / no; a maybe past decide-by *reads* as lapsed, is never rewritten; `close` when the plan is cancelled |
| ArrivalTracking [User, Event] | waiting outside not knowing who has left; "omw" meaning nothing | self-reported leave / eta / arrive, timestamped |
| PunctualityTracking [User, Event] | a group's sense of who's on time resting on assumption | minutes late from two instants; the record page is gated on having shared a plan |

Specs: [`design/concepts/`](concepts/). Composition (every endpoint, reaction, view, former): [`design/compositions/`](compositions/).

## How it differs from the P1 concept design

P1 specs: [`1d96b57`](https://github.com/efuu/pullup/commit/1d96b57fbcc051c63a9455dd5a6158da26f96a0b). Current: [`design/concepts/`](concepts/).

- **Time is an input, not ambient.** sync-engine has no clock inside concepts, so `create`, `respond`, `leave`, `arrive` take `now`, supplied by the reaction from the flow's instant. Alpha: [`bcabd3a`](https://github.com/efuu/pullup/commit/bcabd3a).
- **Maybes are interpreted, not expired.** P1 and the alpha had `expireMaybes`, which rewrote a maybe to a no at the deadline. Staff feedback: that destroys information the host wants. Now `_standing(event, now)` reads a maybe past its deadline as lapsed; the answer stays; a *new* maybe after the deadline is still refused. Viewing a plan mutates nothing. Commit: [`e54b5b6`](https://github.com/efuu/pullup/commit/e54b5b6).
- **Lateness is computed inside PunctualityTracking** from two instants (`dueAt`, `arrivedAt`) passed by the `RecordArrival` reaction, instead of a computation in the reaction. Keeps the concept independent of Planning and ArrivalTracking.
- **Cancelling closes responses.** New `RSVPing.close` + a reaction on `Planning.cancel`. The rule had to be server-side; hiding buttons is not a rule.
- **Board query split** into `_onTheWay` and `_arrived` so no row has a blank field.
- **`_sharedEvents`** replaced a two-line view as the shared-a-plan rule; the view wraps it and the negation uses the query directly.
- **Purposes rewritten** as the bad situation each concept prevents (staff feedback), which also made clear RSVPing is one of several solutions to its problem.
- **Identity is a secret in local storage sent in the body**, not a cookie. Every endpoint resolves it server-side first. Cookie binding is the obvious next step.

## Reactions that matter

- `OrganizerIsGoing`: on `RSVPing.open`, look up the plan's organizer, respond GOING for them.
- `RecordArrival`: on `ArrivalTracking.arrive`, look up the plan's start, call `PunctualityTracking.record` with both instants.
- `CancelClosesResponses`: on `Planning.cancel`, `RSVPing.close`.
- Access control is in the endpoints: every one resolves the secret to a user before anything else; organizer-only actions pass that user to Planning, which refuses others; the day-of actions require the `isGoing` view ([`d6d5af0`](https://github.com/efuu/pullup/commit/d6d5af0)); the record page requires a shared GOING plan.

## How it differs from the P3 visual design

P3 study and first implementation: [`5cd77f1`](https://github.com/efuu/pullup/commit/5cd77f1). Study: [`visual-study.md`](visual-study.md).

- The first palette failed contrast twice (amber text 2.8:1, white on the first orange 4.1:1). Amber became a dot-only colour with a darker amber for text; the orange was deepened. Every text/background pair now measures ≥ 4.5:1, with the numbers on the slide.
- The header stacks on phone widths instead of wrapping mid-phrase.
- "Said maybe, never decided" became its own group with its own count, after the maybe-interpretation change; the status colours were already there to carry it.
- Forgiving flows added after a rubric pass: "not you?" confirms before forgetting an identity; an invalid identity re-prompts without losing the page; a plan link with no identity says what it is.

## Testing

- 24 automated tests: one suite per concept (principle, variants, every refusal, nothing changed on refusal) and a journey test that boots the real backend on a free port with an empty database and plays three people over HTTP. Saved: [`tests/last-run.txt`](../tests/last-run.txt), [`tests/last-run.xml`](../tests/last-run.xml).
- Deployed app: `bun run test:deployed` checks persistence, access control and error handling against https://pullup.mit-sdg.dev. Saved: [`tests/deployed-run.txt`](../tests/deployed-run.txt). It caught two things in P4: the going-only rule had only been in the UI, and viewing an unknown plan had stopped answering NOT_FOUND.
- By hand on the production build: [`validation.md`](validation.md).

## Known limits, for user testing

- A plan page is readable by anyone with the link. The link is the invite; worth asking testers whether they expect that.
- Live updates are a 3-second poll.
- Identity is per browser; a new device is a new person. Testers will hit this if they switch phones.
- If the organizer reschedules after people arrived, the board's "+N" uses the new time while the record keeps the old.
