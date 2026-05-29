# 0008 — Encryption at rest

> **Status:** planned · **Phase:** roadmap (Phase 3)

## Goal

Optionally encrypt a vault on disk with a user passphrase, so even local files are unreadable without the key. Strengthens the privacy guarantee and is a prerequisite for E2E sync (0007).

## User stories

- As a user, I can enable encryption with a passphrase.
- As a user, my entries are unreadable on disk without that passphrase.
- As a user, I can change my passphrase without re-encrypting from scratch (re-wrap key).

## Approach (sketch)

- **KDF:** passphrase → key via Argon2id (or scrypt). Random salt stored in vault metadata.
- **Cipher:** XChaCha20-Poly1305 (or AES-GCM) per entry/blob; random nonce per write.
- **Key wrapping:** a data key encrypted by the passphrase-derived key, so passphrase changes only re-wrap the data key.
- **Backend integration:** an encrypting wrapper around any `StorageAdapter` (decorator), so md/txt/sqlite all gain encryption without each reimplementing it. Note: encrypting markdown/txt sacrifices human-readability by design when enabled.

## Acceptance criteria (draft)

- [ ] On-disk content is ciphertext when encryption is on.
- [ ] Wrong passphrase fails closed; no partial plaintext leak.
- [ ] Passphrase change re-wraps without bulk re-encryption.
- [ ] Keys never written in plaintext; never logged; never in egress.

## Out of scope

- Hardware keys / biometrics (later). Per-entry sharing.

## Dependencies

- Wraps: `0001` adapters. Blocks: `0007`.

## Open questions

- KDF + cipher choice and a vetted crypto lib (avoid hand-rolled).
- Key storage UX: prompt every time vs OS keychain integration.
- Recovery: is there any recovery path, or is loss-of-passphrase = loss-of-data (state explicitly)?
