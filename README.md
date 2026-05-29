# Open Diary

Privacy-first personal diary. **Your entries never leave your computer.**

Open Diary gives you three ways to keep a journal — a **CLI**, a **local web app**, and a **desktop app** — all over the same private, local-only data. You stay in total control of where your diaries live. Safekeeping is explicit and opt-in: import/export, backup/restore, and your choice of cloud or local-network methods (roadmap).

## Guarantee

Nothing you write is sent anywhere. The shared core has **zero network egress**, and the local web server binds to `127.0.0.1` only. The only data that ever leaves your machine is data **you** explicitly export, back up, or sync.

## Storage, your way

Entries are read from and written to a backend **you** choose — and you can switch:

| Backend  | Default | Notes |
|----------|:-------:|-------|
| Markdown | ✅      | One human-readable `.md` per entry. Git-friendly, portable, readable without Open Diary. |
| Text     |         | Plain `.txt` files. |
| SQLite   |         | Single DB file, fast search/queries (`bun:sqlite`). |

Adding a backend means implementing one `StorageAdapter` — no app changes.

## Monorepo

Bun workspaces.

```
packages/core    @opendiary/core    domain logic + pluggable storage adapters
apps/cli         @opendiary/cli     command-line interface (Bun + TS)
apps/web         @opendiary/web     local web server + React/TS/Tailwind UI (binds 127.0.0.1)
apps/desktop     @opendiary/desktop Tauri shell (placeholder; see docs/features/0009)
```

## Quickstart (dev)

> Requires [Bun](https://bun.sh) ≥ 1.1.

```bash
bun install
bun run typecheck
bun run dev:cli     # CLI
bun run dev:web     # local web server
```

## Status

Scaffolding stage. No diary read/write logic yet — feature specs live in [`docs/features/`](docs/features/) and are written to be executed by agent sessions. Start with [`docs/architecture.md`](docs/architecture.md) and [`AGENTS.md`](AGENTS.md).

See the [roadmap](docs/roadmap.md) for what's planned.
