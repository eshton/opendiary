// Open Diary — StorageAdapter contract.
// This interface is THE seam that makes storage pluggable (md / txt / sqlite / future).
// Spec: docs/features/0001-storage-adapters.md
//
// INVARIANT: implementations touch local disk only. No network egress, ever.

import type { Entry, EntrySummary, ListQuery } from "../entry.ts";

/** Every storage backend implements this. Apps never touch a backend directly. */
export interface StorageAdapter {
  /** Prepare the backend (create dirs, run migrations, open db). Idempotent. */
  init(): Promise<void>;

  /** Persist a new entry. Returns the stored entry. */
  create(entry: Entry): Promise<Entry>;

  /** Fetch one entry by id, or null if absent. */
  read(id: string): Promise<Entry | null>;

  /** List entry summaries matching the query. */
  list(query?: ListQuery): Promise<EntrySummary[]>;

  /** Patch an existing entry; throws if id is unknown. */
  update(id: string, patch: Partial<Entry>): Promise<Entry>;

  /** Delete an entry by id. No-op if already absent. */
  remove(id: string): Promise<void>;
}

/** Identifies which backend to construct. Extend when adding a backend. */
export type StorageKind = "markdown" | "text" | "sqlite";
