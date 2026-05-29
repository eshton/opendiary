# 0002 — CLI write/read

> **Status:** done · **Phase:** MVP

## Goal

Make `opendiary` a usable diary from the terminal: create, list, read, edit, delete entries against the configured backend.

## User stories

- As a user, I can `opendiary write` and type or pipe in an entry.
- As a user, I can `opendiary list` to see my entries.
- As a user, I can `opendiary read <id>` to print one.
- As a user, I can edit and delete entries.

## Interface contract (CLI)

```
opendiary write [--title T] [--tag t]... [--date YYYY-MM-DD] [-m "text"]
    Body from -m, else stdin, else $EDITOR. Prints the new entry id. Exit 0.

opendiary list [--tag T] [--from D] [--to D] [--search Q] [--limit N] [--json]
    Table of summaries (id, date, title, tags). --json prints raw EntrySummary[].

opendiary read <id> [--json]
    Prints the entry. Non-zero exit if not found.

opendiary edit <id> [--title T] [--tag t]... [-m "text"]
    Patches given fields; opens $EDITOR for body if no -m.

opendiary delete <id> [--yes]
    Confirms unless --yes.

opendiary help | --help | -h        (already stubbed)
```

Exit codes: `0` ok, `1` usage/not-found error. Errors to stderr.

## Storage interaction

Via `@opendiary/core`:
- `openDiary(config)` → `Diary`.
- `Diary.write / list / get / edit / delete`.

Requires `openDiary(config)` and `Diary.write` from core (see 0001/0004 helpers).

## Acceptance criteria

- [ ] `write` then `read <id>` round-trips through the default (markdown) backend.
- [ ] Body sourced from `-m`, stdin, and `$EDITOR` all work.
- [ ] `list` filters (`--tag/--from/--to/--search/--limit`) map to `ListQuery`.
- [ ] `--json` emits machine-readable output for `list` and `read`.
- [ ] `delete` requires confirmation unless `--yes`.
- [ ] No diary logic in the CLI — only arg parsing + calls into core.

## Out of scope

- Interactive TUI. Import/export commands (→ 0005). Backup (→ 0006).

## Files to create / modify

- `apps/cli/src/index.ts` — replace stubs with command handlers.
- `apps/cli/src/commands/*.ts` — one file per command (optional split).
- `apps/cli/src/*.test.ts`.

## Dependencies

- Depends on: `0001`, `0004`. Sibling of: `0003`.

## Open questions

- Arg parser: bun/node `util.parseArgs` (zero-dep, preferred) vs a CLI lib.
- Default `$EDITOR` fallback (`vi`?) and behavior when not a TTY.
