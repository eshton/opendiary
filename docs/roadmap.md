# Roadmap

Phased. Each phase maps to feature specs in `docs/features/`. Privacy guarantee holds at every phase — anything leaving the machine is explicit and user-initiated.

## Phase 0 — Scaffolding ✅ (current)

Monorepo, shared core, storage-adapter seam, app shells, agent-ready specs. No diary logic yet.

## Phase 1 — MVP

Goal: usable diary via CLI and local web, with switchable storage.

- **0001 — Storage adapters.** Implement markdown (default), text, sqlite behind `StorageAdapter`.
- **0004 — Config & init.** `opendiary init`, config file, backend selection.
- **0002 — CLI write/read.** `write / list / read / edit / delete`.
- **0003 — Local web server.** `/api/*` over core + UI to write and browse on `127.0.0.1`.

Exit criteria: write an entry in the CLI, read it in the web UI, switch backend in config and it still works.

## Phase 2 — Safekeeping

Goal: never lose a diary; move it where you want.

- **0005 — Import/export.** Bulk export (zip of md / json), import from other tools and from each backend. Migrate between backends.
- **0006 — Backup/restore.** Snapshot + restore a vault. Scheduled local backups.

## Phase 3 — Multi-location & security

- **0007 — Sync (cloud vs LAN).** Opt-in sync: user-supplied cloud (their own bucket/drive) or local-network device-to-device. End-to-end encrypted; Open Diary never holds keys or runs a server.
- **0008 — Encryption at rest.** Passphrase-derived key, encrypted backends. Key management UX.

## Phase 4 — Desktop

- **0009 — Desktop (Tauri).** Wrap the web frontend in a native window. Offline-first, no browser.

## Cross-cutting (ongoing)

- Search across entries (drives `ListQuery.search`; sqlite FTS5).
- Tags, calendar/date navigation.
- Templates and prompts.
- Accessibility + keyboard-first UX in web/desktop.
