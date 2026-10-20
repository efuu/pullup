# Validation log (P3)

What was checked for the beta, how, and what is still open. Automated results are in [`../tests/last-run.txt`](../tests/last-run.txt).

## Automated

- `bun run check:design`, `bun run generate`, `bun run check`: design grammar, spec-vs-source, pinned artifacts, backend typecheck, and the Vue typecheck (`vue-tsc`). All pass.
- `bun run test` (24 tests, 6 files):
  - One suite per concept (`tests/concepts/`). Each runs the operational principle as a sequence of actions, then the variants (change your answer, cancel, repeat, two people on one event), then every refusal, asserting both the error class and that the refused action changed nothing. Every action of every concept runs in at least one test.
  - `tests/journey.test.ts` starts the real backend on a free port with an empty, randomly named database and drives the beta journey over HTTP: claiming names, invalid input admission, creating a plan, the organizer auto-response, a maybe lapsing at decide-by while the answer is kept, a new maybe refused after it, reschedule and cancel refused for a non-organizer, pulling up, correcting the estimate, arriving, the on-time record written by the reaction, the record visible to a plan-mate and refused to a stranger, renaming, and cancel closing responses.
- Tests use a fresh database per file (`tests/db.ts`), created through the concepts' own actions, dropped afterwards. `TEST_MONGO=memory bun run test` runs without the container.

## In the browser, on the production build

Checked on `bun run preview` (the build the platform runs), in one browser as the organizer. Two-person interactions (a second identity responding, the other person's page updating) are covered by `tests/journey.test.ts`, which plays three people against the real backend; they were not re-checked by hand in two browser windows for this milestone.

| Journey step | How | Result |
|---|---|---|
| Claim a name; reload | hand | identity persists; "not you?" asks before the browser forgets you; a lost or invalid identity re-prompts for a name without losing the page you were on |
| Change name | journey test | same user, every record kept |
| Create a plan | hand | lands on the plan page already counted as going; inline refusals for blank title, past start, decide-by after start; the server-side refusal for a past start is in the journey test |
| Second person responds; count and list update | journey test | going / maybe / can't recorded per person; an invalid status is refused at the boundary |
| Decide-by passes | journey test + hand | the maybe is kept as given but reads as lapsed (listed under "never decided", not counted as coming) and a new maybe is refused; hand: the Maybe button is disabled with a tooltip, and the lapsed person sees a note asking for Going or Can't |
| Reschedule / cancel as non-organizer | journey test | FORBIDDEN; hand: the controls are not rendered for a non-organizer |
| Reschedule as organizer | journey test | new time stored and shown on the next view; hand: inline refusal for a past time |
| Cancel as organizer | hand | two-step confirm; red banner; response and day-of controls disappear; journey test: responses closed, responding refused, cancelling twice refused |
| Pulling up / fix estimate / pulled up | hand (pulling up, pulled up) + journey test (fix estimate, second pulling-up refused) | board row and dot update within 3 s without a refresh |
| Arrival writes the record | hand + journey test | "on time 1/1" tag appears after arriving; the minutes-late arithmetic is in the concept tests |
| Record page | journey test | visible to a plan-mate, FORBIDDEN to a stranger; hand: the sentence shown for FORBIDDEN |
| Mistyped plan link | hand | "That plan doesn't exist, or the link is wrong." |
| Phone width (375 px) | hand | header, forms and buttons wrap; nothing overflows |
| Health, static files, deep-link reload | curl | `/health` ok; `/` and `/anything` serve the app |

## Open problems

- If the organizer reschedules after people have arrived, the board's "+N" (from the current start time) and the record's minutes late (fixed when the arrival happened) can disagree. Rescheduling after the start is rare; a later fix is to refuse it in Planning.

- Plan pages are readable by anyone with the link, by design (the link is the invite). A viewer who hasn't responded still sees names and on-time tags. Acceptable for a friends' tool; worth a sentence in the P5 user tests.
- Live updates are a 3-second poll, so two people acting within the same second can see a brief stale state.
- The secret lives in local storage; moving it to an HttpOnly cookie is still on the list.
- Safari in private mode forgets the identity on close; the page handles it by asking for a name again.
