# 0004 — Config & init

> **Status:** done · **Phase:** MVP

## Goal

Let a user initialize a vault and choose where/how their diary is stored, with a config file the CLI, web, and desktop all read.

## User stories

- As a user, I can run `opendiary init` to set up a vault in the current directory.
- As a user, I can pick markdown / text / sqlite at init.
- As a user, I can edit a config file to change backend or data location later.

## Interface contract

### CLI

```
opendiary init [--storage markdown|text|sqlite] [--dir PATH] [--force]
    Writes a config file + creates the storage location. --force overwrites.
    Default: markdown, entries under ./entries.
```

### Core API (`@opendiary/core`)

```ts
function defaultConfig(baseDir: string): OpenDiaryConfig;          // markdown @ <baseDir>/entries
function loadConfig(cwd: string): Promise<OpenDiaryConfig>;        // find+parse+validate, else defaults
function resolveConfigPath(cwd: string): string | null;           // search order
function validateConfig(raw: unknown): OpenDiaryConfig;           // runtime-validate untrusted JSON
function openDiary(config: OpenDiaryConfig): Promise<Diary>;       // createAdapter → init → new Diary
```

### Config file

- Name/location search order (decide + document): e.g. `./.opendiary/config.json` → `$XDG_CONFIG_HOME/opendiary/config.json` → OS default.
- Shape = `OpenDiaryConfig` (already typed in `config/config.ts`): `version`, `storage` (discriminated union), optional `web.port`.

## Storage interaction

`openDiary` calls `createAdapter(config)` then `adapter.init()`. `init` command also calls `adapter.init()` to create dirs/db.

## Acceptance criteria

- [ ] `init` creates config + storage location; refuses to clobber without `--force`.
- [ ] `loadConfig` returns a valid config or sensible defaults; `validateConfig` rejects malformed JSON with a clear error.
- [ ] All three faces resolve the same config the same way.
- [ ] Config selecting sqlite vs markdown actually changes the active backend.
- [ ] Config search order documented in this file once decided.

## Out of scope

- Multiple-vault management UX (note the term "Vault" exists; full multi-vault is later).
- Secrets/keys in config (→ 0008).

## Files to create / modify

- `packages/core/src/config/config.ts` — implement the functions stubbed there.
- `packages/core/src/diary.ts` — implement `openDiary`.
- `apps/cli/src/index.ts` (+ commands) — `init`.
- `packages/core/src/config/*.test.ts`.

## Dependencies

- Blocks: `0002`, `0003`. Depends on: `0001`.

## Open questions

- Exact config search order + whether vault config is project-local, global, or both.
- Validation approach: hand-rolled type guards (zero-dep) vs a schema lib.
