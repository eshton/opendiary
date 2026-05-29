// Open Diary local web server.
// Thin shell over @opendiary/core. Serves a local-only UI + JSON API.
// Spec: docs/features/0003-local-web-server.md
//
// INVARIANT: bind to loopback only. Never expose the diary on a network interface.

import { openDiary, loadConfig, type ListQuery } from "@opendiary/core";
import index from "./index.html";

const HOST = "127.0.0.1"; // do not change — privacy guarantee
const PORT = Number(process.env.OPENDIARY_PORT ?? 4747);

const diary = await openDiary(await loadConfig(process.cwd()));

const server = Bun.serve({
  hostname: HOST,
  port: PORT,
  development: process.env.NODE_ENV !== "production",

  routes: {
    // Single-page React app (Bun bundles the referenced .tsx/.css).
    "/": index,

    "/api/health": () => Response.json({ ok: true }),

    "/api/entries": {
      GET: async (req) => Response.json(await diary.list(parseQuery(new URL(req.url)))),
      POST: async (req) => {
        const body = (await req.json()) as { body?: unknown };
        if (typeof body.body !== "string" || body.body.trim() === "") {
          return Response.json({ error: "body is required" }, { status: 400 });
        }
        const entry = await diary.write(body as Parameters<typeof diary.write>[0]);
        return Response.json(entry, { status: 201 });
      },
    },

    "/api/entries/:id": {
      GET: async (req) => {
        const entry = await diary.get(req.params.id);
        return entry
          ? Response.json(entry)
          : Response.json({ error: `not found: ${req.params.id}` }, { status: 404 });
      },
      PATCH: async (req) => {
        try {
          const patch = (await req.json()) as Record<string, unknown>;
          return Response.json(await diary.edit(req.params.id, patch));
        } catch (err) {
          return notFoundOr500(err);
        }
      },
      DELETE: async (req) => {
        await diary.delete(req.params.id);
        return new Response(null, { status: 204 });
      },
    },
  },

  error(err) {
    return Response.json({ error: err.message }, { status: 500 });
  },
});

console.log(`Open Diary web — http://${server.hostname}:${server.port} (local only)`);

/** Map URL search params → ListQuery. */
function parseQuery(url: URL): ListQuery {
  const p = url.searchParams;
  const limit = p.get("limit");
  return {
    tag: p.get("tag") ?? undefined,
    from: p.get("from") ?? undefined,
    to: p.get("to") ?? undefined,
    search: p.get("search") ?? undefined,
    limit: limit != null ? Number(limit) : undefined,
    order: (p.get("order") as ListQuery["order"]) ?? undefined,
  };
}

function notFoundOr500(err: unknown): Response {
  const message = err instanceof Error ? err.message : String(err);
  const status = message.includes("not found") ? 404 : 500;
  return Response.json({ error: message }, { status });
}
