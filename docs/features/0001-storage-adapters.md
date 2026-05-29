# 0001 — Storage adapters

> **Status:** done · **Phase:** MVP

## Goal

Implement the three storage backends behind `StorageAdapter` so entries can be read from and written to markdown files (default), plain-text files, or a SQLite DB — chosen by config.

## User stories

- As a user, I can keep my diary as readable `.md` files in a folder.
- As a user, I can keep it as `.txt` files instead.
- As a user, I can keep it in a single SQLite file for fast search.
- As a user, I can switch backend in config and the apps keep working.

## Interface contract

Implement, in `@opendiary/core`, the existing interface in `packages/core/src/storage/adapter.ts`:

```ts
interface StorageAdapter {
  init(): Promise<void>;
  create(entry: Entry): Promise<Entry>;
  read(id: string): Promise<Entry | null>;
  list(query?: ListQuery): Promise<EntrySummary[]>;
  update(id: string, patch: Partial<Entry>): Promise<Entry>;
  remove(id: string): Promise<void>;
}
```

Plus the `entry.ts` helpers used by all adapters:
- `newEntry(input: NewEntry): Entry` — generate id (ULID), default `date` to today, set `createdAt`/`updatedAt`.
- `slugForEntry(entry): string` — filesystem-safe `<date>-<title-or-id>`.

### Markdown adapter (default)

- File per entry: `<dir>/<date>-<slug>.md`.
- YAML front-matter for `id, date, title, tags, createdAt, updatedAt`; markdown body below.
- `list` scans the dir, parses front-matter, applies `ListQuery` (date range, tag, search, limit/offset, order).

### Text adapter

- File per entry: `<dir>/<date>-<slug>.txt`.
- Metadata in a sidecar `<file>.json` (front-matter isn't idiomatic in `.txt`). Body is the raw text.

### SQLite adapter

- `bun:sqlite`, imported lazily inside `init()`.
- `entries(id TEXT PRIMARY KEY, date TEXT, title TEXT, body TEXT, tags TEXT, createdAt TEXT, updatedAt TEXT)`.
- Consider FTS5 virtual table for `search`. `tags` stored as JSON array text.

## Storage interaction

This feature *is* the storage layer. All methods implemented for all three backends. `createAdapter` (factory) already routes config → adapter.

## Acceptance criteria

- [ ] All three adapters implement every `StorageAdapter` method.
- [ ] Round-trip test per backend: `create` → `read` returns an equal entry.
- [ ] `list` honors date range, tag filter, `search`, `limit`/`offset`, `order`.
- [ ] `update` merges patch and bumps `updatedAt`; renames file if slug changes (file backends).
- [ ] `remove` is a no-op on a missing id.
- [ ] Markdown files are human-readable and re-importable.
- [ ] No network egress (grep guard passes).

## Out of scope

- Encryption (→ 0008). Import/export (→ 0005). Migration between backends (→ 0005).

## Files to create / modify

- `packages/core/src/entry.ts` — add `newEntry`, `slugForEntry`.
- `packages/core/src/storage/markdown.ts`, `text.ts`, `sqlite.ts` — implement.
- `packages/core/src/storage/*.test.ts` — shared adapter conformance suite run against each backend.

## Dependencies

- Blocks: `0002`, `0003`. Pairs with: `0004` (config supplies the dir/path).

## Decisions

- **ID scheme: ULID** (lexicographically sortable, time-ordered). `newEntry()` generates ULIDs.
- **Front-matter parser: `gray-matter`** (`packages/core/package.json` dep). Handles `---` fence split + YAML parse on read; serialize fields + body on write in the markdown adapter.

## Open questions

- _(none — resolved)_
