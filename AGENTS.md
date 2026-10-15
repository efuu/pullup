# PullUp

6.1040 personal project. Bun + MongoDB + sync-engine backend, Vue frontend.

## Running the app

- `bun run dev` starts MongoDB in a container (port 27018), then the backend at http://127.0.0.1:3000 and the Vite frontend at http://127.0.0.1:5173, both in watch mode.
- `bun run test` runs the concept test suites against the local MongoDB (database `pullup-test`).
- `bun run db:reset` deletes the local data.
- Change `design/` before the code. Check it with `bun run check:design`, then run `bun run generate` and `bun run check`.

## Layout

- `design/concepts/*.md` concept specs (the source of truth), `design/compositions/*.md` the reactions, endpoints, views and formers explained, `design/types.md` instances and bindings.
- `src/concepts/*.ts` concept classes (MongoDB), `src/concepts/*.registry.ts` registrations.
- `src/compositions/*.ts` endpoints, reactions, views, formers.
- `web/` the Vue frontend.
