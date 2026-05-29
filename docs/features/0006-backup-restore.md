# 0006 — Backup / restore

> **Status:** planned · **Phase:** roadmap (Phase 2)

## Goal

Snapshot a vault and restore it, so a user never loses their diary — stored wherever they choose (local disk for now; cloud/LAN via 0007).

## User stories

- As a user, I can take a timestamped snapshot of my vault.
- As a user, I can restore a vault from a snapshot.
- As a user, I can schedule automatic local backups.

## Interface contract (sketch)

```
opendiary backup [--out DIR]                 # writes vault-<timestamp>.zip
opendiary restore <snapshot> [--into DIR] [--force]
opendiary backup --schedule <cron|interval>  # local scheduler config
```

## Storage interaction

Backup operates at the vault/file level (copy the storage location + config), independent of backend internals. For sqlite, use a consistent snapshot (e.g. `VACUUM INTO` / online backup) rather than copying an open file.

## Acceptance criteria (draft)

- [ ] Snapshot + restore reproduces the vault exactly.
- [ ] Restore refuses to overwrite without `--force`.
- [ ] sqlite snapshots are consistent (no torn writes).
- [ ] Backups stay local unless a 0007 destination is configured.

## Out of scope

- Remote/cloud targets (→ 0007). Encryption (→ 0008).

## Dependencies

- Depends on: `0001`, `0004`. Pairs with: `0005`, `0007`.

## Open questions

- Snapshot format: zip vs folder vs backend-native.
- Retention policy (keep last N).
- Scheduler: OS cron/launchd vs in-app daemon.
