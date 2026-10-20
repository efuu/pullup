# Implementation notes

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
  has no timers, so in the alpha the viewing endpoint called `expireMaybes` before
  forming the page. (Superseded in the beta after staff feedback: maybes are no
  longer rewritten at all; see "After staff feedback" below.)
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


---

# Beta (P3)

## What was added

- **Complete functionality.** Reschedule (organizer only, `/plans/reschedule`), correcting an ETA while on the way (`/plans/eta`), renaming without losing identity (`/me/rename`), and a cancelled plan that actually stops taking responses. That last one is a new `RSVPing.close` action plus a reaction: when `Planning.cancel` completes, close the plan's responses. The responses already given stay readable, so the page still shows who had said what.
- **Every action reachable from the UI**, including the ones the alpha had endpoints-only or not at all. The plan page now shows cancelled and closed states, hides controls that cannot work, and explains disabled ones (the Maybe button after decide-by has a tooltip).
- **Visual design** per [visual-study.md](visual-study.md): two faces, one accent, three status hues with one meaning each, warm paper. See the study for what was tried and dropped.
- **Tests**: 15 → 24. Every action of every concept runs in at least one test; every refusal is asserted along with "nothing changed"; and `tests/journey.test.ts` runs the whole journey over HTTP against the real backend from an empty database. Output saved to `tests/last-run.txt`; the test helper follows the course's MongoDB guide (fresh random database per file, memory mode available).
- **Deployment.** The backend now serves the built Vue app itself (`dist/`), `build` and `start` scripts match the platform, `packageManager` pins the Bun that wrote the lockfile, and `bun run preview` runs the production build locally the way the platform will.

## Design changes since the alpha, and why

- `RSVPing` gained `close(event)` and a `closed` flag. The alternative was to make the UI hide the buttons when the plan is cancelled, which leaves the backend accepting responses to a dead plan. Closing in RSVPing keeps the rule server-side, and RSVPing still knows nothing about Planning: the reaction connects them.
- `_decideBy` answers `closed` too, so the page can explain *why* the buttons are gone.
- No new concepts. Rename, reschedule and ETA correction were already actions in the P1 specs; they just had no endpoints.

## What the checks caught this time

- Changing `_decideBy`'s row shape broke a test's expectation before it broke any code: the typecheck in `bun run check` caught it.
- The first version of the cancel reaction fired on `Planning.cancel` and called `RSVPing.close` before the endpoint had responded; harmless, but the journey test needed a short settle before asserting `closed`.

## After staff feedback on P1 and P2

Two things from the feedback changed the design.

**Maybes are no longer rewritten.** Until now, viewing a plan after the decide-by time turned every leftover maybe into a no. That destroyed information: whether somebody said maybe or no still means something after the deadline, and the host in particular wants to see who said maybe and never followed up. The fix is to change the *interpretation* of the answer, not the answer. `RSVPing.expireMaybes` is gone; `respond` still refuses a *new* maybe after the deadline; and a new query `_standing(event, now)` reads each response as of a moment, marking a maybe past its decide-by as lapsed. The plan page is formed with the request's instant, so the count says "4 going · 1 can't · 1 never decided", the lapsed people are listed as what they said, and someone who lapsed is told they are not counted and asked to decide. Viewing a plan now mutates nothing, which is also simply a better property for a read. The concept tests check that a lapsed maybe is still a maybe in `_responses`, and the journey test checks it end to end.

**Purposes are now the bad situation prevented.** Each concept's purpose used to describe the feature it provides ("let one person propose an outing"). They now say what goes wrong without it, e.g. RSVPing prevents hosts and attendees from acting on a headcount that undecided answers have inflated. That framing made one thing visible: the problem RSVPing solves could be solved other ways (over-provisioning, or resources that grow and shrink with turnout), and this is the one that fits a restaurant table.

## Interaction-design pass (third check)

Reviewed against the interaction-design rubric and fixed: "not you?" now asks before the browser forgets an identity (it was a one-click way to lose your on-time record on that device); any UNAUTHORIZED answer anywhere re-prompts for a name without losing the page you were on, instead of leaving a dead page; opening a plan link with no identity says "Someone sent you a plan" and the button reads "See the plan"; the plan page shows a loading line and the organizer gets a copy-link button next to the title, since sharing is their first job; the record page's back link returns to the plan you came from; buttons have a 40 px minimum height for thumbs; the tab title names the plan. The Vue code is now type-checked (`vue-tsc`) as part of `bun run check`, which it had not been before.

## What remains for P4

- Move the identity secret into an HttpOnly cookie (needs `PUBLIC_ORIGIN` wiring on the platform).
- Push-based live updates instead of polling.
- Decide whether a plan page should hide names from people who haven't responded.
- A way to recover an identity on a new device (a short code).
