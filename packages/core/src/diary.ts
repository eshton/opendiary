// Open Diary — Diary service. The orchestration layer every app calls.
// Wraps a StorageAdapter and applies domain rules (id/timestamp generation, validation).
// Spec: docs/features/0002-cli-write-read.md

import type { Entry, EntrySummary, ListQuery, NewEntry } from "./entry.ts";
import { newEntry } from "./entry.ts";
import type { OpenDiaryConfig } from "./config/config.ts";
import type { StorageAdapter } from "./storage/adapter.ts";
import { createAdapter } from "./storage/factory.ts";

/**
 * Single entry point for diary operations. Apps construct one Diary
 * (via openDiary) and never touch adapters directly.
 */
export class Diary {
  constructor(private readonly storage: StorageAdapter) {}

  /** Create a new entry from caller input (id/timestamps generated here). */
  async write(input: NewEntry): Promise<Entry> {
    return this.storage.create(newEntry(input));
  }

  async get(id: string): Promise<Entry | null> {
    return this.storage.read(id);
  }

  async list(query?: ListQuery): Promise<EntrySummary[]> {
    return this.storage.list(query);
  }

  /** Patch an entry; `updatedAt` is stamped here, id/createdAt are protected. */
  async edit(id: string, patch: Partial<Entry>): Promise<Entry> {
    const { id: _id, createdAt: _createdAt, ...safe } = patch;
    return this.storage.update(id, { ...safe, updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<void> {
    return this.storage.remove(id);
  }
}

/** Build a ready-to-use Diary from config: construct adapter, init it, wrap it. */
export async function openDiary(config: OpenDiaryConfig): Promise<Diary> {
  const adapter = createAdapter(config);
  await adapter.init();
  return new Diary(adapter);
}
