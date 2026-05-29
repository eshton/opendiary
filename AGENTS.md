# AGENTS.md — onboarding for agent sessions

Read this first. It tells you how Open Diary is organized and how to pick up work.

## What this is

Privacy-first diary app. Three faces (CLI, local web, Tauri desktop) over one shared core. The non-negotiable guarantee: **a user's entries never leave their computer unless they explicitly export/backup/sync**.

## How to start a coding session

1. Read [`docs/architecture.md`](docs/architecture.md) for the big picture.
2. Pick a feature spec in [`docs/features/`](docs/features/). MVP specs: `0001`–`0004`. Each spec is self-contained — interface contract, acceptance criteria, files to touch.
3. Implement against the spec. Update the spec's **Status** as you go (`planned → in-progress → done`).
4. Keep business logic in `@opendiary/core`. Apps stay thin.

## Invariants (do not break)

1. **No network egress in `packages/core`.** No `fetch`, no sockets, no HTTP clients. CI/grep guards this.
2. **Web server binds `127.0.0.1` only.** Never `0.0.0.0`, never a public interface.
3. **One core, many faces.** CLI/web/desktop must not duplicate diary logic — they call `@opendiary/core`.
4. **All persistence flows through `StorageAdapter`** (`packages/core/src/storage/adapter.ts`). New backend = new file implementing the interface + register in `factory.ts`. No app changes.
5. **Plain-text first.** Markdown is the default backend; user data must stay readable/portable without this app.

## Conventions

- Runtime: **Bun + TypeScript**, strict mode (`tsconfig.base.json`). Desktop shell is Rust/Tauri (later).
- Package names: `@opendiary/<name>`. Cross-package deps use `workspace:*`.
- Stub files carry `// TODO(feature-000X)` markers pointing at the spec that fills them in.
- Tests co-located as `*.test.ts`, run with `bun test`.
- Conventional Commits.

## Layout

```
packages/core/src/
  entry.ts              Entry domain model + helpers
  diary.ts              Diary service — CRUD orchestration over an adapter
  config/config.ts      config schema + resolution (default storage = markdown)
  storage/adapter.ts    StorageAdapter interface  ← the seam
  storage/markdown.ts   default backend
  storage/text.ts       plain-text backend
  storage/sqlite.ts     bun:sqlite backend
  storage/factory.ts    config → adapter
apps/cli/src/index.ts   CLI entry
apps/web/src/server.ts  local web server (127.0.0.1)
apps/desktop/           Tauri placeholder
```

## Verification

```bash
bun install
bun run typecheck
bun test
# privacy guard — must return nothing:
grep -rEn "fetch\(|node:http|node:net|XMLHttpRequest" packages/core/src
```
