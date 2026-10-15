# PullUp

A plan page you paste into the group chat: who is actually coming, who has actually left, and who was actually on time.

6.1040 personal project, Fall 2026. Dylan Wang.

## Running it

Bun, MongoDB (in a Podman container), sync-engine, Vue.

```sh
cp .env.example .env
bun install
bun run dev          # MongoDB on 27018, backend on :3000, Vite frontend on :5173
```

Open http://127.0.0.1:5173. To watch two people, open the link in a second browser or a private window (identity is per browser).

- `bun run test` runs the concept test suites (needs the database up).
- `bun scripts/smoke.ts` drives the whole user journey over HTTP against a fresh database.
- `bun run check:design && bun run generate && bun run check` validates design files, regenerates artifacts, and checks code against the design.

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
