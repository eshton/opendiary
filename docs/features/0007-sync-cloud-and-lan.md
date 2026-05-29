# 0007 — Sync (cloud vs LAN)

> **Status:** planned · **Phase:** roadmap (Phase 3)

## Goal

Opt-in replication of a vault across the user's *own* locations — their cloud storage or LAN devices — without Open Diary ever holding the data or the keys. Preserves the guarantee: only the user moves their data, and it's encrypted before it leaves.

## User stories

- As a user, I can sync my vault to my own cloud bucket/drive.
- As a user, I can sync directly between two of my devices on the same network.
- As a user, I trust that synced data is end-to-end encrypted and Open Diary runs no server.

## Approach (sketch)

- **Cloud:** user supplies their own remote (S3-compatible bucket, their Drive/Dropbox, etc.). Open Diary pushes/pulls encrypted blobs. Possibly leverage `rclone`-style remotes. No Open Diary-hosted service.
- **LAN:** device-to-device over local network (mDNS discovery + direct encrypted transfer). No internet hop.
- **Encryption:** mandatory E2E (depends on 0008 key management). Plaintext never leaves the machine.
- **Conflict model:** entries are append-mostly; need a merge/conflict strategy (last-write-wins per entry id, or CRDT-lite).

## Acceptance criteria (draft)

- [ ] Sync is explicit/opt-in and off by default.
- [ ] All synced bytes are encrypted before egress.
- [ ] No Open Diary-operated server is involved.
- [ ] Two devices converge to the same vault state; conflicts surfaced, not silently dropped.

## Out of scope

- Hosting a sync service. Sharing diaries with other people.

## Dependencies

- Depends on: `0008` (encryption), `0006` (snapshot semantics), `0001`/`0004`.

## Open questions

- Conflict resolution model (LWW vs CRDT).
- Which cloud remotes to support first; reuse rclone vs native SDKs.
- LAN transport + discovery + device pairing/trust UX.
