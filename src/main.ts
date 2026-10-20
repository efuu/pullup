import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { assembleApplication } from "./assembly.ts";
import { db } from "./db.ts";
import { policy } from "./http.ts";

const application = assembleApplication();
const gateway = createGateway({ application });
const api = createHttpHandler({ application, gateway, policy });

// The built Vue app, served by the backend in production (the platform runs no Vite).
const dist = `${import.meta.dir}/../dist`;

const server = Bun.serve({
  hostname: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 3000),
  async fetch(request) {
    const file = Bun.file(dist + new URL(request.url).pathname);
    return new Response((await file.exists()) ? file : Bun.file(`${dist}/index.html`));
  },
  routes: {
    "/api/*": api,
    "/health": async () => {
      try {
        await db.collection("planning.plans").findOne({}, { maxTimeMS: 2000, timeoutMS: 3000 });
        return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
      } catch {
        return Response.json(
          { status: "unavailable" },
          { status: 503, headers: { "Cache-Control": "no-store" } },
        );
      }
    },
  },
});

console.log(`Backend listening on ${server.url}`);
