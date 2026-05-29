# Architecture

Open Diary is **one domain core with three faces**. The core owns all diary logic and persistence. The CLI, web server, and desktop app are thin shells that call into it.

```
            ┌────────────┐   ┌────────────┐   ┌──────────────┐
            │  apps/cli  │   │  apps/web  │   │ apps/desktop │
            │  (Bun TS)  │   │ (Bun serve)│   │   (Tauri)    │
            └─────┬──────┘   └─────┬──────┘   └──────┬───────┘
                  │                │                 │
                  └────────────────┴─────────────────┘
                                   │  calls
                          ┌────────▼─────────┐
                          │  @opendiary/core │
                          │   Diary service  │
                          └────────┬─────────┘
                                   │  StorageAdapter interface
                 ┌─────────────────┼──────────────────┐
                 │                 │                  │
          ┌──────▼─────┐    ┌──────▼─────┐     ┌──────▼─────┐
          │ markdown   │    │   text     │     │  sqlite    │   ← + future backends
          │ (default)  │    │            │     │ bun:sqlite │
          └────────────┘    └────────────┘     └────────────┘
                 │                 │                  │
                 └─────────────── local disk only ────┘
```

## Layers

- **`Entry` / `EntrySummary` / `ListQuery`** (`packages/core/src/entry.ts`) — the domain model. Adapter-independent.
- **`Diary`** (`packages/core/src/diary.ts`) — orchestration: id/timestamp generation, validation, then delegate to the adapter. Every app uses this; nothing else.
- **`StorageAdapter`** (`packages/core/src/storage/adapter.ts`) — the pluggability seam. `create / read / list / update / remove / init`.
- **Adapters** — `markdown.ts` (default), `text.ts`, `sqlite.ts`. Each is one file implementing the interface.
- **`createAdapter(config)`** (`packages/core/src/storage/factory.ts`) — config → concrete adapter.
- **Config** (`packages/core/src/config/config.ts`) — chooses backend + data location. Default markdown.

## Invariants

1. **No network egress in `packages/core`.** This is *where* the privacy guarantee is enforced. Grep guard in CI.
2. **Web server binds `127.0.0.1`.** `apps/web/src/server.ts` hard-codes the loopback host.
3. **No diary logic in apps.** If an app needs domain behavior, it goes in core.
4. **Storage is swappable without app changes.** New backend = new adapter file + factory case.
5. **Plain-text first.** Default markdown keeps user data readable and portable without Open Diary.

## Data flow (write, once implemented)

```
CLI/web/desktop  →  Diary.write(NewEntry)
                 →  newEntry(): generate id (ULID), fill date + timestamps
                 →  StorageAdapter.create(Entry)
                 →  markdown adapter writes <date>-<slug>.md with front-matter
```

## Why this shape (agentic engineering)

- A fresh agent session implements **one adapter** or **one app command** against a fixed interface and a written spec — no cross-cutting reasoning required.
- The `StorageAdapter` contract means storage backends are independent, parallelizable work.
- Specs in `docs/features/` carry the design decisions so sessions don't re-litigate them.
