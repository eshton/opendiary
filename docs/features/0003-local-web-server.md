# 0003 — Local web server

> **Status:** done · **Phase:** MVP

## Goal

Run a local-only web app (`bun.serve`, `127.0.0.1`) that lets the user write and browse entries through a browser, over the same core as the CLI.

## User stories

- As a user, I can run `opendiary` web / `bun run dev:web` and open a local page.
- As a user, I can write a new entry in the browser.
- As a user, I can browse, search, and read past entries.

## Interface contract

### HTTP API (`/api/*`, JSON)

```
GET    /api/entries?tag=&from=&to=&search=&limit=&offset=&order=   → EntrySummary[]
POST   /api/entries        body: NewEntry                          → Entry (201)
GET    /api/entries/:id                                            → Entry | 404
PATCH  /api/entries/:id    body: Partial<Entry>                    → Entry
DELETE /api/entries/:id                                            → 204
GET    /api/health                                                 → { ok: true }
```

### UI

- **Stack: React + TypeScript + Tailwind CSS.** Built/bundled with Bun (`Bun.build` or `bun build`), assets emitted to a `dist/` the server serves. Single-page app.
- Single-page app served for non-API routes (replace `apps/web/src/ui/index.html` placeholder, which becomes the React mount point).
- Minimum views: list, entry detail, new/edit form.
- All assets bundled locally — no CDN/remote origins (offline + privacy guarantee).

### Networking

- `hostname: "127.0.0.1"` fixed. Port from `config.web.port` / `OPENDIARY_PORT`, default `4747`.

## Storage interaction

API handlers call `openDiary(config)` once at startup and reuse the `Diary` for all requests.

## Acceptance criteria

- [ ] Server binds `127.0.0.1` only; not reachable from another host.
- [ ] All six API routes work against the default backend.
- [ ] UI can create, list, read, edit, delete.
- [ ] Switching backend in config changes where the web app reads/writes — no code change.
- [ ] No diary logic in `apps/web` beyond request↔core mapping.
- [ ] No third-party network calls from the page (no CDNs that phone home; bundle assets).

## Out of scope

- Auth (it's local + single-user). Multi-user. Remote access. Real-time sync.

## Files to create / modify

- `apps/web/src/server.ts` — wire routes to core; serve built UI from `dist/`.
- `apps/web/src/ui/*` — React + TS app: mount, `QueryClientProvider`, `api.ts` (typed fetch client), query hooks, components, `index.css` with `@import "tailwindcss";`.
- `apps/web/build.ts` — Bun build script using `bun-plugin-tailwind` for the UI bundle.
- `apps/web/src/*.test.ts` — API tests.

## Dependencies

- Depends on: `0001`, `0004`. Sibling of: `0002`. Consumed by: `0009` (desktop wraps this UI).

## Decisions

- **UI stack: React + TypeScript + Tailwind CSS v4**, bundled by Bun, served locally (no CDN).
- **Tailwind v4** — zero-config, `@import "tailwindcss"` in `index.css`, via `bun-plugin-tailwind`. No `tailwind.config` / postcss unless customization forces it.
- **Data layer: TanStack Query** (`@tanstack/react-query`) over a thin typed `fetch` client wrapping `/api/*`. Query keys per resource; mutations invalidate on write.
