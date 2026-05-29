# 0005 — Import / export

> **Status:** planned · **Phase:** roadmap (Phase 2)

## Goal

Move diary data in and out: bulk export a vault, import from files/other tools, and migrate between backends — all locally, all user-initiated.

## User stories

- As a user, I can export my whole diary to a folder/zip I control.
- As a user, I can import existing `.md`/`.txt` notes into a vault.
- As a user, I can migrate from markdown to sqlite (or back) without losing data.

## Interface contract (sketch)

```
opendiary export [--format md|json|zip] [--out PATH] [--from D] [--to D]
opendiary import <path> [--format md|txt|json] [--tag t]...
opendiary migrate --to markdown|text|sqlite [--dir PATH | --path FILE]
```
Core: `exportVault`, `importEntries`, `migrate(srcAdapter, dstAdapter)` — migrate is just `list`+`read` from source, `create` into destination (adapters already provide this).

## Storage interaction

Reuses `StorageAdapter` on both sides. Migration = stream entries source → destination. No new adapter methods needed.

## Acceptance criteria (draft)

- [ ] Export → import round-trips with no data loss.
- [ ] Migration between all backend pairs preserves ids, dates, tags, timestamps.
- [ ] Export artifact is openable without Open Diary (plain md/json).
- [ ] Export/import are explicit; nothing happens automatically.

## Out of scope

- Cloud destinations (→ 0007). Encryption of exports (→ 0008).

## Dependencies

- Depends on: `0001`, `0004`.

## Open questions

- Import format detection / mapping from popular apps (Day One, Obsidian, Journey?).
- Conflict handling on import (duplicate ids/dates).
