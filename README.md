# PullUp

A plan page you paste into the group chat: who is actually coming, who has actually left, and who was actually on time. No accounts.

**Live:** https://pullup.mit-sdg.dev · 6.1040 personal project, Fall 2026, Dylan Wang.

## Demos

- Final video (P4): PASTE FINAL YOUTUBE LINK HERE
- Alpha video (P2, 1:52): https://youtu.be/y0pv6dCswGQ

## Design

- [Design document](design/design-document.md): final design, and how it differs from P1 and P3
- [Concept specs](design/concepts/) · [Compositions](design/compositions/) (endpoints, reactions, views, formers) · [Types and bindings](design/types.md)
- [Problem framing](design/problem-framing.md) · [Pitch](design/pitch.md) · [User journey](design/user-journey.md) · [UI sketches](design/sketches.md)
- [Visual design study](design/visual-study.md) · [Validation log](design/validation.md) · [Implementation notes](design/implementation-notes.md) (chronological)
- Design notebook: private repo, [efuu/6.1040 → reflections/design-notebook.md](https://github.com/efuu/6.1040/blob/main/reflections/design-notebook.md)

## Running locally

Needs [Bun](https://bun.com) and [Podman](https://podman.io) (for MongoDB).

```sh
cp .env.example .env
bun install
bun run dev          # MongoDB on 127.0.0.1:27018, backend on :3000, Vite frontend on :5173
```

Open http://127.0.0.1:5173. Identity is per browser, so use a private window for a second person.

```sh
bun run preview      # production build served by the backend on :3000, as the platform runs it
bun run db:reset     # wipe local data
```

## Tests

```sh
bun run db:up
bun run test                     # 24 tests: one suite per concept + the journey over HTTP
bun run test:save                # same, saves tests/last-run.txt and tests/last-run.xml
TEST_MONGO=memory bun run test   # no container: temporary MongoDB
bun run test:deployed            # persistence, access control, errors against the live app; saves tests/deployed-run.txt
bun run check                    # design files vs code, pinned artifacts, backend and Vue typecheck
```

Each test file gets a fresh, randomly named database and drops it afterwards.

## Layout

```
design/        specs, compositions, documents
src/concepts/  concept classes (MongoDB) + registrations
src/compositions/  endpoints, reactions, views, formers
tests/         concept suites, journey test, saved outputs
web/           Vue frontend
scripts/       smoke and deployed checks
```

Stack: Bun, MongoDB, [sync-engine](https://github.com/mit-sdg/sync-engine) 1.1.0, Vue 3.
