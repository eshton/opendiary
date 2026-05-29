# NNNN — <Feature name>

> **Status:** planned · **Phase:** MVP | roadmap
> Copy this file to `NNNN-kebab-name.md` and fill every section. A fresh agent
> session should be able to execute the spec without asking design questions.

## Goal

One sentence: what this feature delivers.

## User stories

- As a user, I can …
- As a user, I can …

## Interface contract

Exact surface this feature adds. Pick what applies:

- **CLI:** commands, flags, stdin/stdout/exit-code behavior.
- **HTTP:** routes, methods, request/response JSON shapes.
- **Core API:** function/class signatures added to `@opendiary/core`.

## Storage interaction

Which `StorageAdapter` methods are used and how. New backend behavior, if any.

## Acceptance criteria

- [ ] …
- [ ] …
- [ ] Privacy guarantee preserved (no new egress; web stays on `127.0.0.1`).

## Out of scope

- Explicit non-goals so the session doesn't gold-plate.

## Files to create / modify

- `path/to/file.ts` — what changes.

## Dependencies

- Depends on: `NNNN-…`
- Blocks: `NNNN-…`

## Open questions

- Anything genuinely undecided (flag for the user, don't guess).
