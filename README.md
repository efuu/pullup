# PullUp

A plan page you paste into the group chat: who is actually coming, who has actually left, and who was actually on time.

6.1040 personal project, Fall 2026. Dylan Wang.

**Live:** https://pullup.mit-sdg.dev

## Running it

Bun, MongoDB (in a Podman container), sync-engine, Vue.

```sh
cp .env.example .env
bun install
bun run dev          # MongoDB on 27018, backend on :3000, Vite frontend on :5173
```

Open http://127.0.0.1:5173. To watch two people, open the link in a second browser or a private window (identity is per browser).

### Tests

```sh
bun run db:up        # MongoDB in a container on 127.0.0.1:27018 (needs Podman; see compose.yaml)
bun run test         # 24 tests: one suite per concept + the whole journey over HTTP
bun run test:save    # same, and saves the output to tests/last-run.txt
TEST_MONGO=memory bun run test   # no container: starts a temporary MongoDB for the run
```

Each test file gets its own fresh, randomly named database and drops it afterwards, so tests never touch app data. The saved output of the submitted run is in [`tests/last-run.txt`](tests/last-run.txt) (summary) and [`tests/last-run.xml`](tests/last-run.xml) (every test by name, JUnit format). `bun run check:design && bun run generate && bun run check` validates the design files, regenerates artifacts, checks the code against the design, and type-checks both the backend and the Vue frontend.

### Production build

```sh
bun run preview      # builds the Vue app and serves it from the backend on http://127.0.0.1:3000
```

## Beta (P3)

- Demo video (narrated): PASTE P3 YOUTUBE LINK HERE
- [Visual design study](design/visual-study.md) and the [validation log](design/validation.md)
- [User journey](design/user-journey.md) (updated for the beta) and the [implementation notes](design/implementation-notes.md) (P3 section at the end)
- Design notebook: in the private repo, [efuu/6.1040 → reflections/design-notebook.md](https://github.com/efuu/6.1040/blob/main/reflections/design-notebook.md)

## Alpha (P2)

- Demo video (1:52, narrated): https://youtu.be/y0pv6dCswGQ
- [Implementation notes](design/implementation-notes.md): the journey the alpha demonstrates, the plan, what changed from P1 and why, what the checks caught, what remains for P3.
- Specs are the ones in [`design/concepts/`](design/concepts/); [`design/compositions/`](design/compositions/) explains every endpoint, reaction, view and former; [`design/types.md`](design/types.md) binds the generic types.
- Code: [`src/concepts/`](src/concepts/) (MongoDB concept classes + registrations), [`src/compositions/`](src/compositions/) (endpoints, reactions, views, formers), [`tests/concepts/`](tests/concepts/), [`web/`](web/) (Vue).

## Design (P1)

- [Problem framing and stakeholders](design/problem-framing.md)
- [Application pitch](design/pitch.md)
- [Concept design](design/concepts.md): concept specifications, essential reactions, and a note on each concept's role
  - individual spec files, in sync-engine format: [`design/concepts/`](design/concepts/)
- [UI sketches](design/sketches.md)
- [User journey](design/user-journey.md)
