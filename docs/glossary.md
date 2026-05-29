# Glossary

Shared vocabulary. Use these terms consistently in code, specs, and UI.

- **Entry** — one diary record: id, date, optional title, body, tags, timestamps. Defined in `packages/core/src/entry.ts`.
- **EntrySummary** — lightweight projection of an Entry (no full body) for lists/previews.
- **Diary** — the service object apps call to operate on entries. Wraps an adapter. `packages/core/src/diary.ts`.
- **Vault** — the on-disk location holding a user's entries + config for one diary (a folder, or a sqlite file + config). A user may have more than one.
- **StorageAdapter** — the interface every storage backend implements. The pluggability seam. `packages/core/src/storage/adapter.ts`.
- **Backend / Storage kind** — a concrete adapter: `markdown` (default), `text`, `sqlite`.
- **Config** — chooses the backend and data location for a vault. `packages/core/src/config/config.ts`.
- **Face** — one of the three interfaces over the core: CLI, web, desktop.
- **Egress** — any data leaving the machine. Core has none. Only explicit export/backup/sync produces egress.
- **Export / Import** — user-initiated bulk move of entries out of / into a vault, including backend migration.
- **Backup / Restore** — snapshot of a vault and its recovery.
- **Sync** — opt-in replication of a vault across the user's own locations (their cloud, or LAN device-to-device), end-to-end encrypted.
