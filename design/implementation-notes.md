# Implementation notes (P2)

Technical record of how the alpha was built: the plan, what changed from the P1
design and why, and what is left for P3. The reflective side of this lives in the
design notebook in the private repo.

## The journey the alpha implements

One organizer and one friend, starting from an empty database. Sam opens PullUp,
types a name (no account), creates "KBBQ at Koreana" with a start time and a
decide-by time, and gets a link. Dylan opens the link in another browser, types a
name, and taps Going; the page shows two going (Sam was counted as going
automatically when the plan was created). Kenny taps Maybe; when the decide-by
time passes and anyone opens the page, Kenny is counted as can't. On the day
Dylan taps Pulling up with an estimate and everyone's page shows him on the way
since that time; he taps Pulled up on arrival. Sam taps Pulled up. Arriving writes
each person's on-time record from the plan's start time, and a tag next to each
name ("on time 1/1") appears on the plan page. Tapping a name shows that person's
record, but only to people who have shared a plan with them.

## Plan, as written before starting

1. Design files first: port the five P1 specs to the sync-engine spec grammar,
   write the three composition documents, pass `check:design`. (Evaluate: the
   checker passes.)
2. Concepts in TypeScript on MongoDB, one class per concept, with a test suite
   per concept run against a real local MongoDB. (Evaluate: `bun test` passes.)
3. Endpoints, the two standalone reactions, the view, the three formers;
   `bun run generate` and `bun run check` pass.
4. A script that drives the whole journey over HTTP against a fresh database, so
   the backend is known to work before any UI exists. (Evaluate: every step
   prints the expected answer or the expected error.)
5. Vue frontend, one page per route: name prompt, home (create + my plans),
   plan page, record page. Poll the plan page every 3 s so the board is live.
6. Drive the journey in a browser; fix what breaks; write these notes.

The order held. Steps 3 and 4 found the bugs listed below.

## What changed from the P1 design, and why

- **Every time-dependent action takes a `now` input.** sync-engine deliberately
  has no clock inside concepts: a reaction binds the flow's instant with
  `now(instant)` and passes it in. So `Planning.create`, `RSVPing.respond`,
  `RSVPing.expireMaybes`, `ArrivalTracking.leave` and `arrive` all gained a `now`
  argument. The specs say so now; the P1 versions said "now" in prose.
- **Expiring maybes has no scheduler.** The P1 design treated `expireMaybes` as a
  time-triggered action, like `Expiring.expireResource` in Exercise 3. The engine
  has no timers, so the viewing endpoint calls `expireMaybes` before forming the
  page. Any visit after the deadline settles the headcount; nobody sees a stale
  maybe. `expireMaybes` now always answers (with a count, 0 before the deadline)
  instead of refusing when there is nothing to do, because a refusal inside the
  view flow would have turned every page view into an error.
- **PunctualityTracking.record takes two instants, not a computed lateness.** The
  P1 reaction computed `minutesLate` as `max(0, arrivedAt minus startTime)`, which
  would need a declared computation in sync-engine. Passing `dueAt` and `arrivedAt`
  and letting the concept subtract keeps the concept independent (it still knows
  nothing about plans or arrivals) and removes the computation.
- **Split the arrival board query in two.** `_board` would have returned rows with
  a blank `arrivedAt` for people still on the way. Rows with optional fields are
  awkward to pattern-match, so there are now `_onTheWay` and `_arrived`.
- **Added `_eventsOf` and `_sharedEvents` to RSVPing.** The first is for "my
  plans"; the second is the shared-a-plan rule for records. The P1 version wrote
  that rule as a view over `_responses`; an existence test plus its negation is
  much simpler against a query that already answers "events we both said going to".
  The view still exists (it wraps the query) and the negative branch negates the
  query directly.
- **The organizer-is-going reaction fires on `RSVPing.open`, not on
  `Planning.create`.** Creating a plan and opening its responses are two actions in
  the same flow; a reaction on `create` could run before `open` and be refused. The
  reaction now waits for the open and looks the organizer up from Planning.
- **Identity is a secret in local storage, sent in the body.** The P1 note said
  "a cookie". The engine's HTTP package can bind a cookie, but with the Vite dev
  server on a different port than the backend the cookie policy needs an
  origin configuration that was not worth getting right for the alpha. Every
  endpoint still resolves the secret to a user on the backend before doing
  anything, so access control is enforced server-side either way. Moving the
  secret to an HttpOnly cookie is a P3 item.
- **Decide-by is chosen by the organizer**, defaulting to four hours before the
  start in the form. The P1 reaction computed it; a form default needs no
  computation and lets a same-day plan set a shorter window.

## Bugs the checks caught

- Helper methods on concept classes must be `#private`; a TypeScript `private`
  method is still a method, and `registerConcept` reported it as an undeclared
  action.
- A query declared `one` must return a single record, not a one-element array.
  The engine faulted on `_summary` the first time the plan page was formed.
- An authored endpoint error (`NOT_SHARED`) that is not mapped in the HTTP policy's
  `publicErrors` is private and comes out as `INTERNAL_ERROR`. It is now mapped to
  `FORBIDDEN`, and the frontend supplies the sentence.
- The engine's own HTTP client imports Node built-ins, which Vite cannot bundle for
  the browser. The frontend uses a 30-line typed `fetch` wrapper over the
  generated wire types instead.

## Validation

- `bun run check:design`, `bun run generate`, `bun run check` (spec vs. source,
  pinned artifacts, typecheck) all pass.
- `bun test`: 15 tests across the five concepts, against a real local MongoDB,
  covering each concept's principle plus the refusals (maybe after the deadline,
  pulling up twice, arriving twice, cancel by a non-organizer, recording twice,
  unknown secrets).
- `bun scripts/smoke.ts`: the journey above over HTTP against a fresh database,
  including the decide-by expiry (5-second window), the on-time record written by
  the reaction, the shared-plan check passing and failing, and the organizer-only
  cancel.
- Screen recording (1:52, narrated), linked from the README.
- Driven by hand in a browser: claim, create, going, pulling up, pulled up, the
  "on time 1/1" tag appearing without a refresh, the record page.

## What remains for P3

- Cancelling a plan should hide the day-of controls and stop counting it; today
  the page only shows a "cancelled" pill.
- Rescheduling has a concept action but no endpoint or UI.
- Live updates are a 3-second poll; a server push would be nicer.
- The secret should move to an HttpOnly cookie.
- A viewer who has not responded to a plan can still see its page; the record
  page is gated, the plan page is not. Decide whether that is right (a link is the
  invite, so probably yes) and say so in the design.
- Rename, and recovering an identity on a new device, are out of scope for now.
- Visual design.
